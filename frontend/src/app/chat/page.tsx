"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Map, Mic, Send, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FinbroMascot } from "@/components/finbro-mascot";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { apiUrl, authFetch, ensureAuth, readAuth } from "@/lib/api";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  isAudio?: boolean;
};

type DiagnosisPayload = {
  main_problem?: string;
  main_risk?: string;
  first_recommendation?: string;
};

type ProfilePayload = {
  monthly_income?: number | null;
  mandatory_expenses?: number | null;
  free_money?: number | null;
  has_credit?: boolean;
  debts?: unknown;
  savings_months?: number | null;
  main_goal?: string | null;
  spending_leaks?: unknown;
  risk_zone?: string | null;
  missing_fields?: unknown;
};

const JSON_API_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};
const NGROK_API_HEADERS = {
  "ngrok-skip-browser-warning": "true",
};
const CHAT_HISTORY_STORAGE_KEY = "finbro_chat_messages";
const AI_FALLBACK_MESSAGE = "Я готов собрать профиль. Напиши доход, обязательные расходы, долги и главную цель.";
const VOICE_LOADING_MESSAGE = "Распознаю голос...";
const VOICE_RECOGNITION_ERROR_MESSAGE = "Не получилось распознать, попробуй ещё раз.";
const INITIAL_CHAT_PROMPT =
  "Начни диалог с пользователем: коротко представься как ФИНБРО, обратись к пользователю по имени и задай первый вопрос для финансового профиля.";
const LEGACY_PLACEHOLDER_PATTERNS = [
  "Привет! Я ФИНБРО",
  "Я подключен как ФИНБРО",
  "Ð¯ Ð¿Ð¾Ð´ÐºÐ»Ñ",
  "РЇ РїРѕРґРєР»",
];

function isMessageArray(value: unknown): value is Message[] {
  return (
    Array.isArray(value) &&
    value.every(
      (message) =>
        typeof message === "object" &&
        message !== null &&
        typeof (message as Message).id === "string" &&
        ((message as Message).role === "assistant" || (message as Message).role === "user") &&
        typeof (message as Message).content === "string"
    )
  );
}

function sanitizeSavedMessages(messages: Message[]) {
  return messages.map((message) => {
    const isLegacyPlaceholder =
      message.role === "assistant" &&
      LEGACY_PLACEHOLDER_PATTERNS.some((pattern) => message.content.includes(pattern));

    return isLegacyPlaceholder ? { ...message, content: AI_FALLBACK_MESSAGE } : message;
  });
}

function normalizeDiagnosis(value: DiagnosisPayload | null | undefined) {
  return {
    main_problem: value?.main_problem || "Нужно уточнить главную финансовую проблему",
    main_risk: value?.main_risk || "Без плана расходы могут снова стать непрозрачными",
    first_recommendation: value?.first_recommendation || "Начни с короткой карты доходов, расходов и долгов",
  };
}

