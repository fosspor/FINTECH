use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;

use crate::{auth::routes::internal_error, docs::ErrorResponse, AppState};

#[derive(Serialize, ToSchema, Clone)]
#[schema(example = json!({
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Emergency fund lesson",
    "description": "A short practice item for the safety cushion level",
    "completed": false
}))]
pub struct ExampleItem {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub completed: bool,
}

#[derive(Deserialize, ToSchema)]
#[schema(example = json!({
    "title": "Emergency fund lesson",
    "description": "A short practice item for the safety cushion level",
    "completed": false
}))]
pub struct CreateExampleItemRequest {
    pub title: String,
    pub description: String,
    pub completed: bool,
}

#[derive(Deserialize, ToSchema)]
#[schema(example = json!({
    "title": "Updated emergency fund lesson",
    "description": "Updated description",
    "completed": true
}))]
pub struct UpdateExampleItemRequest {
    pub title: String,
    pub description: String,
    pub completed: bool,
}

#[derive(Deserialize, IntoParams)]
#[into_params(parameter_in = Path)]
#[allow(dead_code)]
pub struct ItemPath {
    #[param(example = "550e8400-e29b-41d4-a716-446655440000")]
    pub id: Uuid,
}

#[utoipa::path(
    get,
    path = "/examples/items",
    tag = "examples",
    summary = "List example items",
    description = "Returns all example items from Postgres. This CRUD group shows the recommended documentation style for new FinBro REST resources.",
    responses(
        (status = 200, description = "Items returned successfully.", body = [ExampleItem],
            example = json!([{
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Emergency fund lesson",
                "description": "A short practice item for the safety cushion level",
                "completed": false
            }])
        ),
        (status = 500, description = "Database query failed.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn list_items(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<ExampleItem>>, (StatusCode, Json<ErrorResponse>)> {
    let rows = sqlx::query_as::<_, (Uuid, String, String, bool)>(
        r#"
        SELECT id, title, description, completed
        FROM example_items
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to list example items: {err}");
        internal_error()
    })?;

    Ok(Json(rows.into_iter().map(row_to_item).collect()))
}

#[utoipa::path(
    post,
    path = "/examples/items",
    tag = "examples",
    summary = "Create example item",
    description = "Creates a Postgres-backed example item and returns it with a generated UUID.",
    request_body(
        content = CreateExampleItemRequest,
        description = "Item payload to create.",
        example = json!({
            "title": "Emergency fund lesson",
            "description": "A short practice item for the safety cushion level",
            "completed": false
        })
    ),
    responses(
        (status = 201, description = "Item created successfully.", body = ExampleItem,
            example = json!({
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Emergency fund lesson",
                "description": "A short practice item for the safety cushion level",
                "completed": false
            })
        ),
        (status = 400, description = "Invalid JSON body.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "title is required" })
        ),
        (status = 500, description = "Database query failed.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn create_item(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateExampleItemRequest>,
) -> Result<(StatusCode, Json<ExampleItem>), (StatusCode, Json<ErrorResponse>)> {
    if payload.title.trim().is_empty() {
        return Err(error(
            StatusCode::BAD_REQUEST,
            "bad_request",
            "title is required",
        ));
    }

    let row = sqlx::query_as::<_, (Uuid, String, String, bool)>(
        r#"
        INSERT INTO example_items (title, description, completed)
        VALUES ($1, $2, $3)
        RETURNING id, title, description, completed
        "#,
    )
    .bind(payload.title.trim())
    .bind(payload.description.trim())
    .bind(payload.completed)
    .fetch_one(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to create example item: {err}");
        internal_error()
    })?;

    Ok((StatusCode::CREATED, Json(row_to_item(row))))
}

