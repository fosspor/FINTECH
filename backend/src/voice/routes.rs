pub mod routes {
    use axum::Json;
    use serde_json::{json, Value};

    pub async fn transcribe() -> Json<Value> {
        // Mock Whisper API implementation
        Json(json!({ "text": "Я получаю около 80 тысяч рублей в месяц. Есть кредит." }))
    }
}
