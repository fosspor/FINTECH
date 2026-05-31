use axum::{routing::{delete, get, post, put}, Router};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::sync::Arc;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

mod auth;
mod users;
mod voice;
mod tts;
mod ai;
mod knowledge;
mod financial_profile;
mod consultations;
mod docs;
mod examples;
mod learning;

pub struct AppState {
    pub db: sqlx::PgPool,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "finbro_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Database connection pool setup
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/finbro".to_string());
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("Failed to connect to Postgres");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run database migrations");

    ensure_runtime_schema(&pool)
        .await
        .expect("Failed to ensure database schema");

    let shared_state = Arc::new(AppState { db: pool });

    let app = Router::new()
        // Auth routes
        .route("/auth/register", post(auth::routes::register))
        .route("/auth/login", post(auth::routes::login))
        .route("/auth/refresh", post(auth::routes::refresh))
        .route("/auth/logout", post(auth::routes::logout))
        
        // Voice & TTS routes
<<<<<<< HEAD
        .route("/api/voice/transcribe", post(voice::routes::transcribe))
=======
        .route("/api/voice/transcribe", post(voice::routes::transcribe_api))
>>>>>>> 9aca396 (Update backend and frontend with new features and improvements)
        .route("/voice/transcribe", post(voice::routes::transcribe))
        .route("/tts/generate", post(tts::routes::generate))
        
        // AI Chat & Diagnosis
        .route("/ai/chat", post(ai::routes::chat))
        .route("/ai/diagnose", post(ai::routes::diagnose))
        
        // Profiles & Consultations
        .route("/users/me", get(users::routes::me))
        .route("/profile", get(financial_profile::routes::get_profile))
        .route("/knowledge", get(knowledge::routes::list_chunks))
        .route("/consultations", get(consultations::routes::list_consultations))
        .route("/consultations", post(consultations::routes::create_consultation))
        .route("/path", get(learning::routes::get_path))
        .route("/levels/{id}", get(learning::routes::get_level))
        .route("/tasks/{id}/complete", post(learning::routes::complete_task))
        
        // Documented CRUD example routes
        .route("/examples/items", get(examples::routes::list_items))
        .route("/examples/items", post(examples::routes::create_item))
        .route("/examples/items/{id}", get(examples::routes::get_item))
        .route("/examples/items/{id}", put(examples::routes::update_item))
        .route("/examples/items/{id}", delete(examples::routes::delete_item))

        // API documentation
        .merge(
            SwaggerUi::new("/swagger-ui")
                .url("/api-docs/openapi.json", docs::ApiDoc::openapi()),
        )
        
        .with_state(shared_state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    tracing::debug!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn ensure_runtime_schema(pool: &sqlx::PgPool) -> Result<(), sqlx::Error> {
    sqlx::query("CREATE EXTENSION IF NOT EXISTS pgcrypto")
        .execute(pool)
        .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS example_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query("ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE")
        .execute(pool)
        .await?;

    sqlx::query(
        r#"
        ALTER TABLE financial_paths
            ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query("ALTER TABLE levels ADD COLUMN IF NOT EXISTS icon_name VARCHAR(100) DEFAULT 'Sprout'")
        .execute(pool)
        .await?;

    Ok(())
}
