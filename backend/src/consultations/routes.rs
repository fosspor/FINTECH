use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::{
    auth::routes::{internal_error, user_id_from_headers},
    docs::ErrorResponse,
    AppState,
};

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Разобрать кредитку",
    "status": "active",
    "created_at": "2026-05-30T18:00:00Z"
}))]
pub struct Consultation {
    pub id: Uuid,
    pub title: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Deserialize, ToSchema)]
#[schema(example = json!({
    "topic": "Разобрать кредитку",
    "notes": "Хочу понять, как быстрее закрыть долг"
}))]
pub struct CreateConsultationRequest {
    pub topic: String,
    pub notes: Option<String>,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active"
}))]
pub struct CreateConsultationResponse {
    pub id: Uuid,
    pub status: String,
}

#[utoipa::path(
    get,
    path = "/consultations",
    tag = "consultations",
    summary = "List consultations",
    description = "Returns authenticated user's consultation sessions from Postgres.",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "Consultations returned successfully.", body = [Consultation]),
        (status = 401, description = "User is not authenticated.", body = ErrorResponse,
            example = json!({ "error": "unauthorized", "message": "Authentication is required" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn list_consultations(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<Vec<Consultation>>, (StatusCode, Json<ErrorResponse>)> {
    let user_id = user_id_from_headers(&headers)?;

    let consultations = sqlx::query_as::<_, (Uuid, Option<String>, String, DateTime<Utc>)>(
        r#"
        SELECT id, title, status, created_at
        FROM consultations
        WHERE user_id = $1
        ORDER BY created_at DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to list consultations: {err}");
        internal_error()
    })?
    .into_iter()
    .map(|(id, title, status, created_at)| Consultation {
        id,
        title,
        status,
        created_at,
    })
    .collect();

    Ok(Json(consultations))
}

#[utoipa::path(
    post,
    path = "/consultations",
    tag = "consultations",
    summary = "Create consultation",
    description = "Creates a consultation session for the authenticated user and optionally stores the initial user note as the first message.",
    security(("bearer_auth" = [])),
    request_body(
        content = CreateConsultationRequest,
        description = "Consultation creation payload.",
        example = json!({
            "topic": "Разобрать кредитку",
            "notes": "Хочу понять, как быстрее закрыть долг"
        })
    ),
    responses(
        (status = 201, description = "Consultation created successfully.", body = CreateConsultationResponse),
        (status = 400, description = "Invalid request body.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "topic is required" })
        ),
        (status = 401, description = "User is not authenticated.", body = ErrorResponse,
            example = json!({ "error": "unauthorized", "message": "Authentication is required" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn create_consultation(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<CreateConsultationRequest>,
) -> Result<(StatusCode, Json<CreateConsultationResponse>), (StatusCode, Json<ErrorResponse>)> {
    let user_id = user_id_from_headers(&headers)?;
    let topic = payload.topic.trim();

    if topic.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new("bad_request", "topic is required")),
        ));
    }

    let mut transaction = state.db.begin().await.map_err(|err| {
        tracing::error!("Failed to start consultation transaction: {err}");
        internal_error()
    })?;

    let (id, status) = sqlx::query_as::<_, (Uuid, String)>(
        r#"
        INSERT INTO consultations (user_id, title, status)
        VALUES ($1, $2, 'active')
        RETURNING id, status
        "#,
    )
    .bind(user_id)
    .bind(topic)
    .fetch_one(&mut *transaction)
    .await
    .map_err(|err| {
        tracing::error!("Failed to create consultation: {err}");
        internal_error()
    })?;

    if let Some(notes) = payload.notes.as_deref().map(str::trim).filter(|notes| !notes.is_empty()) {
        sqlx::query(
            "INSERT INTO messages (consultation_id, role, content) VALUES ($1, 'user', $2)",
        )
        .bind(id)
        .bind(notes)
        .execute(&mut *transaction)
        .await
        .map_err(|err| {
            tracing::error!("Failed to create initial consultation message: {err}");
            internal_error()
        })?;
    }

    transaction.commit().await.map_err(|err| {
        tracing::error!("Failed to commit consultation transaction: {err}");
        internal_error()
    })?;

    Ok((StatusCode::CREATED, Json(CreateConsultationResponse { id, status })))
}
