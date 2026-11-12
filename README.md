# BuildCore

**Вариант 1.** Подбор комплектующих для компьютера.

Сайт для сборки конфигурации ПК: каталог, динамическая сборка, авторизация и заявки в SQLite.

Репозиторий: https://github.com/DaniilPascal/buildcore

## Деплой на Render (нужно сделать тебе)

Автоматически задеплоить не получается: Render просит вход и проходит hCaptcha — это только вручную.

### Что сделать

1. Открой ссылку:  
   https://render.com/deploy?repo=https://github.com/DaniilPascal/buildcore
2. Войди через **GitHub** (аккаунт `DaniilPascal`).
3. Пройди captcha / подтверди доступ Render к репозиторию, если спросит.
4. Нажми **Apply** / **Create Web Service**.
5. Дождись окончания Build (обычно 3–8 минут).
6. Открой выданный адрес вида `https://buildcore.onrender.com`.

Если Blueprint не сработает, создай сервис вручную:

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**
2. Подключи репозиторий `DaniilPascal/buildcore`
3. Настройки:
   - **Language / Runtime:** Docker  
     (или Python, тогда Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`)
   - **Branch:** `main`
   - **Instance type:** Free
   - **Health Check Path:** `/api/health`
4. **Create Web Service** → дождись Deploy Live

Демо-аккаунт на сайте: `demo@buildcore.local` / `demo1234`

После деплоя пришли мне URL — пропишу его в README.

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
