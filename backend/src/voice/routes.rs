use axum::{extract::Multipart, Json};
use reqwest::Client;
use serde::Deserialize;
use serde_json::{json, Value};
use std::env;
use tracing::info;

const API_WAITING_MESSAGE: &str = "ожидается api";

#[derive(Deserialize)]
struct SpeechKitResponse {
    result: Option<String>,
}

pub async fn transcribe(mut multipart: Multipart) -> Json<Value> {
    info!("Receiving audio for transcription...");

    let mut audio = None;

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or("").to_string();

        if name == "audio" {
            let data = field.bytes().await.unwrap_or_default();
            info!("Received audio blob of size: {} bytes", data.len());
            audio = Some(data);
        }
    }

    match audio {
        Some(data) => Json(json!({ "text": recognize_with_speechkit(data.to_vec()).await })),
        None => Json(json!({ "text": API_WAITING_MESSAGE })),
    }
}

async fn recognize_with_speechkit(audio: Vec<u8>) -> String {
    let api_key = env::var("YANDEX_SPEECHKIT_KEY")
        .ok()
        .filter(|value| !value.trim().is_empty() && !value.contains("your_"))
        .or_else(|| env::var("YANDEX_API_KEY").ok())
        .unwrap_or_default();
    let folder_id = env::var("YANDEX_FOLDER_ID").unwrap_or_default();

    if api_key.trim().is_empty() || folder_id.trim().is_empty() {
        return API_WAITING_MESSAGE.to_string();
    }

    let url = format!(
        "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?folderId={}&lang=ru-RU&format=oggopus",
        folder_id
    );

    let client = Client::new();
    let response = client
        .post(url)
        .header("Authorization", format!("Api-Key {}", api_key))
        .header("Content-Type", "application/octet-stream")
        .body(audio)
        .send()
        .await;

    let Ok(response) = response else {
        return API_WAITING_MESSAGE.to_string();
    };

    if !response.status().is_success() {
        tracing::error!("SpeechKit STT error: {}", response.text().await.unwrap_or_default());
        return API_WAITING_MESSAGE.to_string();
    }

    match response.json::<SpeechKitResponse>().await {
        Ok(data) => data
            .result
            .filter(|text| !text.trim().is_empty())
            .unwrap_or_else(|| API_WAITING_MESSAGE.to_string()),
        Err(error) => {
            tracing::error!("Failed to parse SpeechKit STT response: {}", error);
            API_WAITING_MESSAGE.to_string()
        }
    }
}
