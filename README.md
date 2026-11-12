# BuildCore

**Вариант 1.** Подбор комплектующих для компьютера.

Сайт для сборки конфигурации ПК: каталог, динамическая сборка, авторизация и заявки в SQLite.

## Онлайн

**Сайт:** https://buildcore-ex9h.onrender.com  

Репозиторий: https://github.com/DaniilPascal/buildcore

Админ: `/admin.html` · логин `admin` · пароль `123456`

Если после пуша в GitHub сайт старый — в Render Dashboard нажми **Manual Deploy → Deploy latest commit**.

## Локальный запуск

```bash
cd Oleg
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

Открой http://127.0.0.1:8000

## Docker

```bash
docker compose up --build
```

## Что сделано по практикам

| ПР | Содержание |
|---|---|
| 1 | HTML/CSS, страницы, адаптив, каталог |
| 2 | JavaScript, формы, сборка, ЦБ РФ / карта / погода |
| 3 | FastAPI + SQLite (`users`, `orders`) |
| 4 | Dockerfile, Compose, GitHub, деплой на Render |
