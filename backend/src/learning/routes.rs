use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use chrono::{NaiveDate, Utc};
use serde::Serialize;
use std::sync::Arc;
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;

use crate::{
    auth::routes::{internal_error, user_id_from_headers},
    docs::ErrorResponse,
    AppState,
};

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Записать доход месяца",
    "description": "",
    "type": "action",
    "crystals": 20,
    "status": "pending"
}))]
pub struct LearningTask {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    #[schema(example = "quiz")]
    pub r#type: String,
    pub crystals: i32,
    #[schema(example = "pending")]
    pub status: String,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Финансовый снимок",
    "description": "Собираем доход, траты, долги и цель.",
    "icon_name": "Sprout",
    "status": "current",
    "order_index": 1,
    "tasks": []
}))]
pub struct LearningLevel {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub icon_name: String,
    #[schema(example = "current")]
    pub status: String,
    pub order_index: i32,
    pub tasks: Vec<LearningTask>,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "path_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Персональный путь",
    "description": "Путь построен по финансовому профилю.",
    "levels": []
}))]
pub struct LearningPathResponse {
    pub path_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub levels: Vec<LearningLevel>,
}

#[derive(Serialize, ToSchema)]
#[schema(example = json!({
    "task": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Записать доход месяца",
        "description": "",
        "type": "action",
        "crystals": 20,
        "status": "completed"
    },
    "crystals": 120,
    "current_streak": 5,
    "rewarded": true
}))]
pub struct CompleteTaskResponse {
    pub task: LearningTask,
    pub crystals: i32,
    pub current_streak: i32,
    pub rewarded: bool,
}

#[derive(serde::Deserialize, IntoParams)]
#[into_params(parameter_in = Path)]
#[allow(dead_code)]
pub struct LevelPath {
    pub id: Uuid,
}

#[derive(serde::Deserialize, IntoParams)]
#[into_params(parameter_in = Path)]
#[allow(dead_code)]
pub struct TaskPath {
    pub id: Uuid,
}

#[utoipa::path(
    get,
    path = "/path",
    tag = "learning",
    summary = "Get current learning path",
    description = "Returns the authenticated user's active Postgres-backed Duolingo-like financial path.",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "Learning path returned successfully.", body = LearningPathResponse),
        (status = 401, description = "User is not authenticated.", body = ErrorResponse),
        (status = 404, description = "No active learning path was found.", body = ErrorResponse),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse)
    )
)]
pub async fn get_path(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<LearningPathResponse>, (StatusCode, Json<ErrorResponse>)> {
    let user_id = user_id_from_headers(&headers)?;
    let path = load_active_path(&state, user_id).await?;
    Ok(Json(path))
}

#[utoipa::path(
    get,
    path = "/levels/{id}",
    tag = "learning",
    summary = "Get level details",
    description = "Returns one level from the authenticated user's active path.",
    params(LevelPath),
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "Level returned successfully.", body = LearningLevel),
        (status = 401, description = "User is not authenticated.", body = ErrorResponse),
        (status = 404, description = "Level was not found.", body = ErrorResponse),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse)
    )
)]
pub async fn get_level(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(level_id): Path<Uuid>,
) -> Result<Json<LearningLevel>, (StatusCode, Json<ErrorResponse>)> {
    let user_id = user_id_from_headers(&headers)?;
    let path = load_active_path(&state, user_id).await?;
    let level = path
        .levels
        .into_iter()
        .find(|level| level.id == level_id)
        .ok_or_else(not_found)?;
    Ok(Json(level))
}

#[utoipa::path(
    post,
    path = "/tasks/{id}/complete",
    tag = "learning",
    summary = "Complete task",
    description = "Marks a task as completed, awards crystals once, and updates the user's streak.",
    params(TaskPath),
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "Task completed successfully.", body = CompleteTaskResponse),
        (status = 401, description = "User is not authenticated.", body = ErrorResponse),
        (status = 404, description = "Task was not found.", body = ErrorResponse),
        (status = 500, description = "Unexpected server error.", body = ErrorResponse)
    )
)]
pub async fn complete_task(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(task_id): Path<Uuid>,
) -> Result<Json<CompleteTaskResponse>, (StatusCode, Json<ErrorResponse>)> {
    let user_id = user_id_from_headers(&headers)?;

    let mut tx = state.db.begin().await.map_err(|err| {
        tracing::error!("Failed to start complete task transaction: {err}");
        internal_error()
    })?;

    let task_row = sqlx::query_as::<_, (Uuid, String, Option<String>, String, i32, String)>(
        r#"
        SELECT t.id, t.title, t.description, t.task_type, t.reward_crystals,
               COALESCE(ut.status, 'pending') AS status
        FROM tasks t
        JOIN levels l ON l.id = t.level_id
        JOIN financial_paths fp ON fp.id = l.path_id
        LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = $1
        WHERE t.id = $2 AND fp.user_id = $1 AND fp.status = 'active'
        "#,
    )
    .bind(user_id)
    .bind(task_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to fetch task for completion: {err}");
        internal_error()
    })?
    .ok_or_else(not_found)?;

    let was_completed = task_row.5 == "completed";

    sqlx::query(
        r#"
        INSERT INTO user_tasks (user_id, task_id, status, completed_at)
        VALUES ($1, $2, 'completed', CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, task_id)
        DO UPDATE SET status = 'completed', completed_at = COALESCE(user_tasks.completed_at, CURRENT_TIMESTAMP)
        "#,
    )
    .bind(user_id)
    .bind(task_id)
    .execute(&mut *tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to mark task completed: {err}");
        internal_error()
    })?;

    let reward = if was_completed { 0 } else { task_row.4 };

    let crystals = sqlx::query_scalar::<_, i32>(
        r#"
        INSERT INTO currencies (user_id, crystals)
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET crystals = currencies.crystals + $2, updated_at = CURRENT_TIMESTAMP
        RETURNING crystals
        "#,
    )
    .bind(user_id)
    .bind(reward)
    .fetch_one(&mut *tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to update crystals: {err}");
        internal_error()
    })?;

    let current_streak = update_streak(&mut tx, user_id).await?;

    tx.commit().await.map_err(|err| {
        tracing::error!("Failed to commit complete task transaction: {err}");
        internal_error()
    })?;

    Ok(Json(CompleteTaskResponse {
        task: LearningTask {
            id: task_row.0,
            title: task_row.1,
            description: task_row.2,
            r#type: task_row.3,
            crystals: task_row.4,
            status: "completed".to_string(),
        },
        crystals,
        current_streak,
        rewarded: reward > 0,
    }))
}

