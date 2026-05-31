use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Arc;
use utoipa::ToSchema;
use crate::ai::client::call_ai;
use crate::auth::routes::user_id_from_headers;
use crate::docs::ErrorResponse;
use crate::AppState;
use uuid::Uuid;

#[derive(Deserialize, ToSchema)]
#[schema(example = json!({
    "message": "Мой доход 100000, траты 65000, есть кредитка",
    "context": "Пользователь хочет накопить подушку"
}))]
pub struct ChatRequestPayload {
    pub message: String,
    pub context: Option<String>,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "response": "Понял. Давай уточним кредитку: примерный остаток и минимальный платёж?",
    "error": null
}))]
pub struct ChatResponse {
    pub response: Option<String>,
    pub error: Option<String>,
}

#[derive(Deserialize, ToSchema)]
#[schema(example = json!({
    "chat_history": "Пользователь: доход 100000, обязательные расходы 65000, есть кредитка, хочу накопить подушку"
}))]
pub struct DiagnoseRequestPayload {
    pub chat_history: String,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "type": "кредитка",
    "amount": 120000,
    "monthly_payment": 8000
}))]
pub struct DebtSnapshot {
    pub r#type: String,
    pub amount: Option<i64>,
    pub monthly_payment: Option<i64>,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "monthly_income": 100000,
    "mandatory_expenses": 65000,
    "free_money": 35000,
    "has_credit": true,
    "debts": [{ "type": "кредитка", "amount": null, "monthly_payment": null }],
    "savings_months": null,
    "main_goal": "накопить подушку",
    "spending_leaks": ["доставка", "подписки"],
    "risk_zone": "red",
    "missing_fields": ["сумма и платёж по долгам"]
}))]
pub struct FinancialProfileSnapshot {
    pub monthly_income: Option<i64>,
    pub mandatory_expenses: Option<i64>,
    pub free_money: Option<i64>,
    pub has_credit: bool,
    pub debts: Vec<DebtSnapshot>,
    pub savings_months: Option<i64>,
    pub main_goal: Option<String>,
    pub spending_leaks: Vec<String>,
    #[schema(example = "yellow")]
    pub risk_zone: String,
    pub missing_fields: Vec<String>,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "main_problem": "Кредитная нагрузка мешает свободным деньгам",
    "main_risk": "Проценты и минимальные платежи могут съедать прогресс",
    "first_recommendation": "Выпиши все долги: остаток, ставку и минимальный платёж"
}))]
pub struct Diagnosis {
    pub main_problem: String,
    pub main_risk: String,
    pub first_recommendation: String,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "id": 1,
    "title": "Понять стоимость кредитки",
    "type": "lesson",
    "crystals": 30
}))]
pub struct LevelTask {
    pub id: i64,
    pub title: String,
    #[schema(example = "quiz")]
    pub r#type: String,
    pub crystals: i64,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "id": 1,
    "title": "Кредиты и долги",
    "description": "Кредитный Светофор показывает риски и помогает снижать переплату.",
    "icon_name": "AlertCircle",
    "tasks": [{ "id": 1, "title": "Понять стоимость кредитки", "type": "lesson", "crystals": 30 }]
}))]
pub struct Level {
    pub id: i64,
    pub title: String,
    pub description: String,
    #[schema(example = "Sprout")]
    pub icon_name: String,
    pub tasks: Vec<LevelTask>,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "profile": {
        "monthly_income": 100000,
        "mandatory_expenses": 65000,
        "free_money": 35000,
        "has_credit": true,
        "debts": [{ "type": "кредит/долг", "amount": null, "monthly_payment": null }],
        "savings_months": null,
        "main_goal": "накопить подушку",
        "spending_leaks": ["доставка", "подписки"],
        "risk_zone": "red",
        "missing_fields": []
    },
    "diagnosis": {
        "main_problem": "Кредитная нагрузка мешает свободным деньгам",
        "main_risk": "Проценты и минимальные платежи могут съедать прогресс",
        "first_recommendation": "Выпиши все долги: остаток, ставку и минимальный платёж"
    },
    "path": []
}))]
pub struct DiagnoseResponse {
    pub profile: FinancialProfileSnapshot,
    pub diagnosis: Diagnosis,
    pub path: Vec<Level>,
}

