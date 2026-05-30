use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;

const API_WAITING_MESSAGE: &str = "ожидается api";

#[derive(Serialize)]
struct OpenAiMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct OpenAiChatRequest {
    model: String,
    messages: Vec<OpenAiMessage>,
    temperature: f32,
}

#[derive(Deserialize)]
struct OpenAiChatResponse {
    choices: Vec<OpenAiChoice>,
}

#[derive(Deserialize)]
struct OpenAiChoice {
    message: OpenAiMessageResponse,
}

#[derive(Deserialize)]
struct OpenAiMessageResponse {
    content: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct YandexCompletionRequest {
    model_uri: String,
    completion_options: YandexCompletionOptions,
    messages: Vec<YandexMessage>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct YandexCompletionOptions {
    stream: bool,
    temperature: f32,
    max_tokens: String,
}

#[derive(Serialize, Deserialize)]
struct YandexMessage {
    role: String,
    text: String,
}

#[derive(Deserialize)]
struct YandexCompletionResponse {
    result: Option<YandexCompletionResult>,
}

#[derive(Deserialize)]
struct YandexCompletionResult {
    alternatives: Vec<YandexAlternative>,
}

#[derive(Deserialize)]
struct YandexAlternative {
    message: YandexMessage,
}

pub async fn call_ai(
    prompt: &str,
    system_prompt: Option<&str>,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let yandex_api_key = env::var("YANDEX_API_KEY").unwrap_or_default();
    let yandex_folder_id = env::var("YANDEX_FOLDER_ID").unwrap_or_default();

    if !yandex_api_key.trim().is_empty() && !yandex_folder_id.trim().is_empty() {
        return call_yandexgpt(prompt, system_prompt, &yandex_api_key, &yandex_folder_id).await;
    }

    if let Ok(api_key) = env::var("OPENAI_API_KEY") {
        if !api_key.trim().is_empty() && api_key != "your_openai_api_key_here" {
            return call_openai(prompt, system_prompt, &api_key).await;
        }
    }

    Ok(API_WAITING_MESSAGE.to_string())
}

async fn call_openai(
    prompt: &str,
    system_prompt: Option<&str>,
    api_key: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let model = env::var("OPENAI_MODEL").unwrap_or_else(|_| "gpt-4o-mini".to_string());
    let mut messages = Vec::new();

    if let Some(sys) = system_prompt {
        messages.push(OpenAiMessage {
            role: "system".to_string(),
            content: sys.to_string(),
        });
    }

    messages.push(OpenAiMessage {
        role: "user".to_string(),
        content: prompt.to_string(),
    });

    let request = OpenAiChatRequest {
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
        let chat_response: OpenAiChatResponse = response.json().await?;
        if let Some(choice) = chat_response.choices.first() {
            return Ok(choice.message.content.clone());
        }
    } else {
        tracing::error!("OpenAI API error: {}", response.text().await?);
    }

    Ok(API_WAITING_MESSAGE.to_string())
}

async fn call_yandexgpt(
    prompt: &str,
    system_prompt: Option<&str>,
    api_key: &str,
    folder_id: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let mut messages = Vec::new();

    if let Some(sys) = system_prompt {
        messages.push(YandexMessage {
            role: "system".to_string(),
            text: sys.to_string(),
        });
    }

    messages.push(YandexMessage {
        role: "user".to_string(),
        text: prompt.to_string(),
    });

    let model_uri = env::var("YANDEXGPT_MODEL_URI").unwrap_or_else(|_| {
        let model = env::var("YANDEXGPT_MODEL").unwrap_or_else(|_| "yandexgpt/latest".to_string());
        format!("gpt://{}/{}", folder_id, model)
    });

    let request = YandexCompletionRequest {
        model_uri,
        completion_options: YandexCompletionOptions {
            stream: false,
            temperature: 0.7,
            max_tokens: "2000".to_string(),
        },
        messages,
    };

    let client = Client::new();
    let response = client
        .post("https://llm.api.cloud.yandex.net/foundationModels/v1/completion")
        .header("Authorization", format!("Api-Key {}", api_key))
        .json(&request)
        .send()
        .await?;

    if response.status().is_success() {
        let completion_response: YandexCompletionResponse = response.json().await?;
        if let Some(result) = completion_response.result {
            if let Some(alternative) = result.alternatives.first() {
                return Ok(alternative.message.text.clone());
            }
        }
    } else {
        tracing::error!("YandexGPT API error: {}", response.text().await?);
    }

    Ok(API_WAITING_MESSAGE.to_string())
}
