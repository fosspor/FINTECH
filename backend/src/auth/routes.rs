use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::{env, sync::Arc};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::{docs::ErrorResponse, AppState};

#[derive(Deserialize, ToSchema)]
#[schema(example = json!({
    "email": "demo@finbro.app",
    "password": "strong-password",
    "name": "Demo User"
}))]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub name: String,
}

#[derive(Deserialize, ToSchema)]
#[schema(example = json!({
    "email": "demo@finbro.app",
    "password": "strong-password"
}))]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize, ToSchema)]
#[schema(example = json!({
    "refresh_token": "8c4f95a8-1a6d-4b57-a52c-ec4577420000"
}))]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Deserialize, ToSchema)]
#[schema(example = json!({
    "refresh_token": "8c4f95a8-1a6d-4b57-a52c-ec4577420000"
}))]
pub struct LogoutRequest {
    pub refresh_token: Option<String>,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "message": "User registered successfully",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.example.signature",
    "refresh_token": "8c4f95a8-1a6d-4b57-a52c-ec4577420000"
}))]
pub struct AuthResponse {
    pub message: String,
    pub user_id: Uuid,
    pub token: String,
    pub refresh_token: String,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "message": "Logged out successfully"
}))]
pub struct LogoutResponse {
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid,
    pub exp: usize,
}