async fn load_active_path(
    state: &AppState,
    user_id: Uuid,
) -> Result<LearningPathResponse, (StatusCode, Json<ErrorResponse>)> {
    let path = sqlx::query_as::<_, (Uuid, String, Option<String>)>(
        r#"
        SELECT id, title, description
        FROM financial_paths
        WHERE user_id = $1 AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to fetch active path: {err}");
        internal_error()
    })?
    .ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse::new("not_found", "No active learning path found")),
        )
    })?;

    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, String, i32, Uuid, String, Option<String>, String, i32, String)>(
        r#"
        SELECT l.id, l.title, l.description, COALESCE(l.icon_name, 'Sprout') AS icon_name, l.order_index,
               t.id, t.title, t.description, t.task_type, t.reward_crystals,
               COALESCE(ut.status, 'pending') AS task_status
        FROM levels l
        JOIN tasks t ON t.level_id = l.id
        LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = $2
        WHERE l.path_id = $1
        ORDER BY l.order_index, t.order_index
        "#,
    )
    .bind(path.0)
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("Failed to fetch path levels: {err}");
        internal_error()
    })?;

    let mut levels = Vec::<LearningLevel>::new();
    for row in rows {
        if levels.last().map(|level| level.id) != Some(row.0) {
            levels.push(LearningLevel {
                id: row.0,
                title: row.1.clone(),
                description: row.2.clone(),
                icon_name: row.3.clone(),
                status: "locked".to_string(),
                order_index: row.4,
                tasks: Vec::new(),
            });
        }

        let level = levels.last_mut().expect("level inserted before task");
        level.tasks.push(LearningTask {
            id: row.5,
            title: row.6,
            description: row.7,
            r#type: row.8,
            crystals: row.9,
            status: row.10,
        });
    }

    apply_level_statuses(&mut levels);

    Ok(LearningPathResponse {
        path_id: path.0,
        title: path.1,
        description: path.2,
        levels,
    })
}

fn apply_level_statuses(levels: &mut [LearningLevel]) {
    let mut current_assigned = false;

    for level in levels {
        let completed = !level.tasks.is_empty()
            && level.tasks.iter().all(|task| task.status == "completed");

        level.status = if completed {
            "completed".to_string()
        } else if !current_assigned {
            current_assigned = true;
            "current".to_string()
        } else {
            "locked".to_string()
        };
    }
}

async fn update_streak(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
) -> Result<i32, (StatusCode, Json<ErrorResponse>)> {
    let today = Utc::now().date_naive();
    let row = sqlx::query_as::<_, (i32, i32, Option<NaiveDate>)>(
        "SELECT current_streak, longest_streak, last_activity_date FROM streaks WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to fetch streak: {err}");
        internal_error()
    })?;

    let (current, longest) = match row {
        Some((current, longest, Some(last_activity))) if last_activity == today => (current, longest),
        Some((current, longest, Some(last_activity))) if last_activity == today - chrono::Duration::days(1) => {
            let next = current + 1;
            (next, longest.max(next))
        }
        Some((_, longest, _)) => (1, longest.max(1)),
        None => (1, 1),
    };

    sqlx::query(
        r#"
        INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET current_streak = $2, longest_streak = $3, last_activity_date = $4, updated_at = CURRENT_TIMESTAMP
        "#,
    )
    .bind(user_id)
    .bind(current)
    .bind(longest)
    .bind(today)
    .execute(&mut **tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to update streak: {err}");
        internal_error()
    })?;

    Ok(current)
}

fn not_found() -> (StatusCode, Json<ErrorResponse>) {
    (
        StatusCode::NOT_FOUND,
        Json(ErrorResponse::new("not_found", "Resource was not found")),
    )
}