#[utoipa::path(
    get,
    path = "/examples/items/{id}",
    tag = "examples",
    summary = "Get example item",
    description = "Returns one Postgres-backed example item by UUID.",
    params(ItemPath),
    responses(
        (status = 200, description = "Item found.", body = ExampleItem,
            example = json!({
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Emergency fund lesson",
                "description": "A short practice item for the safety cushion level",
                "completed": false
            })
        ),
        (status = 400, description = "Invalid UUID path parameter.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "Invalid item id" })
        ),
        (status = 404, description = "Item was not found.", body = ErrorResponse,
            example = json!({ "error": "not_found", "message": "Example item not found" })
        ),
        (status = 500, description = "Database query failed.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn get_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ExampleItem>, (StatusCode, Json<ErrorResponse>)> {
    let row = sqlx::query_as::<_, (Uuid, String, String, bool)>(
        "SELECT id, title, description, completed FROM example_items WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to get example item: {err}");
        internal_error()
    })?
    .ok_or_else(not_found)?;

    Ok(Json(row_to_item(row)))
}

#[utoipa::path(
    put,
    path = "/examples/items/{id}",
    tag = "examples",
    summary = "Update example item",
    description = "Replaces an existing Postgres-backed example item by UUID.",
    params(ItemPath),
    request_body(
        content = UpdateExampleItemRequest,
        description = "Replacement item payload.",
        example = json!({
            "title": "Updated emergency fund lesson",
            "description": "Updated description",
            "completed": true
        })
    ),
    responses(
        (status = 200, description = "Item updated successfully.", body = ExampleItem,
            example = json!({
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Updated emergency fund lesson",
                "description": "Updated description",
                "completed": true
            })
        ),
        (status = 400, description = "Invalid UUID or JSON body.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "title is required" })
        ),
        (status = 404, description = "Item was not found.", body = ErrorResponse,
            example = json!({ "error": "not_found", "message": "Example item not found" })
        ),
        (status = 500, description = "Database query failed.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn update_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateExampleItemRequest>,
) -> Result<Json<ExampleItem>, (StatusCode, Json<ErrorResponse>)> {
    if payload.title.trim().is_empty() {
        return Err(error(
            StatusCode::BAD_REQUEST,
            "bad_request",
            "title is required",
        ));
    }

    let row = sqlx::query_as::<_, (Uuid, String, String, bool)>(
        r#"
        UPDATE example_items
        SET title = $2, description = $3, completed = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, title, description, completed
        "#,
    )
    .bind(id)
    .bind(payload.title.trim())
    .bind(payload.description.trim())
    .bind(payload.completed)
    .fetch_optional(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to update example item: {err}");
        internal_error()
    })?
    .ok_or_else(not_found)?;

    Ok(Json(row_to_item(row)))
}

#[utoipa::path(
    delete,
    path = "/examples/items/{id}",
    tag = "examples",
    summary = "Delete example item",
    description = "Deletes one Postgres-backed example item by UUID.",
    params(ItemPath),
    responses(
        (status = 204, description = "Item deleted successfully."),
        (status = 400, description = "Invalid UUID path parameter.", body = ErrorResponse,
            example = json!({ "error": "bad_request", "message": "Invalid item id" })
        ),
        (status = 404, description = "Item was not found.", body = ErrorResponse,
            example = json!({ "error": "not_found", "message": "Example item not found" })
        ),
        (status = 500, description = "Database query failed.", body = ErrorResponse,
            example = json!({ "error": "internal_error", "message": "Unexpected server error" })
        )
    )
)]
pub async fn delete_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    let result = sqlx::query("DELETE FROM example_items WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|err| {
            tracing::error!("Failed to delete example item: {err}");
            internal_error()
        })?;

    if result.rows_affected() == 0 {
        return Err(not_found());
    }

    Ok(StatusCode::NO_CONTENT)
}

fn row_to_item((id, title, description, completed): (Uuid, String, String, bool)) -> ExampleItem {
    ExampleItem {
        id,
        title,
        description,
        completed,
    }
}

fn not_found() -> (StatusCode, Json<ErrorResponse>) {
    (
        StatusCode::NOT_FOUND,
        Json(ErrorResponse::new("not_found", "Example item not found")),
    )
}

fn error(
    status: StatusCode,
    code: impl Into<String>,
    message: impl Into<String>,
) -> (StatusCode, Json<ErrorResponse>) {
    (status, Json(ErrorResponse::new(code, message)))
}
