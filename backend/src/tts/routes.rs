pub mod routes {
    use axum::Json;
    use serde_json::{json, Value};

    pub async fn generate() -> Json<Value> {
        // Mock TTS API implementation
        Json(json!({ "audio_url": "/mock_audio.mp3" }))
    }
}
