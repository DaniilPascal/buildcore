-- BuildCore — ПР №3
-- СУБД: SQLite | не более двух таблиц

PRAGMA foreign_keys = ON;

-- 1. Пользователи (регистрация / авторизация)
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 2. Заявки на сборку ПК (связаны с пользователем)
CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    phone      TEXT    NOT NULL,
    comment    TEXT    NOT NULL DEFAULT '',
    items_json TEXT    NOT NULL,
    total      INTEGER NOT NULL CHECK (total >= 0),
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
