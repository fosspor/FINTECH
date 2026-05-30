use axum::{extract::Multipart, Json};
use reqwest::Client;
use serde::Deserialize;
use serde_json::{json, Value};
use std::env;
use tracing::info;

const API_WAITING_MESSAGE: &str = "ожидается api";
const SPEECH_NOT_RECOGNIZED_MESSAGE: &str = "Не получилось распознать, попробуй ещё раз.";
const LPCM_SAMPLE_RATE: &str = "16000";

struct AudioPayload {
    bytes: Vec<u8>,
    content_type: String,
}

#[derive(Deserialize)]
struct SpeechKitResponse {
    result: Option<String>,
}

pub async fn transcribe(mut multipart: Multipart) -> Json<Value> {
    info!("Receiving audio for transcription...");

    let mut audio: Option<AudioPayload> = None;

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or("").to_string();

        if name == "audio" {
            let content_type = field.content_type().unwrap_or("").to_string();
            let data = field.bytes().await.unwrap_or_default();
            info!("Received audio blob of size: {} bytes, content-type: {}", data.len(), content_type);
            audio = Some(AudioPayload {
                bytes: data.to_vec(),
                content_type,
            });
        }
    }

    match audio {
        Some(payload) => match recognize_with_speechkit(payload).await {
            Ok(text) => Json(json!({ "text": text })),
            Err(message) => Json(json!({ "text": null, "error": message })),
        },
        None => Json(json!({ "text": null, "error": SPEECH_NOT_RECOGNIZED_MESSAGE })),
    }
}

async fn recognize_with_speechkit(audio: AudioPayload) -> Result<String, &'static str> {
    let api_key = env::var("YANDEX_SPEECHKIT_KEY")
        .ok()
        .filter(|value| !value.trim().is_empty() && !value.contains("your_"))
        .or_else(|| env::var("YANDEX_API_KEY").ok())
        .unwrap_or_default();
    let folder_id = env::var("YANDEX_FOLDER_ID").unwrap_or_default();

    if api_key.trim().is_empty() || folder_id.trim().is_empty() {
        return Err(API_WAITING_MESSAGE);
    }

    let format_params = if audio.content_type.contains("audio/lpcm") {
        format!("format=lpcm&sampleRateHertz={}", LPCM_SAMPLE_RATE)
    } else {
        "format=oggopus".to_string()
    };
    let url = format!(
        "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?folderId={}&lang=ru-RU&{}",
        folder_id, format_params
    );

    let client = Client::new();
    let response = client
        .post(url)
        .header("Authorization", format!("Api-Key {}", api_key))
        .header("Content-Type", "application/octet-stream")
        .body(audio.bytes)
        .send()
        .await;

    let Ok(response) = response else {
        return Err(SPEECH_NOT_RECOGNIZED_MESSAGE);
    };

    if !response.status().is_success() {
        tracing::error!("SpeechKit STT error: {}", response.text().await.unwrap_or_default());
        return Err(SPEECH_NOT_RECOGNIZED_MESSAGE);
    }

    match response.json::<SpeechKitResponse>().await {
        Ok(data) => data
            .result
            .filter(|text| !text.trim().is_empty())
            .ok_or(SPEECH_NOT_RECOGNIZED_MESSAGE),
        Err(error) => {
            tracing::error!("Failed to parse SpeechKit STT response: {}", error);
            Err(SPEECH_NOT_RECOGNIZED_MESSAGE)
        }
    }
}
