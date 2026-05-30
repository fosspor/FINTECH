use reqwest::Client;
use serde::{Deserialize, Serialize};
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
    temperature: f32,
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

pub async fn call_ai(
    prompt: &str,
    system_prompt: Option<&str>,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    if let Ok(api_key) = env::var("OPENAI_API_KEY") {
        if !api_key.trim().is_empty() && api_key != "your_openai_api_key_here" {
            return call_openai(prompt, system_prompt, &api_key).await;
        }
    }

    call_qwen(prompt, system_prompt).await
}

async fn call_openai(
    prompt: &str,
    system_prompt: Option<&str>,
    api_key: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let model = env::var("OPENAI_MODEL").unwrap_or_else(|_| "gpt-4o-mini".to_string());
    let mut messages = Vec::new();

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
        model,
        messages,
        temperature: 0.7,
    };

    let client = Client::new();
    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&request)
        .send()
        .await?;

    if response.status().is_success() {
        let chat_response: ChatResponse = response.json().await?;
        if let Some(choice) = chat_response.choices.first() {
            return Ok(choice.message.content.clone());
        }
    } else {
        tracing::error!("OpenAI API error: {}", response.text().await?);
    }

    Ok("Сейчас не получилось получить ответ от AI. Попробуй ещё раз через минуту.".to_string())
}

async fn call_qwen(
    prompt: &str,
    system_prompt: Option<&str>,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let api_key = env::var("QWEN_API_KEY").unwrap_or_default();

    if api_key.trim().is_empty() || api_key == "your_qwen_api_key_here" {
        return Ok(mock_finbro_response(prompt));
    }

    let mut messages = Vec::new();
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
        temperature: 0.7,
    };

    let client = Client::new();
    let response = client
        .post("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&request)
        .send()
        .await?;

    if response.status().is_success() {
        let chat_response: ChatResponse = response.json().await?;
        if let Some(choice) = chat_response.choices.first() {
            return Ok(choice.message.content.clone());
        }
    } else {
        tracing::error!("Qwen API error: {}", response.text().await?);
    }

    Ok("Сейчас я не могу ответить. Попробуй ещё раз чуть позже.".to_string())
}

fn mock_finbro_response(prompt: &str) -> String {
    if prompt.contains("СТРОГО в формате JSON") || prompt.contains("сформируй профиль и путь") {
        return r#"{
  "diagnosis": {
    "main_problem": "Пока не хватает данных для точного диагноза",
    "main_risk": "Финансовые решения принимаются без понятного плана",
    "first_recommendation": "Опиши доход, обязательные траты, долги и главную цель"
  },
  "path": []
}"#
        .to_string();
    }

    "Я подключен как FinBro внутри проекта. Расскажи простыми словами: сколько примерно доход, какие обязательные траты, есть ли долги и какая главная цель? После этого я соберу персональные уровни.".to_string()
}
