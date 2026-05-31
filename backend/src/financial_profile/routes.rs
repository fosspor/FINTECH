use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use serde::Serialize;
use std::sync::Arc;
use utoipa::ToSchema;

use crate::{
    auth::routes::{internal_error, user_id_from_headers},
    docs::ErrorResponse,
    AppState,
};

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "monthly_income": 80000.0,
    "has_credit": true,
    "main_problem": "Нет финансовой подушки",
    "main_risk": "Непредвиденная трата может выбить бюджет",
    "first_recommendation": "Отложить первую небольшую сумму",
    "goals": ["Накопить на машину"]
}))]
pub struct ProfileResponse {
    pub monthly_income: Option<f64>,
    pub has_credit: bool,
    pub main_problem: Option<String>,
    pub main_risk: Option<String>,
    pub first_recommendation: Option<String>,
    pub goals: Vec<String>,
}

#[utoipa::path(
    get,
    path = "/profile",
    tag = "profile",
    summary = "Get financial profile",
    description = "Returns the authenticated user's financial profile and active goals from Postgres.",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "Profile returned successfully.", body = ProfileResponse),
        (status = 401, description = "User is not authenticated.", body = ErrorResponse,
            example = json!({ "error": "unauthorized", "message": "Authentication is required" })
        ),
        (status = 404, description = "Profile was not found.", body = ErrorResponse,
            example = json!({ "error": "profile_not_found", "message": "Financial profile was not found" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn get_profile(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<ProfileResponse>, (StatusCode, Json<ErrorResponse>)> {
    let user_id = user_id_from_headers(&headers)?;

    let profile = sqlx::query_as::<_, (Option<f64>, bool, Option<String>, Option<String>, Option<String>)>(
        r#"
        SELECT monthly_income::float8, has_credit, main_problem, main_risk, first_recommendation
        FROM financial_profiles
        WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to fetch financial profile: {err}");
        internal_error()
    })?;

    let Some((monthly_income, has_credit, main_problem, main_risk, first_recommendation)) = profile else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse::new(
                "profile_not_found",
                "Financial profile was not found",
            )),
        ));
    };

    let goals = sqlx::query_scalar::<_, String>(
        "SELECT title FROM goals WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to fetch goals: {err}");
        internal_error()
    })?;

    Ok(Json(ProfileResponse {
        monthly_income,
        has_credit,
        main_problem,
        main_risk,
        first_recommendation,
        goals,
    }))
}
