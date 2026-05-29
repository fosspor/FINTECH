use axum::{routing::{get, post}, Router};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod users;
mod voice;
mod tts;
mod ai;
mod knowledge;
mod financial_profile;
mod consultations;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "finbro_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Database connection pool setup would go here
    // let db_pool = sqlx::PgPool::connect(&std::env::var("DATABASE_URL").unwrap()).await.unwrap();

    let app = Router::new()
        // Auth routes
        .route("/auth/register", post(auth::routes::register))
        .route("/auth/login", post(auth::routes::login))
        
        // Voice & TTS routes
        .route("/voice/transcribe", post(voice::routes::transcribe))
        .route("/tts/generate", post(tts::routes::generate))
        
        // AI Chat & Diagnosis
        .route("/ai/chat", post(ai::routes::chat))
        .route("/ai/diagnose", post(ai::routes::diagnose))
        
        // Profiles & Consultations
        .route("/profile", get(financial_profile::routes::get_profile))
        .route("/consultations", get(consultations::routes::list_consultations))
        .route("/consultations", post(consultations::routes::create_consultation))
        
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    tracing::debug!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
