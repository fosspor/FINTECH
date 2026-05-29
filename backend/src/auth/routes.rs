pub mod routes {
    use axum::Json;
    use serde_json::{json, Value};

    pub async fn register() -> Json<Value> {
        Json(json!({ "message": "User registered successfully", "token": "jwt_token_here", "refresh_token": "refresh_token_here" }))
    }

    pub async fn login() -> Json<Value> {
        Json(json!({ "message": "Login successful", "token": "jwt_token_here", "refresh_token": "refresh_token_here" }))
    }
}
