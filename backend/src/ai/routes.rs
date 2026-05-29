use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use crate::ai::client::call_qwen;

#[derive(Deserialize)]
pub struct ChatRequestPayload {
    pub message: String,
    pub context: Option<String>,
}

pub async fn chat(Json(payload): Json<ChatRequestPayload>) -> Json<Value> {
    let system_prompt = "Ты FinBro - персональный AI-наставник финансовых решений. Твоя задача — помогать людям принимать правильные финансовые решения. Общайся дружелюбно, уверенно, просто и человечно. Не используй банковский жаргон.";
    
    match call_qwen(&payload.message, Some(system_prompt)).await {
        Ok(response) => Json(json!({ "response": response })),
        Err(e) => {
            tracing::error!("Failed to call AI: {}", e);
            Json(json!({ "error": "AI service unavailable" }))
        }
    }
}

pub async fn diagnose() -> Json<Value> {
    // Mock AI Diagnosis
    Json(json!({ 
        "diagnosis": {
            "main_problem": "Отсутствие финансовой подушки",
            "main_risk": "Жизнь от зарплаты до зарплаты",
            "first_recommendation": "Начать отслеживать ежедневные расходы в течение недели"
        }
    }))
}
