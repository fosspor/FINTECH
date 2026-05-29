use axum::Json;
use serde_json::{json, Value};

pub async fn get_profile() -> Json<Value> {
    Json(json!({ 
        "income": 80000,
        "has_credit": true,
        "goals": ["Накопить на машину"]
    }))
}
