use axum::{extract::Multipart, Json};
use serde_json::{json, Value};
use tracing::info;

pub async fn transcribe(mut multipart: Multipart) -> Json<Value> {
    info!("Receiving audio for transcription...");
    
    // Process the multipart stream to receive the audio file
    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or("").to_string();
        
        if name == "audio" {
            let data = field.bytes().await.unwrap_or_default();
            info!("Received audio blob of size: {} bytes", data.len());
            // Here you would integrate whisper.cpp:
            // e.g. save data to a temp file, run whisper.cpp CLI, and read the output.
            // For MVP, if whisper.cpp is not available yet, return a mock response.
        }
    }

    // Mock response representing transcribed text
    Json(json!({ "text": "Я получаю около 80 тысяч рублей в месяц. Есть кредит. Почти ничего не остаётся к концу месяца. Хочу накопить на машину." }))
}
