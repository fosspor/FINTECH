# ФИНБРО Release Notes

## Релиз

Релизный коммит: `РЕЛИЗ`.

## Состав

- Полный Docker Compose стек: PostgreSQL, Rust backend, Next.js frontend.
- Бренд в пользовательском интерфейсе приведен к «ФИНБРО».
- Backend API документирован через Swagger UI.
- Добавлена безопасная миграция для переименования имени героя в БД.
- Frontend собран и проверен через Next.js production build.
- Backend собран и проверен через Cargo.

## Запуск

```bash
docker compose up -d --build
```

Сервисы:

- Frontend: http://127.0.0.1:3100
- Backend Swagger UI: http://127.0.0.1:8000/swagger-ui/
- OpenAPI JSON: http://127.0.0.1:8000/api-docs/openapi.json
- PostgreSQL: `127.0.0.1:5433`

## Проверка

```bash
docker compose ps
docker compose logs -f backend
docker compose exec -T db pg_isready -U postgres -d finbro
```

## База данных

Данные хранятся в Docker volume `postgres_data`.

Удаление всех данных:

```bash
docker compose down -v
```

## Безопасность

- `backend/.env` игнорируется Git и не должен попадать в репозиторий.
- Реальные API-ключи нужно хранить только в окружении сервера или локальном `.env`.
- Уже примененные SQL-миграции нельзя изменять, только добавлять новые.