#[utoipa::path(
    post,
    path = "/ai/chat",
    tag = "ai",
    summary = "Chat with FinBro",
    description = "Sends a user message and optional conversation context to the AI mentor. The answer is short, friendly and focused on collecting financial profile data.",
    request_body(
        content = ChatRequestPayload,
        description = "User message and optional previous conversation context.",
        example = json!({
            "message": "Мой доход 100000, траты 65000, есть кредитка",
            "context": "Пользователь хочет накопить подушку"
        })
    ),
    responses(
        (status = 200, description = "FinBro response returned successfully.", body = ChatResponse,
            example = json!({
                "response": "Понял. Давай уточним кредитку: примерный остаток и минимальный платёж?"
            })
        ),
        (status = 400, description = "Invalid request body.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "Message is required" })
        ),
        (status = 503, description = "AI provider is unavailable.", body = ChatResponse,
            example = json!({ "error": "AI service unavailable" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn chat(
    Json(payload): Json<ChatRequestPayload>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    if payload.message.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new("bad_request", "Message is required")),
        ));
    }

    let system_prompt = r#"Ты FinBro — главный маскот-скрепка и персональный AI-наставник в Duolingo-like приложении про финансовые привычки.
Твоя задача — вести живой разговор, собрать финансовую ситуацию пользователя и подготовить его к персональному пути уровней.
Отвечай только от лица FinBro, коротко, дружелюбно и по-русски.
Не используй банковский жаргон. Не давай инвестиционных обещаний. Не говори, что ты отдельный внешний чат.
Если данных мало, задай один конкретный уточняющий вопрос.
Когда уже понятны доход, обязательные траты, долги/кредиты, подушка и цель, предложи нажать «Построить путь»."#;

    let prompt = match payload.context {
        Some(context) if !context.trim().is_empty() => {
            format!("История диалога:\n{}\n\nНовое сообщение пользователя:\n{}", context, payload.message)
        }
        _ => payload.message,
    };
    
    match call_ai(&prompt, Some(system_prompt)).await {
        Ok(response) => Ok(Json(json!({ "response": response }))),
        Err(e) => {
            tracing::error!("Failed to call AI: {}", e);
            Err((
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse::new("ai_unavailable", "AI service unavailable")),
            ))
        }
    }
}

