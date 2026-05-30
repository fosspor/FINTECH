use axum::Json;
use serde::Deserialize;
use serde_json::{json, Value};
use crate::ai::client::call_qwen;

#[derive(Deserialize)]
pub struct ChatRequestPayload {
    pub message: String,
    pub context: Option<String>,
}

#[derive(Deserialize)]
pub struct DiagnoseRequestPayload {
    pub chat_history: String,
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

pub async fn diagnose(Json(payload): Json<DiagnoseRequestPayload>) -> Json<Value> {
    let system_prompt = r#"Ты FinBro - финансовый эксперт и наставник.
Твоя задача - проанализировать диалог с пользователем, выдать краткий диагноз его финансов и составить персональный путь развития (Roadmap) из 4-5 уровней.
Ответь СТРОГО в формате JSON без markdown разметки. Структура ответа:
{
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

Возможные icon_name: Sprout, Shield, PiggyBank, TrendingUp, Rocket, Target, Zap, AlertCircle.
Возможные типы заданий (type): mini_game, quiz, lesson, action. Уровни должны логично вытекать из диагноза пользователя."#;

    let prompt = format!("Проанализируй эти ответы пользователя и сформируй профиль и путь:\n\n{}", payload.chat_history);
    
    match call_qwen(&prompt, Some(system_prompt)).await {
        Ok(response) => {
            let cleaned = response.trim().trim_start_matches("```json").trim_start_matches("```").trim_end_matches("```").trim();
            match serde_json::from_str::<Value>(cleaned) {
                Ok(parsed) => Json(parsed),
                Err(e) => {
                    tracing::error!("Failed to parse AI JSON: {}", e);
                    Json(json!({ 
                        "diagnosis": {
                            "main_problem": "Ошибка анализа",
                            "main_risk": "Данные не распознаны",
                            "first_recommendation": "Попробуйте пройти опрос заново"
                        },
                        "path": []
                    }))
                }
            }
        },
        Err(e) => {
            tracing::error!("Failed to call AI: {}", e);
            Json(json!({ 
                "diagnosis": {
                    "main_problem": "Сервис временно недоступен",
                    "main_risk": "-",
                    "first_recommendation": "-"
                },
                "path": []
            }))
        }
    }
}
