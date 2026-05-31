use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;

use crate::{auth::routes::internal_error, docs::ErrorResponse, AppState};

#[derive(Deserialize, IntoParams)]
pub struct KnowledgeQuery {
    #[param(example = "кредит")]
    pub topic: Option<String>,
    #[param(example = "budget")]
    pub tag: Option<String>,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "topic": "Кредиты",
    "content": "Кредитная нагрузка безопаснее, когда платежи не съедают большую часть свободных денег.",
    "author": "FinBro",
    "tags": ["credit", "budget"],
    "created_at": "2026-05-30T18:52:01Z"
}))]
pub struct KnowledgeChunk {
    pub id: Uuid,
    pub topic: String,
    pub content: String,
    pub author: Option<String>,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
}

#[utoipa::path(
    get,
    path = "/knowledge",
    tag = "knowledge",
    summary = "List knowledge chunks",
    description = "Returns educational knowledge chunks used by the AI mentor and learning levels. Results can be filtered by topic text and tag.",
    params(KnowledgeQuery),
    responses(
        (status = 200, description = "Knowledge chunks returned successfully.", body = [KnowledgeChunk]),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn list_chunks(
    State(state): State<Arc<AppState>>,
    Query(query): Query<KnowledgeQuery>,
) -> Result<Json<Vec<KnowledgeChunk>>, (StatusCode, Json<ErrorResponse>)> {
    let topic_filter = query
        .topic
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|value| format!("%{value}%"));
    let tag_filter = query
        .tag
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);

    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Vec<String>, DateTime<Utc>)>(
        r#"
        SELECT id, topic, content, author, COALESCE(tags, ARRAY[]::TEXT[]) AS tags, created_at
        FROM knowledge_chunks
        WHERE ($1::TEXT IS NULL OR topic ILIKE $1)
          AND ($2::TEXT IS NULL OR $2 = ANY(tags))
        ORDER BY created_at DESC
        LIMIT 100
        "#,
    )
    .bind(topic_filter)
    .bind(tag_filter)
    .fetch_all(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to list knowledge chunks: {err}");
        internal_error()
    })?;

    Ok(Json(
        rows.into_iter()
            .map(|(id, topic, content, author, tags, created_at)| KnowledgeChunk {
                id,
                topic,
                content,
                author,
                tags,
                created_at,
            })
            .collect(),
    ))
}
