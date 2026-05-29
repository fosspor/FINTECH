# FinBro - AI-наставник финансовых решений

## О проекте
FinBro — персональный AI-наставник, помогающий людям принимать правильные финансовые решения и постепенно формировать здоровые финансовые привычки через диалоговый интерфейс.

Это не банковское приложение, не трекер расходов и не сложный аналитический инструмент. Это компаньон, который слушает вас, анализирует ситуацию и дает индивидуальные советы.

### Стек технологий
* **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
* **Backend**: Rust, Axum, Tokio, SQLx
* **База данных**: PostgreSQL
* **AI/Voice**: Qwen (LLM), Whisper (STT), Yandex SpeechKit/GigaChat (TTS)
* **Инфраструктура**: Docker, Docker Compose

## Структура проекта
```
FINTECH/
├── frontend/          # Next.js 15 приложение (UI чата, мобильный интерфейс)
├── backend/           # Rust/Axum API сервисы
└── docker-compose.yml # Конфигурация для запуска всей системы
```

## Требования для запуска
* Docker и Docker Compose
* Node.js 20+ (для локальной разработки frontend)
* Rust (cargo) (для локальной разработки backend)

## Быстрый запуск с Docker (Ожидается)
*В процессе реализации*

## Локальная разработка

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Откройте [http://localhost:3000](http://localhost:3000)

### Backend
```bash
cd backend
cargo run
```
API будет доступно на `http://localhost:8000`

## Архитектура Backend
Модульная структура, включающая:
* `auth` - аутентификация и JWT
* `users` - управление пользователями
* `voice` - распознавание речи (STT через Whisper)
* `tts` - генерация речи
* `ai` - взаимодействие с Qwen (диагностика, диалог)
* `knowledge` - модуль локальной базы знаний и подготовки к RAG
* `financial_profile` - профили пользователей и история
* `consultations` - история общения и сессий

## Основные API Endpoints
* `POST /auth/register` - Регистрация
* `POST /auth/login` - Авторизация
* `POST /voice/transcribe` - Аудио в текст
* `POST /ai/chat` - Отправка сообщения AI наставнику
* `POST /ai/diagnose` - Анализ финансового профиля
* `GET /profile` - Получение профиля
* `GET /consultations` - Список консультаций
* `POST /consultations` - Новая консультация
* `POST /tts/generate` - Текст в аудио

## Дизайн
* Mobile-first
* Тёмная тема
* Минимализм и крупная типографика
* Разговорный UI с акцентом на сообщения ИИ
