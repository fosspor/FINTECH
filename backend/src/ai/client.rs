use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::env;

#[derive(Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<Message>,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: MessageResponse,
}

#[derive(Deserialize)]
struct MessageResponse {
    content: String,
}

pub async fn call_qwen(prompt: &str, system_prompt: Option<&str>) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let api_key = env::var("QWEN_API_KEY").unwrap_or_default();
    
    // In MVP, if no key, we might just return mock to allow testing the UI
    if api_key.is_empty() || api_key == "your_qwen_api_key_here" {
        return Ok("Это тестовый ответ от AI, так как API ключ не настроен. Давай разберемся с твоим бюджетом!".to_string());
    }

    let url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
    
    let mut messages = vec![];
    if let Some(sys) = system_prompt {
        messages.push(Message {
            role: "system".to_string(),
            content: sys.to_string(),
        });
    }
    messages.push(Message {
        role: "user".to_string(),
        content: prompt.to_string(),
    });

    let request = ChatRequest {
        model: "qwen-turbo".to_string(),
        messages,
    };

    let client = Client::new();
    let response = client
        .post(url)
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&request)
        .send()
        .await?;

    if response.status().is_success() {
        let chat_response: ChatResponse = response.json().await?;
        if let Some(choice) = chat_response.choices.first() {
            return Ok(choice.message.content.clone());
        }
    } else {
        tracing::error!("Qwen API error: {:?}", response.text().await?);
    }
    
    Ok("Извините, сейчас я не могу ответить. Пожалуйста, попробуйте позже.".to_string())
}