function normalizeProfile(value: ProfilePayload | null | undefined) {
  const riskZone = value?.risk_zone === "green" || value?.risk_zone === "red" ? value.risk_zone : "yellow";

  return {
    monthly_income: typeof value?.monthly_income === "number" ? value.monthly_income : null,
    mandatory_expenses: typeof value?.mandatory_expenses === "number" ? value.mandatory_expenses : null,
    free_money: typeof value?.free_money === "number" ? value.free_money : null,
    has_credit: Boolean(value?.has_credit),
    debts: Array.isArray(value?.debts) ? value.debts : [],
    savings_months: typeof value?.savings_months === "number" ? value.savings_months : null,
    main_goal: typeof value?.main_goal === "string" ? value.main_goal : null,
    spending_leaks: Array.isArray(value?.spending_leaks) ? value.spending_leaks : [],
    risk_zone: riskZone,
    missing_fields: Array.isArray(value?.missing_fields) ? value.missing_fields : [],
  };
}

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBuildingPath, setIsBuildingPath] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialRequestStartedRef = useRef(false);
  const { isRecording, startRecording, stopRecording, audioBlob, setAudioBlob } = useAudioRecorder();

  const userMessageCount = messages.filter((message) => message.role === "user").length;
  const canBuildPath = userMessageCount >= 2 && !isTyping && !isBuildingPath;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (isMessageArray(parsedMessages)) {
          setMessages(sanitizeSavedMessages(parsedMessages));
        }
      }
    } catch (error) {
      console.error("Failed to restore ФИНБРО chat history", error);
    } finally {
      setHasLoadedMessages(true);
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CHAT_HISTORY_STORAGE_KEY || !event.newValue) return;

      try {
        const parsedMessages = JSON.parse(event.newValue);
        if (isMessageArray(parsedMessages)) {
          setMessages(sanitizeSavedMessages(parsedMessages));
        }
      } catch (error) {
        console.error("Failed to sync ФИНБРО chat history", error);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!hasLoadedMessages) return;
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
  }, [hasLoadedMessages, messages]);

  useEffect(() => {
    if (!hasLoadedMessages || messages.length > 0 || initialRequestStartedRef.current) return;
    initialRequestStartedRef.current = true;
    ensureAuth().catch((error) => console.error("Failed to prepare auth", error));
    requestInitialMessage();
  }, [hasLoadedMessages, messages.length]);

  useEffect(() => {
    if (audioBlob) {
      handleAudioSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  const getHistory = (history: Message[]) =>
    history
      .map((message) => `${message.role === "assistant" ? "ФИНБРО" : "Пользователь"}: ${message.content}`)
      .join("\n");

  const requestInitialMessage = async () => {
    setIsTyping(true);

    try {
      const userName = readAuth()?.name?.trim() || "друг";
      const response = await authFetch(apiUrl("/ai/chat"), {
        method: "POST",
        headers: JSON_API_HEADERS,
        body: JSON.stringify({
          message: `${INITIAL_CHAT_PROMPT}\nИмя пользователя: ${userName}.`,
          context: "",
        }),
      });
      const data = await response.json();
      const assistantText = data.response ?? AI_FALLBACK_MESSAGE;

      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantText,
        },
      ]);
    } catch (error) {
      console.error("Failed to get initial ФИНБРО message", error);
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: AI_FALLBACK_MESSAGE,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const askФИНБРО = async (nextMessages: Message[]) => {
    const userMessage = nextMessages[nextMessages.length - 1];
    setIsTyping(true);

    try {
      const response = await authFetch(apiUrl("/ai/chat"), {
        method: "POST",
        headers: JSON_API_HEADERS,
        body: JSON.stringify({
          message: userMessage.content,
          context: getHistory(nextMessages.slice(0, -1)),
        }),
      });
      const data = await response.json();
      const assistantText = data.response ?? "Записал. Добавь ещё доход, расходы, долги или финансовую цель.";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantText,
        },
      ]);
    } catch (error) {
      console.error("Failed to chat with ФИНБРО", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Записал. Добавь ещё доход, расходы, долги или финансовую цель.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping || isBuildingPath) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };
    const nextMessages = [...messages, newMessage];

    setMessages(nextMessages);
    setInput("");
    await askФИНБРО(nextMessages);
  };

  const handleAudioSubmit = async () => {
    const tempMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: VOICE_LOADING_MESSAGE,
      isAudio: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setAudioBlob(null);
    setIsTyping(true);

    try {
      const formData = new FormData();
      if (audioBlob) {
        formData.append("audio", audioBlob, audioBlob.type === "audio/lpcm" ? "voice.raw" : "voice.ogg");
      }

      const transcriptionResponse = await authFetch(apiUrl("/api/voice/transcribe"), {
        method: "POST",
        headers: NGROK_API_HEADERS,
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        throw new Error(`Voice transcription failed: ${transcriptionResponse.status}`);
      }

      const transcription = await transcriptionResponse.json();
      const transcribedText = transcription.text?.trim();

      if (!transcribedText) {
        const errorMessage = transcription.error || VOICE_RECOGNITION_ERROR_MESSAGE;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === tempMessage.id ? { ...message, content: errorMessage, isAudio: false } : message
          )
        );
        setIsTyping(false);
        return;
      }

      const nextMessages = [...messages, { ...tempMessage, content: transcribedText, isAudio: false }];

      setMessages(nextMessages);
      setIsTyping(false);

      await askФИНБРО(nextMessages);
    } catch (error) {
      console.error("Failed to transcribe audio", error);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === tempMessage.id
            ? { ...message, content: VOICE_RECOGNITION_ERROR_MESSAGE, isAudio: false }
            : message
        )
      );
      setIsTyping(false);
    }
  };

  const buildPath = async () => {
    if (!canBuildPath) return;
    setIsBuildingPath(true);

    const buildingMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Собираю твой финансовый путь: диагноз, уровни, задания и награды...",
    };

    const finalMessages = [...messages, buildingMessage];
    setMessages(finalMessages);

    try {
      const response = await authFetch(apiUrl("/ai/diagnose"), {
        method: "POST",
        headers: JSON_API_HEADERS,
        body: JSON.stringify({ chat_history: getHistory(messages) }),
      });

      if (!response.ok) {
        throw new Error(`Diagnose failed: ${response.status}`);
      }

      const data = await response.json();

      localStorage.setItem("finbro_diagnosis", JSON.stringify(normalizeDiagnosis(data.diagnosis)));
      localStorage.setItem("finbro_profile", JSON.stringify(normalizeProfile(data.profile)));
      if (data.path?.length) {
        localStorage.setItem("finbro_path", JSON.stringify(data.path));
      }

      router.push("/diagnosis");
    } catch (error) {
      console.error("Failed to build path", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Не смог построить путь. Проверь backend и API-ключ, потом попробуй ещё раз.",
        },
      ]);
      setIsBuildingPath(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 max-w-2xl mx-auto w-full border-x border-border/10 bg-background relative overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 min-h-0 z-10 w-full">
        <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md shrink-0 z-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
              <FinbroMascot mood={isTyping ? "thinking" : "idle"} size="sm" showShadow={false} />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-lg leading-tight">ФИНБРО</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Живой разговор
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={!canBuildPath}
            onClick={buildPath}
            className="rounded-full gap-1.5 px-3"
          >
            {isBuildingPath ? <Loader2 className="h-4 w-4 animate-spin" /> : <Map className="h-4 w-4" />}
            Путь
          </Button>
        </header>

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-6 p-6">
            {messages.map((msg, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                key={msg.id}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "assistant" && (
                  <Avatar className="w-10 h-10 border border-primary/20 shrink-0 mt-auto mb-1 bg-primary/10 items-center justify-center">
                    <FinbroMascot mood={index === messages.length - 1 ? "happy" : "idle"} size="sm" showShadow={false} />
                  </Avatar>
                )}

                <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`p-4 rounded-3xl ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm shadow-md"
                        : "bg-white/5 border border-white/10 text-foreground rounded-bl-sm backdrop-blur-md"
                    }`}
                  >
                    <p className="text-[17px] leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                  </div>

                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                <Avatar className="w-10 h-10 border border-primary/20 shrink-0 mt-auto mb-1 bg-primary/10 items-center justify-center">
                  <FinbroMascot mood="thinking" size="sm" showShadow={false} />
                </Avatar>
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-foreground rounded-bl-sm flex items-center justify-center h-[56px] w-[72px]">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t border-border/10 shrink-0">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend(input);
            }}
            className={`flex items-center gap-2 relative rounded-[1.5rem] p-1.5 border shadow-inner transition-colors ${
              isRecording ? "bg-destructive/10 border-destructive/30" : "bg-white/5 border-white/10 backdrop-blur-md"
            }`}
          >
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={toggleRecording}
              disabled={isTyping || isBuildingPath}
              className={`rounded-full shrink-0 w-12 h-12 ${
                isRecording
                  ? "text-destructive hover:text-destructive hover:bg-destructive/20 animate-pulse"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isRecording ? <Square className="w-6 h-6" fill="currentColor" /> : <Mic className="w-6 h-6" />}
            </Button>

            <Input
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={isRecording ? "Слушаю..." : "Напиши ФИНБРО..."}
              disabled={isRecording || isTyping || isBuildingPath}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-2 text-[17px] h-12 disabled:opacity-50"
              autoComplete="off"
            />

            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isRecording || isTyping || isBuildingPath}
              className="rounded-full shrink-0 h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </Button>
          </form>

          {userMessageCount < 2 && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              После пары сообщений появится кнопка построения персонального пути.
            </p>
          )}
        </div>
      </motion.div>
    </main>
  );
}
