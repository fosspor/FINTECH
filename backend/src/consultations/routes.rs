use axum::Json;
use serde_json::{json, Value};

pub async fn list_consultations() -> Json<Value> {
    Json(json!([]))
}

pub async fn create_consultation() -> Json<Value> {
    Json(json!({ "id": "123", "status": "started" }))
}
