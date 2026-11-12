#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BuildCore — FastAPI + SQLite.

Локально:
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  python server.py

Прод / Docker:
  uvicorn server:app --host 0.0.0.0 --port $PORT
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.environ.get("BUILDCORE_DB_DIR", os.path.join(BASE_DIR, "database"))
DB_PATH = os.path.join(DB_DIR, "buildcore.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "database", "schema.sql")


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    os.makedirs(DB_DIR, exist_ok=True)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as schema_file:
        schema = schema_file.read()
    conn = get_connection()
    try:
        conn.executescript(schema)
        cols = [r[1] for r in conn.execute("PRAGMA table_info(users)").fetchall()]
        if "is_admin" not in cols:
            conn.execute(
                "ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"
            )

        demo = conn.execute(
            "SELECT id FROM users WHERE email = ?",
            ("demo@buildcore.local",),
        ).fetchone()
        if not demo:
            conn.execute(
                "INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 0)",
                ("Demo", "demo@buildcore.local", hash_password("demo1234")),
            )

        admin_email = "admin@buildcore.local"
        admin_pass = hash_password("123456")
        admin = conn.execute(
            "SELECT id FROM users WHERE email = ? OR lower(name) = ?",
            (admin_email, "admin"),
        ).fetchone()
        if admin:
            conn.execute(
                "UPDATE users SET name = ?, email = ?, password = ?, is_admin = 1 WHERE id = ?",
                ("admin", admin_email, admin_pass, admin["id"]),
            )
        else:
            conn.execute(
                "INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)",
                ("admin", admin_email, admin_pass),
            )
        conn.commit()
    finally:
        conn.close()


def user_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "is_admin": int(row["is_admin"]) if "is_admin" in row.keys() else 0,
        "created_at": row["created_at"],
    }


def order_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    try:
        data["items"] = json.loads(data.pop("items_json"))
    except (TypeError, json.JSONDecodeError):
        data["items"] = []
        data.pop("items_json", None)
    return data


class RegisterIn(BaseModel):
    name: str = Field(min_length=2)
    email: str
    password: str = Field(min_length=4)


class LoginIn(BaseModel):
    email: str
    password: str


class OrderIn(BaseModel):
    user_id: int
    phone: str = Field(min_length=10)
    comment: str = ""
    items: list[dict[str, Any]]
    total: int = Field(ge=0)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="BuildCore API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"ok": "true", "service": "BuildCore"}


@app.post("/api/register")
def register(payload: RegisterIn) -> dict[str, Any]:
    name = payload.name.strip()
    email = payload.email.strip().lower()
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Введите корректный email")

    conn = get_connection()
    try:
        try:
            cur = conn.execute(
                "INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 0)",
                (name, email, hash_password(payload.password)),
            )
            conn.commit()
        except sqlite3.IntegrityError as exc:
            raise HTTPException(
                status_code=409, detail="Такой email уже зарегистрирован"
            ) from exc

        row = conn.execute(
            "SELECT * FROM users WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return {"ok": True, "user": user_to_dict(row)}
    finally:
        conn.close()


@app.post("/api/login")
def login(payload: LoginIn) -> dict[str, Any]:
    login_value = payload.email.strip().lower()
    password = payload.password
    if not login_value or not password:
        raise HTTPException(status_code=400, detail="Заполните логин и пароль")

    conn = get_connection()
    try:
        row = conn.execute(
            """
            SELECT * FROM users
            WHERE password = ?
              AND (
                lower(email) = ?
                OR lower(name) = ?
                OR lower(email) LIKE ?
              )
            """,
            (
                hash_password(password),
                login_value,
                login_value,
                login_value + "@%",
            ),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Неверный логин или пароль")
        return {"ok": True, "user": user_to_dict(row)}
    finally:
        conn.close()


def require_admin(admin_id: int | None) -> sqlite3.Row:
    if not admin_id:
        raise HTTPException(status_code=401, detail="Нужен вход администратора")
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (admin_id,)).fetchone()
        if not row or not int(row["is_admin"] or 0):
            raise HTTPException(status_code=403, detail="Доступ только для администратора")
        return row
    finally:
        conn.close()


@app.get("/api/users")
def list_users(admin_id: int | None = None) -> dict[str, Any]:
    require_admin(admin_id)
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, name, email, is_admin, created_at FROM users ORDER BY id"
        ).fetchall()
        return {"ok": True, "users": [dict(row) for row in rows]}
    finally:
        conn.close()


@app.post("/api/orders")
def create_order(payload: OrderIn) -> dict[str, Any]:
    if not payload.items:
        raise HTTPException(status_code=400, detail="Сборка пуста")

    conn = get_connection()
    try:
        user = conn.execute(
            "SELECT id FROM users WHERE id = ?", (payload.user_id,)
        ).fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Пользователь не найден")

        cur = conn.execute(
            """
            INSERT INTO orders (user_id, phone, comment, items_json, total)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload.user_id,
                payload.phone.strip(),
                payload.comment.strip(),
                json.dumps(payload.items, ensure_ascii=False),
                payload.total,
            ),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM orders WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return {"ok": True, "order": order_to_dict(row)}
    finally:
        conn.close()


@app.get("/api/orders")
def list_orders(admin_id: int | None = None, user_id: int | None = None) -> dict[str, Any]:
    conn = get_connection()
    try:
        if user_id is not None and admin_id is None:
            rows = conn.execute(
                "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
                (user_id,),
            ).fetchall()
            return {"ok": True, "orders": [order_to_dict(row) for row in rows]}

        require_admin(admin_id)
        rows = conn.execute(
            """
            SELECT o.*, u.email AS user_email, u.name AS user_name
            FROM orders o
            JOIN users u ON u.id = o.user_id
            ORDER BY o.id DESC
            """
        ).fetchall()
        orders = []
        for row in rows:
            item = order_to_dict(row)
            item["user_email"] = row["user_email"]
            item["user_name"] = row["user_name"]
            orders.append(item)
        return {"ok": True, "orders": orders}
    finally:
        conn.close()


@app.get("/")
def root() -> FileResponse:
    return FileResponse(os.path.join(BASE_DIR, "index.html"))


@app.get("/{file_path:path}")
def static_file(file_path: str) -> FileResponse:
    if file_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")
    full = os.path.normpath(os.path.join(BASE_DIR, file_path))
    if not full.startswith(BASE_DIR) or not os.path.isfile(full):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(full)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    reload = os.environ.get("BUILDCORE_RELOAD", "1") == "1"
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=reload)