#[utoipa::path(
    post,
    path = "/ai/diagnose",
    tag = "ai",
    summary = "Build financial diagnosis and path",
    description = "Analyzes chat history, extracts a financial profile, creates a short diagnosis and generates Duolingo-like learning levels.",
    request_body(
        content = DiagnoseRequestPayload,
        description = "Full chat history used to build a profile and learning path.",
        example = json!({
            "chat_history": "Пользователь: доход 100000, обязательные расходы 65000, есть кредитка, деньги уходят на доставку и подписки, хочу накопить подушку"
        })
    ),
    responses(
        (status = 200, description = "Profile, diagnosis and path generated successfully.", body = DiagnoseResponse),
        (status = 400, description = "Invalid request body.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "chat_history is required" })
        ),
        (status = 503, description = "AI provider is unavailable. Fallback diagnosis may still be returned by the current handler.", body = ErrorResponse,
            example = json!({ "error": "ai_unavailable", "message": "AI service unavailable" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn diagnose(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<DiagnoseRequestPayload>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    if payload.chat_history.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new("bad_request", "chat_history is required")),
        ));
    }
    let user_id = optional_user_id_from_headers(&headers)?;

    let system_prompt = r#"Ты FinBro - финансовый эксперт и наставник.
Твоя задача - проанализировать диалог с пользователем, заполнить его финансовый профиль, выдать краткий диагноз и составить персональный путь развития (Roadmap) из 4-6 уровней.
Ответь СТРОГО в формате JSON без markdown разметки. Структура ответа:
{
  "profile": {
    "monthly_income": 100000,
    "mandatory_expenses": 65000,
    "free_money": 35000,
    "has_credit": true,
    "debts": [
      { "type": "кредитка", "amount": null, "monthly_payment": null }
    ],
    "savings_months": null,
    "main_goal": "накопить подушку",
    "spending_leaks": ["доставка", "подписки"],
    "risk_zone": "yellow",
    "missing_fields": ["сумма долга", "размер подушки"]
  },
  "diagnosis": {
    "main_problem": "Краткая суть главной проблемы (например: Нет финансовой подушки)",
    "main_risk": "Главный риск ситуации",
    "first_recommendation": "Конкретный первый шаг"
  },
  "path": [
    {
      "id": 1,
      "title": "Название уровня (например: Осознанность)",
      "description": "Мотивирующее описание уровня",
      "icon_name": "Sprout",
      "tasks": [
        { "id": 1, "title": "Название задания 1", "type": "quiz", "crystals": 20 },
        { "id": 2, "title": "Название задания 2", "type": "action", "crystals": 50 }
      ]
    }
  ]
}

Возможные risk_zone: green, yellow, red.
Если пользователь не назвал число, ставь null и добавляй поле в missing_fields.
Возможные icon_name: Sprout, Shield, PiggyBank, TrendingUp, Rocket, Target, Zap, AlertCircle.
Возможные типы заданий (type): mini_game, quiz, lesson, action. Уровни должны быть решениями конкретных проблем профиля: расходы, импульсивные покупки, кредиты, подушка, цели, инвестиции."#;

    let prompt = format!("Проанализируй эти ответы пользователя и сформируй профиль и путь:\n\n{}", payload.chat_history);
    
    match call_ai(&prompt, Some(system_prompt)).await {
        Ok(response) => {
            let cleaned = response.trim().trim_start_matches("```json").trim_start_matches("```").trim_end_matches("```").trim();
            let diagnosis = match serde_json::from_str::<Value>(cleaned) {
                Ok(parsed) => ensure_diagnosis_shape(parsed, &payload.chat_history),
                Err(e) => {
                    tracing::error!("Failed to parse AI JSON: {}", e);
                    fallback_diagnosis(&payload.chat_history)
                }
            };
            persist_diagnosis_if_authenticated(&state, user_id, &diagnosis).await?;
            Ok(Json(diagnosis))
        },
        Err(e) => {
            tracing::error!("Failed to call AI: {}", e);
            let diagnosis = fallback_diagnosis(&payload.chat_history);
            persist_diagnosis_if_authenticated(&state, user_id, &diagnosis).await?;
            Ok(Json(diagnosis))
        }
    }
}

fn optional_user_id_from_headers(
    headers: &HeaderMap,
) -> Result<Option<Uuid>, (StatusCode, Json<ErrorResponse>)> {
    if headers.get(axum::http::header::AUTHORIZATION).is_some() {
        user_id_from_headers(headers).map(Some)
    } else {
        Ok(None)
    }
}

