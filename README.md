# ФИНБРО - AI-наставник финансовых решений

ФИНБРО — персональный AI-наставник, который помогает пользователю разобраться с доходами, расходами, долгами, целями и привычками через короткий диалог, диагностику и персональный путь обучения.

## Что входит в релиз

- Регистрация, вход, JWT и refresh-токены.
- Диалог с AI-наставником ФИНБРО.
- Финансовая диагностика и сохранение профиля.
- Персональный путь, уровни, задания, квизы и начисление кристаллов.
- Онбординг, welcome/auth/chat/diagnosis/path/level/hero/games экраны.
- Swagger/OpenAPI-документация backend API.
- Docker Compose стек: frontend, backend, PostgreSQL.

## Стек

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion.
- **Backend**: Rust, Axum, Tokio, SQLx, Utoipa Swagger.
- **Database**: PostgreSQL 15.
- **AI/Voice**: YandexGPT/OpenAI-compatible fallback, Yandex SpeechKit TTS/STT endpoints.
- **Infrastructure**: Docker, Docker Compose.

## Структура

```text
FINTECH-main/
├── backend/              # Rust/Axum API, migrations, Dockerfile
├── frontend/             # Next.js приложение, UI и public assets
├── docker-compose.yml    # Полный стек: frontend + backend + db
├── README.md             # Документация запуска
└── ROADMAP.md            # План развития
```

## Быстрый запуск

Требуется установленный Docker Desktop.

```bash
docker compose up -d --build
```

После запуска:

- Frontend: http://127.0.0.1:3100
- Backend Swagger UI: http://127.0.0.1:8000/swagger-ui/
- OpenAPI JSON: http://127.0.0.1:8000/api-docs/openapi.json
- PostgreSQL: `127.0.0.1:5433`, database `finbro`, user `postgres`, password `postgres`

Проверка статуса:

```bash
docker compose ps
docker compose logs -f backend
```

Остановка:

```bash
docker compose down
```

Остановка с удалением данных БД:

```bash
docker compose down -v
```

## Переменные окружения

Файл `backend/.env` используется локально и не должен попадать в Git. Минимальный пример:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/finbro
JWT_SECRET=change_me
YANDEX_API_KEY=your_yandex_api_key
YANDEX_FOLDER_ID=your_yandex_folder_id
YANDEXGPT_MODEL=yandexgpt-5-pro/latest
YANDEX_SPEECHKIT_KEY=your_yandex_speechkit_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

В Docker Compose backend получает `DATABASE_URL=postgres://postgres:postgres@db:5432/finbro`, поэтому локальный `DATABASE_URL` из `.env` не мешает контейнерному запуску.

## Локальная разработка без Docker

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
cargo run
```

Для локального backend нужен PostgreSQL на `localhost:5432` или собственный `DATABASE_URL`.

## Основные API

- `POST /auth/register` - регистрация пользователя.
- `POST /auth/login` - вход и выдача токенов.
- `POST /auth/refresh` - обновление токенов.
- `POST /auth/logout` - выход и отзыв refresh-токена.
- `POST /ai/chat` - сообщение ФИНБРО.
- `POST /ai/diagnose` - диагностика и генерация персонального пути.
- `GET /users/me` - текущий пользователь, валюта, streak и герой.
- `GET /path` - активный персональный путь.
- `GET /levels/{id}` - уровень с заданиями.
- `POST /levels/{id}/quiz` - генерация квиза.
- `POST /tasks/{id}/complete` - завершение задания.
- `POST /tts/generate` - генерация аудио.
- `POST /voice/transcribe` - распознавание аудио.

Полный список доступен в Swagger UI.

## Проверки перед релизом

```bash
cd frontend && npm run lint && npm run build
cd backend && cargo check && cargo build
docker compose up -d --build
```

## Важные замечания

- Не коммитить `backend/.env` и реальные API-ключи.
- Не изменять уже примененные SQL-миграции: добавлять новую миграцию с новым timestamp.
- PostgreSQL данные хранятся в Docker volume `postgres_data`.
