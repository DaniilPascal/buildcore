# BuildCore

**Вариант 1.** Подбор комплектующих для компьютера.

Сайт для сборки конфигурации ПК с каталогом, динамической сборкой, авторизацией и заявками в SQLite.

## Онлайн (ПР 4)

**Рабочий адрес с HTTPS:**  
https://0591a7d8fb544d.lhr.life

Демо-аккаунт: `demo@buildcore.local` / `demo1234`

Репозиторий: https://github.com/DaniilPascal/buildcore

> Текущий публичный URL поднят через удалённый HTTPS-туннель к серверу приложения.  
> Для постоянного адреса на Render (как у учебных проектов на `*.onrender.com`) зайдите в аккаунт Render и создайте Web Service из этого репозитория — конфиг уже готов (`Dockerfile`, `render.yaml`).

Однокнопочный деплой:  
https://render.com/deploy?repo=https://github.com/DaniilPascal/buildcore

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

Или:

```bash
docker build -t buildcore .
docker run --rm -p 8000:8000 -e PORT=8000 buildcore
```

## Деплой на Render (постоянный HTTPS)

1. Откройте [render.com](https://render.com) и войдите (удобно через GitHub).
2. New → Blueprint / Web Service → репозиторий `DaniilPascal/buildcore`.
3. Runtime: **Docker** (берётся `Dockerfile`).
4. Health check path: `/api/health`.
5. После сборки появится адрес вида `https://buildcore.onrender.com`.

Альтернатива без Docker: start command  
`uvicorn server:app --host 0.0.0.0 --port $PORT`

## Что сделано по практикам

| ПР | Содержание |
|---|---|
| 1 | HTML/CSS, 5+ страниц, адаптив, каталог |
| 2 | JavaScript, формы, сборка, ЦБ РФ / карта / погода |
| 3 | FastAPI + SQLite (`users`, `orders`), страница БД |
| 4 | Dockerfile, Compose, GitHub, публичный HTTPS |

## Быстрая проверка онлайн

1. Откройте сайт по HTTPS-ссылке выше.
2. Войдите демо-аккаунтом или зарегистрируйтесь.
3. Добавьте комплектующие в сборку и оформите заявку.
4. Откройте `/db.html` — записи из SQLite видны в таблицах.

На бесплатном Render сервис может «засыпать» без трафика; первый запрос после паузы бывает дольше обычного.
