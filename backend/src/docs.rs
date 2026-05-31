use serde::Serialize;
use utoipa::{
    openapi::{
        self,
        security::{HttpAuthScheme, HttpBuilder, SecurityScheme},
    },
    Modify, OpenApi, ToSchema,
};

use crate::{
    ai::routes::{
        ChatRequestPayload, ChatResponse, DebtSnapshot, DiagnoseRequestPayload, Diagnosis,
        DiagnoseResponse, FinancialProfileSnapshot, Level, LevelTask,
    },
    auth::routes::{AuthResponse, LoginRequest, LogoutRequest, LogoutResponse, RefreshRequest, RegisterRequest},
    consultations::routes::{Consultation, CreateConsultationRequest, CreateConsultationResponse},
    examples::routes::{
        CreateExampleItemRequest, ExampleItem, UpdateExampleItemRequest,
    },
    financial_profile::routes::ProfileResponse,
    knowledge::routes::KnowledgeChunk,
    learning::routes::{CompleteTaskResponse, LearningLevel, LearningPathResponse, LearningTask},
    tts::routes::{TtsRequest, TtsResponse},
    users::routes::{CurrencyBalance, HeroSummary, StreakSummary, UserMeResponse},
    voice::routes::{TranscriptionResponse, VoiceTranscribeRequest},
};

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "error": "bad_request",
    "message": "Request body is invalid"
}))]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}

impl ErrorResponse {
    pub fn new(error: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            error: error.into(),
            message: message.into(),
        }
    }
}

#[derive(OpenApi)]
#[openapi(
    info(
        title = "ФИНБРО API",
        version = "0.1.0",
        description = "REST API for ФИНБРО: AI financial chat, user profile diagnosis, voice transcription, TTS, consultations and documented CRUD examples."
    ),
    servers(
        (url = "http://localhost:8000", description = "Local Docker backend")
    ),
    paths(
        crate::auth::routes::register,
        crate::auth::routes::login,
        crate::auth::routes::refresh,
        crate::auth::routes::logout,
        crate::voice::routes::transcribe,
        crate::voice::routes::transcribe_api,
        crate::tts::routes::generate,
        crate::ai::routes::chat,
        crate::ai::routes::diagnose,
        crate::users::routes::me,
        crate::financial_profile::routes::get_profile,
        crate::knowledge::routes::list_chunks,
        crate::consultations::routes::list_consultations,
        crate::consultations::routes::create_consultation,
        crate::learning::routes::get_path,
        crate::learning::routes::get_level,
        crate::learning::routes::complete_task,
        crate::examples::routes::list_items,
        crate::examples::routes::create_item,
        crate::examples::routes::get_item,
        crate::examples::routes::update_item,
        crate::examples::routes::delete_item,
    ),
    components(schemas(
        ErrorResponse,
        RegisterRequest,
        LoginRequest,
        RefreshRequest,
        LogoutRequest,
        AuthResponse,
        LogoutResponse,
        VoiceTranscribeRequest,
        TranscriptionResponse,
        TtsRequest,
        TtsResponse,
        ChatRequestPayload,
        ChatResponse,
        DiagnoseRequestPayload,
        DebtSnapshot,
        FinancialProfileSnapshot,
        Diagnosis,
        LevelTask,
        Level,
        DiagnoseResponse,
        CurrencyBalance,
        StreakSummary,
        HeroSummary,
        UserMeResponse,
        ProfileResponse,
        KnowledgeChunk,
        LearningTask,
        LearningLevel,
        LearningPathResponse,
        CompleteTaskResponse,
        Consultation,
        CreateConsultationRequest,
        CreateConsultationResponse,
        ExampleItem,
        CreateExampleItemRequest,
        UpdateExampleItemRequest,
    )),
    tags(
        (name = "auth", description = "Authentication endpoints"),
        (name = "voice", description = "Speech-to-text endpoints"),
        (name = "tts", description = "Text-to-speech endpoints"),
        (name = "ai", description = "AI chat, profile extraction and learning path generation"),
        (name = "users", description = "Authenticated user account endpoints"),
        (name = "profile", description = "Financial profile endpoints"),
        (name = "knowledge", description = "Knowledge base endpoints"),
        (name = "consultations", description = "Consultation endpoints"),
        (name = "learning", description = "Learning paths, levels and task progress endpoints"),
        (name = "examples", description = "Documented CRUD examples for future API resources")
    ),
    modifiers(&SecurityAddon)
)]
pub struct ApiDoc;

pub struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer_auth",
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .description(Some("JWT from /auth/register or /auth/login"))
                        .build(),
                ),
            );
        }
    }
}
