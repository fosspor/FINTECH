use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use chrono::{DateTime, Utc};
use serde::Serialize;
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
    "crystals": 120,
    "freezes": 1
}))]
pub struct CurrencyBalance {
    pub crystals: i32,
    pub freezes: i32,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "current_streak": 4,
    "longest_streak": 12
}))]
pub struct StreakSummary {
    pub current_streak: i32,
    pub longest_streak: i32,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "name": "ФИНБРО",
    "base_model": "paperclip",
    "current_emotion": "happy"
}))]
pub struct HeroSummary {
    pub name: String,
    pub base_model: String,
    pub current_emotion: String,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "demo@finbro.app",
    "created_at": "2026-05-30T18:52:01Z",
    "currency": { "crystals": 120, "freezes": 1 },
    "streak": { "current_streak": 4, "longest_streak": 12 },
    "hero": { "name": "ФИНБРО", "base_model": "paperclip", "current_emotion": "happy" }
}))]
pub struct UserMeResponse {
    pub id: Uuid,
    pub email: String,
    pub created_at: DateTime<Utc>,
    pub currency: CurrencyBalance,
    pub streak: StreakSummary,
    pub hero: HeroSummary,
}

#[utoipa::path(
    get,
    path = "/users/me",
    tag = "users",
    summary = "Get current user",
    description = "Returns the authenticated user's account, currency, streak and mascot profile from Postgres.",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "Current user returned successfully.", body = UserMeResponse),
        (status = 401, description = "User is not authenticated.", body = ErrorResponse,
            example = json!({ "error": "unauthorized", "message": "Authorization bearer token is required" })
        ),
        (status = 404, description = "User was not found.", body = ErrorResponse,
            example = json!({ "error": "not_found", "message": "User was not found" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn me(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<UserMeResponse>, (StatusCode, Json<ErrorResponse>)> {
    let user_id = user_id_from_headers(&headers)?;

    let row = sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            DateTime<Utc>,
            i32,
            i32,
            i32,
            i32,
            Option<String>,
            Option<String>,
            Option<String>,
        ),
    >(
        r#"
        SELECT
            u.id,
            u.email,
            u.created_at,
            COALESCE(c.crystals, 0) AS crystals,
            COALESCE(c.freezes, 0) AS freezes,
            COALESCE(s.current_streak, 0) AS current_streak,
            COALESCE(s.longest_streak, 0) AS longest_streak,
            hp.name,
            hp.base_model,
            hp.current_emotion
        FROM users u
        LEFT JOIN currencies c ON c.user_id = u.id
        LEFT JOIN streaks s ON s.user_id = u.id
        LEFT JOIN hero_profiles hp ON hp.user_id = u.id
        WHERE u.id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to fetch current user: {err}");
        internal_error()
    })?;

    let Some((
        id,
        email,
        created_at,
        crystals,
        freezes,
        current_streak,
        longest_streak,
        hero_name,
        base_model,
        current_emotion,
    )) = row
    else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse::new("not_found", "User was not found")),
        ));
    };

    Ok(Json(UserMeResponse {
        id,
        email,
        created_at,
        currency: CurrencyBalance { crystals, freezes },
        streak: StreakSummary {
            current_streak,
            longest_streak,
        },
        hero: HeroSummary {
            name: hero_name.unwrap_or_else(|| "ФИНБРО".to_string()),
            base_model: base_model.unwrap_or_else(|| "paperclip".to_string()),
            current_emotion: current_emotion.unwrap_or_else(|| "happy".to_string()),
        },
    }))
}
