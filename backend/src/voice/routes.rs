use axum::{extract::Multipart, http::StatusCode, Json};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use tracing::info;
use utoipa::ToSchema;
use crate::docs::ErrorResponse;

const API_WAITING_MESSAGE: &str = "ожидается api";
const SPEECH_NOT_RECOGNIZED_MESSAGE: &str = "Не получилось распознать, попробуй ещё раз.";
const MAX_AUDIO_BYTES: usize = 10 * 1024 * 1024;
const LPCM_SAMPLE_RATE: &str = "16000";

struct AudioPayload {
    bytes: Vec<u8>,
    content_type: String,
}

#[derive(Deserialize)]
struct SpeechKitResponse {
    result: Option<String>,
}

#[derive(ToSchema)]
#[allow(dead_code)]
pub struct VoiceTranscribeRequest {
    #[schema(value_type = String, format = Binary)]
    pub audio: String,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "text": "Мой доход сто тысяч рублей"
}))]
pub struct TranscriptionResponse {
    pub text: String,
}

#[utoipa::path(
    post,
    path = "/voice/transcribe",
    tag = "voice",
    summary = "Transcribe voice message",
    description = "Accepts an audio file in multipart/form-data under the `audio` field and returns recognized Russian text. Uses Yandex SpeechKit when configured.",
    request_body(
        content = VoiceTranscribeRequest,
        content_type = "multipart/form-data",
        description = "Audio file field named `audio`. SpeechKit expects OGG Opus audio."
    ),
    responses(
        (status = 200, description = "Audio transcribed successfully.", body = TranscriptionResponse,
            example = json!({ "text": "Мой доход сто тысяч рублей" })
        ),
        (status = 400, description = "Missing `audio` multipart field.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "audio field is required" })
        ),
        (status = 413, description = "Uploaded audio is too large.", body = ErrorResponse,
            example = json!({ "error": "payload_too_large", "message": "Audio file is too large" })
        ),
        (status = 503, description = "SpeechKit provider is unavailable or not configured.", body = ErrorResponse,
            example = json!({ "error": "speechkit_unavailable", "message": "Yandex SpeechKit STT is not configured" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn transcribe(
    multipart: Multipart,
) -> Result<Json<TranscriptionResponse>, (StatusCode, Json<ErrorResponse>)> {
    transcribe_audio(multipart).await
}

#[utoipa::path(
    post,
    path = "/api/voice/transcribe",
    tag = "voice",
    summary = "Transcribe voice message via API proxy path",
    description = "Proxy-friendly alias for `/voice/transcribe`. Accepts OGG Opus or 16 kHz LPCM audio in multipart/form-data under the `audio` field.",
    request_body(
        content = VoiceTranscribeRequest,
        content_type = "multipart/form-data",
        description = "Audio file field named `audio`. Supported inputs: OGG Opus or raw LPCM 16 kHz."
    ),
    responses(
        (status = 200, description = "Audio transcribed successfully.", body = TranscriptionResponse,
            example = json!({ "text": "Мой доход сто тысяч рублей" })
        ),
        (status = 400, description = "Missing `audio` multipart field.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "audio field is required" })
        ),
        (status = 413, description = "Uploaded audio is too large.", body = ErrorResponse,
            example = json!({ "error": "payload_too_large", "message": "Audio file is too large" })
        ),
        (status = 503, description = "SpeechKit provider is unavailable or not configured.", body = ErrorResponse,
            example = json!({ "error": "speechkit_unavailable", "message": "Yandex SpeechKit STT is not configured" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn transcribe_api(
    multipart: Multipart,
) -> Result<Json<TranscriptionResponse>, (StatusCode, Json<ErrorResponse>)> {
    transcribe_audio(multipart).await
}

async fn transcribe_audio(
    mut multipart: Multipart,
) -> Result<Json<TranscriptionResponse>, (StatusCode, Json<ErrorResponse>)> {
    info!("Receiving audio for transcription...");

    let mut audio: Option<AudioPayload> = None;

    while let Some(field) = multipart.next_field().await.map_err(|err| {
        tracing::error!("Failed to read multipart field: {err}");
        error(
            StatusCode::BAD_REQUEST,
            "bad_request",
            "Invalid multipart form data",
        )
    })? {
        let name = field.name().unwrap_or("").to_string();

        if name == "audio" {
            let content_type = field.content_type().unwrap_or("").to_string();
<<<<<<< HEAD
            let data = field.bytes().await.unwrap_or_default();
            info!("Received audio blob of size: {} bytes, content-type: {}", data.len(), content_type);
=======
            let data = field.bytes().await.map_err(|err| {
                tracing::error!("Failed to read audio field: {err}");
                error(
                    StatusCode::BAD_REQUEST,
                    "bad_request",
                    "Invalid audio field",
                )
            })?;

            if data.len() > MAX_AUDIO_BYTES {
                return Err(error(
                    StatusCode::PAYLOAD_TOO_LARGE,
                    "payload_too_large",
                    "Audio file is too large",
                ));
            }

            info!(
                "Received audio blob of size: {} bytes, content-type: {}",
                data.len(),
                content_type
            );
>>>>>>> 9aca396 (Update backend and frontend with new features and improvements)
            audio = Some(AudioPayload {
                bytes: data.to_vec(),
                content_type,
            });
        }
    }

<<<<<<< HEAD
    match audio {
        Some(payload) => match recognize_with_speechkit(payload).await {
            Ok(text) => Json(json!({ "text": text })),
            Err(message) => Json(json!({ "text": null, "error": message })),
        },
        None => Json(json!({ "text": null, "error": SPEECH_NOT_RECOGNIZED_MESSAGE })),
    }
}

async fn recognize_with_speechkit(audio: AudioPayload) -> Result<String, &'static str> {
=======
    let Some(payload) = audio else {
        return Err(error(
            StatusCode::BAD_REQUEST,
            "bad_request",
            "audio field is required",
        ));
    };

    let text = recognize_with_speechkit(payload).await?;
    Ok(Json(TranscriptionResponse { text }))
}

async fn recognize_with_speechkit(
    audio: AudioPayload,
) -> Result<String, (StatusCode, Json<ErrorResponse>)> {
>>>>>>> 9aca396 (Update backend and frontend with new features and improvements)
    let api_key = env::var("YANDEX_SPEECHKIT_KEY")
        .ok()
        .filter(|value| !value.trim().is_empty() && !value.contains("your_"))
        .or_else(|| env::var("YANDEX_API_KEY").ok())
        .unwrap_or_default();
    let folder_id = env::var("YANDEX_FOLDER_ID").unwrap_or_default();

<<<<<<< HEAD
    if api_key.trim().is_empty() || folder_id.trim().is_empty() {
        return Err(API_WAITING_MESSAGE);
    }

    let format_params = if audio.content_type.contains("audio/lpcm") {
        format!("format=lpcm&sampleRateHertz={}", LPCM_SAMPLE_RATE)
=======
    if api_key.trim().is_empty()
        || api_key.contains("your_")
        || folder_id.trim().is_empty()
        || folder_id.contains("your_")
    {
        return Err(error(
            StatusCode::SERVICE_UNAVAILABLE,
            "speechkit_unavailable",
            "Yandex SpeechKit STT is not configured",
        ));
    }

    let format_params = if audio.content_type.contains("audio/lpcm") {
        format!("format=lpcm&sampleRateHertz={LPCM_SAMPLE_RATE}")
>>>>>>> 9aca396 (Update backend and frontend with new features and improvements)
    } else {
        "format=oggopus".to_string()
    };
    let url = format!(
<<<<<<< HEAD
        "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?folderId={}&lang=ru-RU&{}",
        folder_id, format_params
=======
        "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?folderId={folder_id}&lang=ru-RU&{format_params}"
>>>>>>> 9aca396 (Update backend and frontend with new features and improvements)
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
<<<<<<< HEAD
        return Err(SPEECH_NOT_RECOGNIZED_MESSAGE);
=======
        return Err(error(
            StatusCode::SERVICE_UNAVAILABLE,
            "speechkit_unavailable",
            "Yandex SpeechKit STT request failed",
        ));
>>>>>>> 9aca396 (Update backend and frontend with new features and improvements)
    };

    if !response.status().is_success() {
        tracing::error!("SpeechKit STT error: {}", response.text().await.unwrap_or_default());
<<<<<<< HEAD
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
=======
        return Err(error(
            StatusCode::SERVICE_UNAVAILABLE,
            "speechkit_unavailable",
            "Yandex SpeechKit STT is unavailable",
        ));
    }

    match response.json::<SpeechKitResponse>().await {
        Ok(data) => data.result.filter(|text| !text.trim().is_empty()).ok_or_else(|| {
            error(
                StatusCode::SERVICE_UNAVAILABLE,
                "speechkit_empty_result",
                "SpeechKit did not return recognized text",
            )
        }),
        Err(parse_error) => {
            tracing::error!("Failed to parse SpeechKit STT response: {}", parse_error);
            Err(error(
                StatusCode::SERVICE_UNAVAILABLE,
                "speechkit_unavailable",
                "Failed to parse SpeechKit STT response",
            ))
>>>>>>> 9aca396 (Update backend and frontend with new features and improvements)
        }
    }
}

fn error(
    status: StatusCode,
    code: impl Into<String>,
    message: impl Into<String>,
) -> (StatusCode, Json<ErrorResponse>) {
    (status, Json(ErrorResponse::new(code, message)))
}