#[utoipa::path(
    post,
    path = "/auth/register",
    tag = "auth",
    summary = "Register user",
    description = "Creates a real user in Postgres, stores a bcrypt password hash and returns JWT plus refresh token.",
    request_body(
        content = RegisterRequest,
        description = "Registration payload.",
        example = json!({
            "email": "demo@finbro.app",
            "password": "strong-password",
            "name": "Demo User"
        })
    ),
    responses(
        (status = 201, description = "User registered successfully.", body = AuthResponse),
        (status = 400, description = "Invalid registration payload.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "Valid email and password with at least 8 characters are required" })
        ),
        (status = 409, description = "User already exists.", body = ErrorResponse,
            example = json!({ "error": "user_exists", "message": "User with this email already exists" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<AuthResponse>), (StatusCode, Json<ErrorResponse>)> {
    let email = normalize_email(&payload.email);
    if !is_valid_email(&email) || payload.password.len() < 8 || payload.name.trim().is_empty() {
        return Err(error(
            StatusCode::BAD_REQUEST,
            "bad_request",
            "Valid email, name and password with at least 8 characters are required",
        ));
    }

    let password_hash = hash(&payload.password, DEFAULT_COST).map_err(|err| {
        tracing::error!("Failed to hash password: {err}");
        internal_error()
    })?;

    let user_id = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
    )
    .bind(&email)
    .bind(password_hash)
    .fetch_one(&state.db)
    .await
    .map_err(|err| {
        if is_unique_violation(&err) {
            error(
                StatusCode::CONFLICT,
                "user_exists",
                "User with this email already exists",
            )
        } else {
            tracing::error!("Failed to register user: {err}");
            internal_error()
        }
    })?;

    create_default_user_records(&state.db, user_id).await?;
    let (token, refresh_token) = issue_tokens(&state.db, user_id).await?;

    Ok((
        StatusCode::CREATED,
        Json(AuthResponse {
            message: "User registered successfully".to_string(),
            user_id,
            token,
            refresh_token,
        }),
    ))
}

#[utoipa::path(
    post,
    path = "/auth/login",
    tag = "auth",
    summary = "Login user",
    description = "Authenticates a real Postgres user with bcrypt password verification and returns JWT plus refresh token.",
    request_body(
        content = LoginRequest,
        description = "Login payload.",
        example = json!({
            "email": "demo@finbro.app",
            "password": "strong-password"
        })
    ),
    responses(
        (status = 200, description = "Login successful.", body = AuthResponse),
        (status = 400, description = "Invalid login payload.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "Email and password are required" })
        ),
        (status = 401, description = "Invalid credentials.", body = ErrorResponse,
            example = json!({ "error": "invalid_credentials", "message": "Invalid email or password" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
    let email = normalize_email(&payload.email);
    if email.is_empty() || payload.password.is_empty() {
        return Err(error(
            StatusCode::BAD_REQUEST,
            "bad_request",
            "Email and password are required",
        ));
    }

    let user = sqlx::query_as::<_, (Uuid, String)>(
        "SELECT id, password_hash FROM users WHERE email = $1",
    )
    .bind(&email)
    .fetch_optional(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to fetch user for login: {err}");
        internal_error()
    })?;

    let Some((user_id, password_hash)) = user else {
        return Err(invalid_credentials());
    };

    let password_ok = verify(&payload.password, &password_hash).map_err(|err| {
        tracing::error!("Failed to verify password: {err}");
        internal_error()
    })?;

    if !password_ok {
        return Err(invalid_credentials());
    }

    let (token, refresh_token) = issue_tokens(&state.db, user_id).await?;

    Ok(Json(AuthResponse {
        message: "Login successful".to_string(),
        user_id,
        token,
        refresh_token,
    }))
}

#[utoipa::path(
    post,
    path = "/auth/refresh",
    tag = "auth",
    summary = "Refresh auth tokens",
    description = "Rotates a valid refresh token from Postgres and returns a new JWT plus refresh token.",
    request_body(
        content = RefreshRequest,
        description = "Refresh token issued by register or login.",
        example = json!({ "refresh_token": "8c4f95a8-1a6d-4b57-a52c-ec4577420000" })
    ),
    responses(
        (status = 200, description = "Token refreshed successfully.", body = AuthResponse),
        (status = 400, description = "Invalid request body.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "refresh_token is required" })
        ),
        (status = 401, description = "Refresh token is invalid, expired or revoked.", body = ErrorResponse,
            example = json!({ "error": "invalid_refresh_token", "message": "Refresh token is invalid or expired" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn refresh(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RefreshRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
    let refresh_token = parse_refresh_token(&payload.refresh_token)?;

    let mut tx = state.db.begin().await.map_err(|err| {
        tracing::error!("Failed to start refresh transaction: {err}");
        internal_error()
    })?;

    let token_row = sqlx::query_as::<_, (Uuid,)>(
        r#"
        SELECT user_id
        FROM refresh_tokens
        WHERE token = $1
          AND expires_at > CURRENT_TIMESTAMP
          AND revoked_at IS NULL
        "#,
    )
    .bind(refresh_token)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to fetch refresh token: {err}");
        internal_error()
    })?;

    let Some((user_id,)) = token_row else {
        return Err(invalid_refresh_token());
    };

    sqlx::query("UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token = $1")
        .bind(refresh_token)
        .execute(&mut *tx)
        .await
        .map_err(|err| {
            tracing::error!("Failed to revoke refresh token: {err}");
            internal_error()
        })?;

    let expires_at = Utc::now() + Duration::days(7);
    let new_refresh_token = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO refresh_tokens (user_id, expires_at) VALUES ($1, $2) RETURNING token",
    )
    .bind(user_id)
    .bind(expires_at)
    .fetch_one(&mut *tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to create rotated refresh token: {err}");
        internal_error()
    })?;

    tx.commit().await.map_err(|err| {
        tracing::error!("Failed to commit refresh transaction: {err}");
        internal_error()
    })?;

    let token = jwt_for_user(user_id, expires_at)?;

    Ok(Json(AuthResponse {
        message: "Token refreshed successfully".to_string(),
        user_id,
        token,
        refresh_token: new_refresh_token.to_string(),
    }))
}

#[utoipa::path(
    post,
    path = "/auth/logout",
    tag = "auth",
    summary = "Logout user",
    description = "Revokes one refresh token if it is provided. If only Bearer JWT is provided, revokes all active refresh tokens for the authenticated user.",
    security(("bearer_auth" = [])),
    request_body(
        content = LogoutRequest,
        description = "Optional refresh token to revoke.",
        example = json!({ "refresh_token": "8c4f95a8-1a6d-4b57-a52c-ec4577420000" })
    ),
    responses(
        (status = 200, description = "Logged out successfully.", body = LogoutResponse),
        (status = 400, description = "Invalid refresh token.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "refresh_token is invalid" })
        ),
        (status = 401, description = "User is not authenticated.", body = ErrorResponse,
            example = json!({ "error": "unauthorized", "message": "Authorization bearer token is required" })
        ),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn logout(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<LogoutRequest>,
) -> Result<Json<LogoutResponse>, (StatusCode, Json<ErrorResponse>)> {
    if let Some(refresh_token) = payload.refresh_token.as_deref().filter(|value| !value.trim().is_empty()) {
        let refresh_token = parse_refresh_token(refresh_token)?;
        sqlx::query("UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token = $1")
            .bind(refresh_token)
            .execute(&state.db)
            .await
            .map_err(|err| {
                tracing::error!("Failed to revoke refresh token: {err}");
                internal_error()
            })?;
    } else {
        let user_id = user_id_from_headers(&headers)?;
        sqlx::query(
            "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL",
        )
        .bind(user_id)
        .execute(&state.db)
        .await
        .map_err(|err| {
            tracing::error!("Failed to revoke user refresh tokens: {err}");
            internal_error()
        })?;
    }

    Ok(Json(LogoutResponse {
        message: "Logged out successfully".to_string(),
    }))
}

pub fn user_id_from_headers(headers: &HeaderMap) -> Result<Uuid, (StatusCode, Json<ErrorResponse>)> {
    let auth_header = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| {
            error(
                StatusCode::UNAUTHORIZED,
                "unauthorized",
                "Authorization bearer token is required",
            )
        })?;

    let token = auth_header.strip_prefix("Bearer ").ok_or_else(|| {
        error(
            StatusCode::UNAUTHORIZED,
            "unauthorized",
            "Authorization bearer token is required",
        )
    })?;

    let secret = jwt_secret();
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| {
        error(
            StatusCode::UNAUTHORIZED,
            "invalid_token",
            "Authorization token is invalid or expired",
        )
    })?;

    Ok(token_data.claims.sub)
}

fn normalize_email(email: &str) -> String {
    email.trim().to_lowercase()
}

fn is_valid_email(email: &str) -> bool {
    let mut parts = email.split('@');
    matches!((parts.next(), parts.next(), parts.next()), (Some(local), Some(domain), None) if !local.is_empty() && domain.contains('.'))
}

fn jwt_secret() -> String {
    env::var("JWT_SECRET").unwrap_or_else(|_| "change_me".to_string())
}

async fn issue_tokens(
    db: &PgPool,
    user_id: Uuid,
) -> Result<(String, String), (StatusCode, Json<ErrorResponse>)> {
    let expires_at = Utc::now() + Duration::days(7);
    let token = jwt_for_user(user_id, expires_at)?;

    let refresh_token = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO refresh_tokens (user_id, expires_at) VALUES ($1, $2) RETURNING token",
    )
    .bind(user_id)
    .bind(expires_at)
    .fetch_one(db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to create refresh token: {err}");
        internal_error()
    })?;

    Ok((token, refresh_token.to_string()))
}

fn jwt_for_user(user_id: Uuid, expires_at: chrono::DateTime<Utc>) -> Result<String, (StatusCode, Json<ErrorResponse>)> {
    let claims = Claims {
        sub: user_id,
        exp: expires_at.timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret().as_bytes()),
    )
    .map_err(|err| {
        tracing::error!("Failed to encode JWT: {err}");
        internal_error()
    })
}

