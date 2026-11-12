# BuildCore

**Вариант 1.** Подбор комплектующих для компьютера.

Сайт для сборки конфигурации ПК с каталогом, динамической сборкой, авторизацией и заявками в SQLite.

## Онлайн (ПР 4)

После деплоя сайт открывается по HTTPS-адресу Render (см. раздел ниже).  
Демо-аккаунт: `demo@buildcore.local` / `demo1234`

## Локальный запуск

```bash
cd Oleg
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

Откройте [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Docker (ПР 4)

```bash
docker compose up --build
```

Или без Compose:

```bash
docker build -t buildcore .
docker run --rm -p 8000:8000 buildcore
```

## Деплой на Render

1. Репозиторий подключён к GitHub.
2. На [render.com](https://render.com) создайте Web Service из репозитория.
3. Runtime: **Docker** (используется `Dockerfile` + `render.yaml`).
4. Health check: `/api/health`.
5. После сборки Render выдаёт адрес вида `https://buildcore.onrender.com`.

Альтернатива без Docker: start command  
`uvicorn server:app --host 0.0.0.0 --port $PORT`

## Что сделано по практикам

| ПР | Содержание |
|---|---|
| 1 | HTML/CSS, 5+ страниц, адаптив, каталог |
| 2 | JavaScript, формы, сборка, ЦБ РФ / карта / погода |
| 3 | FastAPI + SQLite (`users`, `orders`), страница БД |
| 4 | Dockerfile, Compose, Render, HTTPS |

## Структура

```
Oleg/
├── server.py
├── Dockerfile
├── docker-compose.yml
├── render.yaml
├── Procfile
├── requirements.txt
├── database/schema.sql
├── js/ css/ images/
└── *.html
```

## Быстрая проверка

1. Откройте сайт по HTTPS.
2. Зарегистрируйтесь / войдите.
3. Добавьте детали в сборку и оформите заявку.
4. Откройте `/db.html` — записи из SQLite видны в таблицах.

> На бесплатном тарифе Render сервис «засыпает» без трафика ~15 минут, первый запрос может идти дольше. SQLite на бесплатном диске не персистентен между перезапусками — для учебной демонстрации этого достаточно.
