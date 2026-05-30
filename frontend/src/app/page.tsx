"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  isAudio?: boolean;
  quickReplies?: string[];
};

const ONBOARDING_FLOW = [
  {
    text: "Привет! Я FinBro — твой личный финансовый наставник. Давай соберем твой финансовый профиль. Сколько примерно ты зарабатываешь в месяц?",
    replies: ["Менее 50 000 ₽", "50 000 – 100 000 ₽", "100 000 – 200 000 ₽", "Более 200 000 ₽"]
  },
  {
    text: "Понял. А сколько примерно уходит на обязательные траты (жильё, еда, транспорт)?",
    replies: ["Меньше половины", "Около половины", "Почти всё"]
  },
  {
    text: "Есть ли у тебя кредиты или долги?",
    replies: ["Нет долгов", "Только ипотека", "Потребительские кредиты", "Кредитные карты"]
  },
  {
    text: "Отлично. А как насчет сбережений 'на черный день'?",
    replies: ["Вообще нет", "Хватит на месяц", "Хватит на 3-6 месяцев", "Больше 6 месяцев"]
  },
  {
    text: "Последний вопрос: какая у тебя сейчас главная финансовая цель?",
    replies: ["Накопить подушку безопасности", "Быстрее закрыть долги", "Начать инвестировать", "Коплю на крупную покупку"]
  }
];

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-chat",
      role: "assistant",
      content: ONBOARDING_FLOW[0].text,
      quickReplies: ONBOARDING_FLOW[0].replies
    },
  ]);
  const [input, setInput] = useState("");
  const { isRecording, startRecording, stopRecording, audioBlob, setAudioBlob } = useAudioRecorder();

  useEffect(() => {
    // Scroll to bottom on new message or typing indicator
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (audioBlob) {
      handleAudioSubmit(audioBlob);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  const finishOnboarding = async (finalMessages: Message[]) => {
    try {
      const historyStr = finalMessages.map(m => `${m.role}: ${m.content}`).join("\n");
      const res = await fetch("http://localhost:8000/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_history: historyStr }),
      });
      const data = await res.json();
      localStorage.setItem("finbro_diagnosis", JSON.stringify(data.diagnosis));
      if (data.path) {
        localStorage.setItem("finbro_path", JSON.stringify(data.path));
      }
    } catch (e) {
      console.error("Failed to generate diagnosis", e);
    }
    router.push("/diagnosis");
  };

  const proceedOnboarding = (_userText: string) => {
    const nextStep = step + 1;
    setStep(nextStep);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      if (nextStep < ONBOARDING_FLOW.length) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: ONBOARDING_FLOW[nextStep].text,
          quickReplies: ONBOARDING_FLOW[nextStep].replies
        }]);
      } else {
        setMessages(prev => {
          const updated: Message[] = [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: "Круто! Я всё записал. Сейчас проанализирую твою ситуацию и выдам персональный диагноз..."
          }];
          finishOnboarding(updated);
          return updated;
        });
      }
    }, 1200);
  };

  const handleAudioSubmit = async (_blob: Blob) => {
    // For MVP frontend we simulate transcription to keep the flow moving fast
    const tempId = Date.now().toString();
    const newMsg: Message = { id: tempId, role: "user", content: "🎤 Распознаю аудио...", isAudio: true };
    
    setMessages((prev) => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
        updated[updated.length - 1].quickReplies = undefined;
      }
      return [...updated, newMsg];
    });
    
    setAudioBlob(null);
    setIsTyping(true);

    // Simulate whisper API delay
    setTimeout(() => {
      const simulatedTranscription = ONBOARDING_FLOW[step]?.replies[0] || "Вот мой ответ";
      setMessages((prev) => 
        prev.map(m => m.id === tempId ? { ...m, content: simulatedTranscription, isAudio: false } : m)
      );
      
      proceedOnboarding(simulatedTranscription);
    }, 1500);
  };

  const handleSend = (text: string = input) => {
    if (!text.trim()) return;
    
    const newMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    
    setMessages((prev) => {
      const updated = [...prev];
      // Hide quick replies of the previous message
      if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
        updated[updated.length - 1].quickReplies = undefined;
      }
      return [...updated, newMsg];
    });
    
    setInput("");
    proceedOnboarding(text);
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
      <AnimatePresence mode="wait">
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col flex-1 min-h-0 z-10 w-full"
        >
          <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md shrink-0 z-20 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
              <span className="text-xl leading-none">🦉</span>
            </div>
            <div>
              <h2 className="font-semibold text-lg">FinBro</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Анализ профиля
              </p>
            </div>
          </header>

          <ScrollArea className="flex-1 min-h-0">
            <div className="flex flex-col gap-6 p-6">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="w-10 h-10 border border-primary/20 shrink-0 mt-auto mb-1 bg-primary/10 items-center justify-center">
                      <span className="text-lg leading-none">🦉</span>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`p-4 rounded-3xl ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-br-sm shadow-md" 
                        : "bg-white/5 border border-white/10 text-foreground rounded-bl-sm backdrop-blur-md"
                    }`}>
                      <p className="text-[17px] leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                    </div>
                    
                    {/* Quick Replies */}
                    {msg.quickReplies && msg.role === "assistant" && i === messages.length - 1 && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.4 }}
                        className="flex gap-2 mt-3 flex-wrap"
                      >
                        {msg.quickReplies.map((reply, idx) => (
                          <motion.div
                            key={reply}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (idx * 0.1) }}
                          >
                            <Button 
                              variant="secondary" 
                              onClick={() => handleSend(reply)}
                              className="rounded-full bg-secondary/15 hover:bg-secondary/25 text-secondary-foreground border border-secondary/30 h-auto py-2.5 px-4 text-[15px] font-medium whitespace-normal text-left h-auto min-h-[40px]"
                            >
                              {reply}
                            </Button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <Avatar className="w-10 h-10 border border-primary/20 shrink-0 mt-auto mb-1 bg-primary/10 items-center justify-center">
                    <span className="text-lg leading-none">🦉</span>
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
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
              className={`flex items-center gap-2 relative rounded-[1.5rem] p-1.5 border shadow-inner transition-colors ${
                isRecording ? "bg-destructive/10 border-destructive/30" : "bg-white/5 border-white/10 backdrop-blur-md"
              }`}
            >
              <Button 
                type="button" 
                size="icon" 
                variant="ghost" 
                onClick={toggleRecording}
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
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Слушаю..." : "Ответить текстом..."} 
                disabled={isRecording}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-2 text-[17px] h-12 disabled:opacity-50"
                autoComplete="off"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isRecording || isTyping}
                className="rounded-full shrink-0 h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </Button>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