async fn persist_diagnosis_if_authenticated(
    state: &AppState,
    user_id: Option<Uuid>,
    diagnosis: &Value,
) -> Result<(), (StatusCode, Json<ErrorResponse>)> {
    let Some(user_id) = user_id else {
        return Ok(());
    };

    let profile = diagnosis.get("profile").unwrap_or(&Value::Null);
    let diagnosis_summary = diagnosis.get("diagnosis").unwrap_or(&Value::Null);
    let monthly_income = profile
        .get("monthly_income")
        .and_then(Value::as_i64)
        .map(|value| value as f64);
    let has_credit = profile
        .get("has_credit")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    let main_problem = value_string(diagnosis_summary, "main_problem");
    let main_risk = value_string(diagnosis_summary, "main_risk");
    let first_recommendation = value_string(diagnosis_summary, "first_recommendation");
    let main_goal = value_string(profile, "main_goal");

    let mut tx = state.db.begin().await.map_err(|err| {
        tracing::error!("Failed to start diagnosis persistence transaction: {err}");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new("internal_error", "Unexpected server error")),
        )
    })?;

    sqlx::query(
        r#"
        INSERT INTO financial_profiles (user_id, monthly_income, has_credit, main_problem, main_risk, first_recommendation)
        VALUES ($1, $2::numeric, $3, $4, $5, $6)
        ON CONFLICT (user_id)
        DO UPDATE SET
            monthly_income = EXCLUDED.monthly_income,
            has_credit = EXCLUDED.has_credit,
            main_problem = EXCLUDED.main_problem,
            main_risk = EXCLUDED.main_risk,
            first_recommendation = EXCLUDED.first_recommendation,
            updated_at = CURRENT_TIMESTAMP
        "#,
    )
    .bind(user_id)
    .bind(monthly_income)
    .bind(has_credit)
    .bind(main_problem.as_deref())
    .bind(main_risk.as_deref())
    .bind(first_recommendation.as_deref())
    .execute(&mut *tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to persist financial profile: {err}");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new("internal_error", "Unexpected server error")),
        )
    })?;

    if let Some(goal) = main_goal.as_deref().filter(|goal| !goal.trim().is_empty()) {
        sqlx::query(
            r#"
            INSERT INTO goals (user_id, title, status)
            SELECT $1, $2, 'active'
            WHERE NOT EXISTS (
                SELECT 1 FROM goals WHERE user_id = $1 AND title = $2 AND status = 'active'
            )
            "#,
        )
        .bind(user_id)
        .bind(goal)
        .execute(&mut *tx)
        .await
        .map_err(|err| {
            tracing::error!("Failed to persist goal: {err}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new("internal_error", "Unexpected server error")),
            )
        })?;
    }

    sqlx::query(
        "UPDATE financial_paths SET status = 'inactive' WHERE user_id = $1 AND status = 'active'",
    )
    .bind(user_id)
    .execute(&mut *tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to deactivate previous paths: {err}");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new("internal_error", "Unexpected server error")),
        )
    })?;

    let path_id = sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO financial_paths (user_id, title, description, order_index, status)
        VALUES ($1, 'Персональный путь', 'Путь построен по финансовой диагностике', 0, 'active')
        RETURNING id
        "#,
    )
    .bind(user_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to create learning path: {err}");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new("internal_error", "Unexpected server error")),
        )
    })?;

    if let Some(levels) = diagnosis.get("path").and_then(Value::as_array) {
        for (level_index, level) in levels.iter().enumerate() {
            let title = value_string(level, "title").unwrap_or_else(|| format!("Уровень {}", level_index + 1));
            let description = value_string(level, "description").unwrap_or_default();
            let icon_name = value_string(level, "icon_name").unwrap_or_else(|| "Sprout".to_string());

            let level_id = sqlx::query_scalar::<_, Uuid>(
                r#"
                INSERT INTO levels (path_id, title, description, icon_name, order_index)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
                "#,
            )
            .bind(path_id)
            .bind(title)
            .bind(description)
            .bind(icon_name)
            .bind((level_index + 1) as i32)
            .fetch_one(&mut *tx)
            .await
            .map_err(|err| {
                tracing::error!("Failed to create level: {err}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse::new("internal_error", "Unexpected server error")),
                )
            })?;

            if let Some(tasks) = level.get("tasks").and_then(Value::as_array) {
                for (task_index, task) in tasks.iter().enumerate() {
                    let title = value_string(task, "title").unwrap_or_else(|| format!("Задание {}", task_index + 1));
                    let task_type = value_string(task, "type").unwrap_or_else(|| "lesson".to_string());
                    let crystals = task
                        .get("crystals")
                        .and_then(Value::as_i64)
                        .unwrap_or(10)
                        .clamp(0, i32::MAX as i64) as i32;

                    let task_id = sqlx::query_scalar::<_, Uuid>(
                        r#"
                        INSERT INTO tasks (level_id, title, description, task_type, reward_crystals, order_index)
                        VALUES ($1, $2, '', $3, $4, $5)
                        RETURNING id
                        "#,
                    )
                    .bind(level_id)
                    .bind(title)
                    .bind(task_type)
                    .bind(crystals)
                    .bind((task_index + 1) as i32)
                    .fetch_one(&mut *tx)
                    .await
                    .map_err(|err| {
                        tracing::error!("Failed to create task: {err}");
                        (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(ErrorResponse::new("internal_error", "Unexpected server error")),
                        )
                    })?;

                    sqlx::query(
                        r#"
                        INSERT INTO user_tasks (user_id, task_id, status)
                        VALUES ($1, $2, 'pending')
                        ON CONFLICT (user_id, task_id) DO NOTHING
                        "#,
                    )
                    .bind(user_id)
                    .bind(task_id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|err| {
                        tracing::error!("Failed to initialize user task: {err}");
                        (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(ErrorResponse::new("internal_error", "Unexpected server error")),
                        )
                    })?;
                }
            }
        }
    }

    tx.commit().await.map_err(|err| {
        tracing::error!("Failed to commit diagnosis persistence: {err}");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new("internal_error", "Unexpected server error")),
        )
    })?;

    Ok(())
}

