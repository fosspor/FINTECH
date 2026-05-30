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

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  isAudio?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STARTER_REPLIES = [
  "Доход 100 000, деньги быстро уходят",
  "Есть кредитка и хочу закрыть долг",
  "Хочу накопить подушку",
  "Хочу начать инвестировать",
];

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-chat",
      role: "assistant",
      content:
        "Привет! Я FinClip, твой финансовый наставник внутри приложения. Давай заполним твой профиль через разговор: доход, обязательные траты, долги, подушка и цель. Потом я соберу уровни под твои реальные проблемы.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBuildingPath, setIsBuildingPath] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isRecording, startRecording, stopRecording, audioBlob, setAudioBlob } = useAudioRecorder();

  const userMessageCount = messages.filter((message) => message.role === "user").length;
  const canBuildPath = userMessageCount >= 2 && !isTyping && !isBuildingPath;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (audioBlob) {
      handleAudioSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  const getHistory = (history: Message[]) =>
    history
      .map((message) => `${message.role === "assistant" ? "FinBro" : "Пользователь"}: ${message.content}`)
      .join("\n");

  const askFinbro = async (nextMessages: Message[]) => {
    const userMessage = nextMessages[nextMessages.length - 1];
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          context: getHistory(nextMessages.slice(0, -1)),
        }),
      });
      const data = await response.json();
      const assistantText =
        data.response ??
        "Я рядом, но сейчас не смог получить ответ от AI. Попробуй написать ещё раз.";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantText,
        },
      ]);
    } catch (error) {
      console.error("Failed to chat with FinBro", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Не смог достучаться до backend. Проверь, что Rust API запущен на localhost:8000.",
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
    await askFinbro(nextMessages);
  };

  const handleAudioSubmit = async () => {
    const tempMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: "🎤 Распознаю голос...",
      isAudio: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setAudioBlob(null);
    setIsTyping(true);

    try {
      const formData = new FormData();
      if (audioBlob) {
        formData.append("audio", audioBlob, "voice.webm");
      }

      const transcriptionResponse = await fetch(`${API_URL}/voice/transcribe`, {
        method: "POST",
        body: formData,
      });
      const transcription = await transcriptionResponse.json();
      const transcribedText = transcription.text || "Расскажи, что происходит с моими финансами";

      const nextMessages = [
        ...messages,
        { ...tempMessage, content: transcribedText, isAudio: false },
      ];

      setMessages(nextMessages);
      setIsTyping(false);
      await askFinbro(nextMessages);
    } catch (error) {
      console.error("Failed to transcribe audio", error);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === tempMessage.id
            ? { ...message, content: "Не получилось распознать голос. Напиши текстом?", isAudio: false }
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
      const response = await fetch(`${API_URL}/ai/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_history: getHistory(messages) }),
      });
      const data = await response.json();

      localStorage.setItem("finbro_diagnosis", JSON.stringify(data.diagnosis));
      if (data.profile) {
        localStorage.setItem("finbro_profile", JSON.stringify(data.profile));
      }
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
              <h2 className="font-semibold text-lg leading-tight">FinClip</h2>
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

                  {index === 0 && msg.role === "assistant" && userMessageCount === 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {STARTER_REPLIES.map((reply) => (
                        <Button
                          key={reply}
                          type="button"
                          variant="secondary"
                          onClick={() => handleSend(reply)}
                          className="rounded-full bg-secondary/15 hover:bg-secondary/25 border border-secondary/30 h-auto py-2.5 px-4 text-[15px] font-medium whitespace-normal"
                        >
                          {reply}
                        </Button>
                      ))}
                    </div>
                  )}
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
              placeholder={isRecording ? "Слушаю..." : "Напиши FinClip..."}
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