async fn create_default_user_records(
    db: &PgPool,
    user_id: Uuid,
) -> Result<(), (StatusCode, Json<ErrorResponse>)> {
    for query in [
        "INSERT INTO currencies (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
        "INSERT INTO streaks (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
        "INSERT INTO hero_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
        "INSERT INTO financial_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
    ] {
        sqlx::query(query)
            .bind(user_id)
            .execute(db)
            .await
            .map_err(|err| {
                tracing::error!("Failed to create default user records: {err}");
                internal_error()
            })?;
    }

    Ok(())
}

fn is_unique_violation(err: &sqlx::Error) -> bool {
    err.as_database_error()
        .and_then(|db_err| db_err.code())
        .map(|code| code == "23505")
        .unwrap_or(false)
}

fn invalid_credentials() -> (StatusCode, Json<ErrorResponse>) {
    error(
        StatusCode::UNAUTHORIZED,
        "invalid_credentials",
        "Invalid email or password",
    )
}

fn invalid_refresh_token() -> (StatusCode, Json<ErrorResponse>) {
    error(
        StatusCode::UNAUTHORIZED,
        "invalid_refresh_token",
        "Refresh token is invalid or expired",
    )
}

fn parse_refresh_token(token: &str) -> Result<Uuid, (StatusCode, Json<ErrorResponse>)> {
    Uuid::parse_str(token.trim()).map_err(|_| {
        error(
            StatusCode::BAD_REQUEST,
            "bad_request",
            "refresh_token is invalid",
        )
    })
}

pub fn internal_error() -> (StatusCode, Json<ErrorResponse>) {
    error(
        StatusCode::INTERNAL_SERVER_ERROR,
        "internal_error",
        "Unexpected server error",
    )
}

pub fn error(
    status: StatusCode,
    code: impl Into<String>,
    message: impl Into<String>,
) -> (StatusCode, Json<ErrorResponse>) {
    (status, Json(ErrorResponse::new(code, message)))
}