fn value_string(value: &Value, key: &str) -> Option<String> {
    value
        .get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn ensure_diagnosis_shape(mut parsed: Value, chat_history: &str) -> Value {
    let fallback = fallback_diagnosis(chat_history);

    let generic_diagnosis = parsed
        .get("diagnosis")
        .and_then(|diagnosis| diagnosis.get("main_problem"))
        .and_then(|problem| problem.as_str())
        .map(|problem| problem.contains("не хватает данных") || problem.contains("не хватает ясной"))
        .unwrap_or(false);

    if parsed.get("diagnosis").is_none() || generic_diagnosis {
        parsed["diagnosis"] = fallback["diagnosis"].clone();
    }

    if parsed.get("profile").is_none() {
        parsed["profile"] = fallback["profile"].clone();
    }

    let has_path = parsed
        .get("path")
        .and_then(|path| path.as_array())
        .map(|path| !path.is_empty())
        .unwrap_or(false);

    if !has_path {
        parsed["path"] = fallback["path"].clone();
    }

    parsed
}

fn fallback_diagnosis(chat_history: &str) -> Value {
    let lower = chat_history.to_lowercase();
    let has_credit = lower.contains("кредит") || lower.contains("долг") || lower.contains("карт");
    let wants_savings = lower.contains("подуш") || lower.contains("накоп") || lower.contains("сбереж");
    let leaks = lower.contains("уход") || lower.contains("трат") || lower.contains("не остается") || lower.contains("не остаётся");
    let profile = profile_from_chat(chat_history, has_credit, wants_savings, leaks);

    let (main_problem, main_risk, first_recommendation) = if has_credit {
        (
            "Кредитная нагрузка мешает свободным деньгам",
            "Проценты и минимальные платежи могут съедать прогресс",
            "Выпиши все долги: остаток, ставку и минимальный платёж",
        )
    } else if wants_savings {
        (
            "Подушка безопасности ещё не собрана",
            "Любая внеплановая трата может выбить бюджет",
            "Выбери маленький автоматический перевод в резерв на эту неделю",
        )
    } else if leaks {
        (
            "Деньги расходятся без понятной системы",
            "Незаметные траты могут съедать цель каждый месяц",
            "Найди 3 регулярные траты, которые можно сократить без боли",
        )
    } else {
        (
            "Пока не хватает ясной финансовой карты",
            "Решения принимаются без видимого маршрута",
            "Начни с короткой фиксации дохода, обязательных трат и цели",
        )
    };

    let mut path = vec![
        json!({
            "id": 1,
            "title": "Финансовый снимок",
            "description": "FinClip помогает собрать отдельный профиль: доход, траты, долги, подушка и цель.",
            "icon_name": "Sprout",
            "tasks": [
                { "id": 1, "title": "Записать доход месяца", "type": "action", "crystals": 20 },
                { "id": 2, "title": "Разделить траты на обязательные и свободные", "type": "lesson", "crystals": 30 },
                { "id": 3, "title": "Выбрать главную цель", "type": "quiz", "crystals": 25 }
            ]
        }),
    ];

    if leaks {
        path.push(json!({
            "id": path.len() + 1,
            "title": "Контроль импульсивных покупок",
            "description": "Анти-Импульс учит замечать покупки-ловушки и делать паузу.",
            "icon_name": "Shield",
            "tasks": [
                { "id": 1, "title": "Распознать 3 покупки-ловушки", "type": "mini_game", "crystals": 30 },
                { "id": 2, "title": "Включить правило 24 часов", "type": "action", "crystals": 40 },
                { "id": 3, "title": "Найти одну лишнюю подписку", "type": "action", "crystals": 35 }
            ]
        }));
    }

    path.push(json!({
        "id": path.len() + 1,
        "title": "Бюджет без боли",
        "description": "Бюджетный Калькулятор раскладывает деньги по понятным категориям.",
        "icon_name": "Target",
        "tasks": [
            { "id": 1, "title": "Собрать бюджет недели", "type": "action", "crystals": 45 },
            { "id": 2, "title": "Найти свободные деньги", "type": "quiz", "crystals": 30 },
            { "id": 3, "title": "Поставить лимит на переменные траты", "type": "action", "crystals": 40 }
        ]
    }));

    if has_credit {
        path.push(json!({
            "id": path.len() + 1,
            "title": "Кредиты и долги",
            "description": "Кредитный Светофор показывает риски и помогает снижать переплату.",
            "icon_name": "AlertCircle",
            "tasks": [
                { "id": 1, "title": "Понять стоимость кредитки", "type": "lesson", "crystals": 30 },
                { "id": 2, "title": "Выбрать стратегию закрытия долга", "type": "quiz", "crystals": 45 },
                { "id": 3, "title": "Найти самый дорогой долг", "type": "action", "crystals": 50 }
            ]
        }));
    }

    if wants_savings || !has_credit {
        path.push(json!({
            "id": path.len() + 1,
            "title": "Подушка безопасности",
            "description": "Копилка Плюша помогает накопить первый резерв маленькими шагами.",
            "icon_name": "PiggyBank",
            "tasks": [
                { "id": 1, "title": "Посчитать минимальную подушку", "type": "lesson", "crystals": 25 },
                { "id": 2, "title": "Отложить первую маленькую сумму", "type": "action", "crystals": 60 },
                { "id": 3, "title": "Поймать монеты в мини-игре", "type": "mini_game", "crystals": 35 }
            ]
        }));
    }

    if lower.contains("инвест") || lower.contains("акци") || lower.contains("цель") {
        path.push(json!({
            "id": path.len() + 1,
            "title": "Цели и первые инвестиции",
            "description": "Росток Инвестора помогает идти к цели без резких решений.",
            "icon_name": "TrendingUp",
            "tasks": [
                { "id": 1, "title": "Сформулировать цель в деньгах и сроке", "type": "action", "crystals": 35 },
                { "id": 2, "title": "Проверить готовность к инвестициям", "type": "quiz", "crystals": 40 },
                { "id": 3, "title": "Разобрать базовые риски", "type": "lesson", "crystals": 30 }
            ]
        }));
    }

    json!({
        "profile": profile,
        "diagnosis": {
            "main_problem": main_problem,
            "main_risk": main_risk,
            "first_recommendation": first_recommendation
        },
        "path": path
    })
}

fn profile_from_chat(chat_history: &str, has_credit: bool, wants_savings: bool, leaks: bool) -> Value {
    let monthly_income = find_money_near(chat_history, &["доход", "зараб", "получ", "зарплат"]);
    let mandatory_expenses = find_money_near(chat_history, &["расход", "трат", "обязатель", "аренд", "ипотек", "коммун"]);
    let free_money = match (monthly_income, mandatory_expenses) {
        (Some(income), Some(expenses)) if income >= expenses => Some(income - expenses),
        _ => None,
    };

    let lower = chat_history.to_lowercase();
    let mut missing_fields = Vec::new();
    if monthly_income.is_none() {
        missing_fields.push("ежемесячный доход");
    }
    if mandatory_expenses.is_none() {
        missing_fields.push("обязательные расходы");
    }
    if has_credit && !lower.contains("ставк") && !lower.contains("плат") && !lower.contains("остат") {
        missing_fields.push("сумма и платёж по долгам");
    }
    if !wants_savings && !lower.contains("цель") && !lower.contains("инвест") {
        missing_fields.push("главная финансовая цель");
    }

    let risk_zone = if has_credit && (leaks || free_money.unwrap_or(0) == 0) {
        "red"
    } else if has_credit || leaks || monthly_income.is_none() || mandatory_expenses.is_none() {
        "yellow"
    } else {
        "green"
    };

    let mut spending_leaks = Vec::new();
    for (keyword, label) in [
        ("достав", "доставка"),
        ("такси", "такси"),
        ("кофе", "кофе"),
        ("подпис", "подписки"),
        ("маркет", "маркетплейсы"),
        ("импульс", "импульсивные покупки"),
    ] {
        if lower.contains(keyword) {
            spending_leaks.push(label);
        }
    }

    let main_goal = if wants_savings {
        Some("накопить подушку")
    } else if lower.contains("инвест") {
        Some("начать инвестировать")
    } else if lower.contains("долг") || lower.contains("кредит") {
        Some("снизить долговую нагрузку")
    } else if lower.contains("цель") {
        Some("сформулировать финансовую цель")
    } else {
        None
    };

    json!({
        "monthly_income": monthly_income,
        "mandatory_expenses": mandatory_expenses,
        "free_money": free_money,
        "has_credit": has_credit,
        "debts": if has_credit {
            json!([{ "type": "кредит/долг", "amount": null, "monthly_payment": null }])
        } else {
            json!([])
        },
        "savings_months": null,
        "main_goal": main_goal,
        "spending_leaks": spending_leaks,
        "risk_zone": risk_zone,
        "missing_fields": missing_fields
    })
}

fn find_money_near(text: &str, keywords: &[&str]) -> Option<i64> {
    let normalized = text
        .to_lowercase()
        .replace([':', ',', '.', ';', '(', ')', '\n'], " ");
    let tokens: Vec<&str> = normalized.split_whitespace().collect();

    for (index, token) in tokens.iter().enumerate() {
        if !keywords.iter().any(|keyword| token.contains(keyword)) {
            continue;
        }

        let start = index.saturating_sub(5);
        let end = (index + 6).min(tokens.len());

        for amount_index in (index + 1)..end {
            if let Some(amount) = parse_money_token(tokens[amount_index], tokens.get(amount_index + 1).copied()) {
                return Some(amount);
            }
        }

        for amount_index in start..index {
            if let Some(amount) = parse_money_token(tokens[amount_index], tokens.get(amount_index + 1).copied()) {
                return Some(amount);
            }
        }
    }

    None
}

fn parse_money_token(token: &str, next: Option<&str>) -> Option<i64> {
    let multiplier = if token.ends_with('к')
        || token.ends_with('k')
        || next.map(|value| value.starts_with("тыс") || value == "к" || value == "k").unwrap_or(false)
    {
        1000
    } else {
        1
    };

    let number: String = token.chars().filter(|character| character.is_ascii_digit()).collect();
    if number.is_empty() {
        return None;
    }

    number.parse::<i64>().ok().map(|value| value * multiplier)
}
