use axum::Json;
use serde_json::{json, Value};

pub async fn generate() -> Json<Value> {
    Json(json!({ "audio_url": null, "message": "ожидается api" }))
}
