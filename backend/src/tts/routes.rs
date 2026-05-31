use axum::{http::StatusCode, Json};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use utoipa::ToSchema;

use crate::docs::ErrorResponse;

#[derive(Deserialize, ToSchema)]
#[schema(example = json!({
    "text": "Отлично, первый уровень открыт!",
    "voice": "alena"
}))]
pub struct TtsRequest {
    pub text: String,
    pub voice: Option<String>,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "audio_url": "data:audio/ogg;base64,T2dnUwAC...",
    "message": "generated"
}))]
pub struct TtsResponse {
    pub audio_url: Option<String>,
    pub message: String,
}

#[utoipa::path(
    post,
    path = "/tts/generate",
    tag = "tts",
    summary = "Generate speech",
    description = "Generates voice audio for FinBro text using Yandex SpeechKit TTS. Returns a data URL with OGG Opus audio.",
    request_body(
        content = TtsRequest,
        description = "Text and optional Yandex voice preset.",
        example = json!({
            "text": "Отлично, первый уровень открыт!",
            "voice": "alena"
        })
    ),
    responses(
        (status = 200, description = "Speech generated successfully.", body = TtsResponse),
        (status = 400, description = "Invalid request body.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "text is required" })
        ),
        (status = 503, description = "TTS provider is unavailable or not configured.", body = ErrorResponse,
            example = json!({ "error": "tts_unavailable", "message": "Yandex SpeechKit TTS is not configured" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn generate(
    Json(payload): Json<TtsRequest>,
) -> Result<Json<TtsResponse>, (StatusCode, Json<ErrorResponse>)> {
    let text = payload.text.trim();
    if text.is_empty() {
        return Err(error(StatusCode::BAD_REQUEST, "bad_request", "text is required"));
    }

    let api_key = env::var("YANDEX_SPEECHKIT_KEY")
        .ok()
        .filter(|value| !value.trim().is_empty() && !value.contains("your_"))
        .or_else(|| {
            env::var("YANDEX_API_KEY")
                .ok()
                .filter(|value| !value.trim().is_empty() && !value.contains("your_"))
        })
        .unwrap_or_default();
    let folder_id = env::var("YANDEX_FOLDER_ID").unwrap_or_default();

    if api_key.is_empty() || folder_id.is_empty() || folder_id.contains("your_") {
        return Err(error(
            StatusCode::SERVICE_UNAVAILABLE,
            "tts_unavailable",
            "Yandex SpeechKit TTS is not configured",
        ));
    }

    let audio = synthesize(text, payload.voice.as_deref().unwrap_or("alena"), &api_key, &folder_id).await?;
    let encoded = STANDARD.encode(audio);

    Ok(Json(TtsResponse {
        audio_url: Some(format!("data:audio/ogg;base64,{encoded}")),
        message: "generated".to_string(),
    }))
}

async fn synthesize(
    text: &str,
    voice: &str,
    api_key: &str,
    folder_id: &str,
) -> Result<Vec<u8>, (StatusCode, Json<ErrorResponse>)> {
    let client = Client::new();
    let response = client
        .post("https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize")
        .header("Authorization", format!("Api-Key {api_key}"))
        .form(&[
            ("text", text),
            ("lang", "ru-RU"),
            ("voice", voice),
            ("folderId", folder_id),
            ("format", "oggopus"),
        ])
        .send()
        .await
        .map_err(|err| {
            tracing::error!("SpeechKit TTS request failed: {err}");
            error(
                StatusCode::SERVICE_UNAVAILABLE,
                "tts_unavailable",
                "Yandex SpeechKit TTS request failed",
            )
        })?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        tracing::error!("SpeechKit TTS error {status}: {body}");
        return Err(error(
            StatusCode::SERVICE_UNAVAILABLE,
            "tts_unavailable",
            "Yandex SpeechKit TTS is unavailable",
        ));
    }

    response.bytes().await.map(|bytes| bytes.to_vec()).map_err(|err| {
        tracing::error!("Failed to read SpeechKit TTS audio: {err}");
        error(
            StatusCode::SERVICE_UNAVAILABLE,
            "tts_unavailable",
            "Failed to read generated audio",
        )
    })
}

fn error(
    status: StatusCode,
    code: impl Into<String>,
    message: impl Into<String>,
) -> (StatusCode, Json<ErrorResponse>) {
    (status, Json(ErrorResponse::new(code, message)))
}
