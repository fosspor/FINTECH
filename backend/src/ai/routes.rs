pub mod routes {
    use axum::Json;
    use serde_json::{json, Value};

    pub async fn chat() -> Json<Value> {
        // Mock Qwen Chat interaction
        Json(json!({ "response": "Понял тебя. Давай разберемся с кредитом. Какой процент и сколько осталось платить?" }))
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
}
