"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, MessageSquare, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  isAudio?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [started, setStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Привет. Я помогу разобраться с твоими финансами и принимать более уверенные финансовые решения. Расскажи, что сейчас происходит.",
    },
  ]);
  const [input, setInput] = useState("");
  const { isRecording, startRecording, stopRecording, audioBlob, setAudioBlob } = useAudioRecorder();

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (audioBlob) {
      handleAudioSubmit(audioBlob);
    }
  }, [audioBlob]);

  const handleAudioSubmit = async (blob: Blob) => {
    // Show audio is processing
    const tempId = Date.now().toString();
    const newMsg: Message = { id: tempId, role: "user", content: "🎤 Голосовое сообщение (распознавание)...", isAudio: true };
    setMessages((prev) => [...prev, newMsg]);
    setAudioBlob(null);
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append("audio", blob, "audio.webm");

      // 1. Transcribe
      const transcribeRes = await fetch(`${API_URL}/voice/transcribe`, {
        method: "POST",
        body: formData,
      });
      const transcribeData = await transcribeRes.json();
      const transcribedText = transcribeData.text || "Ошибка распознавания";

      // 2. Update message with text
      setMessages((prev) => 
        prev.map(m => m.id === tempId ? { ...m, content: transcribedText, isAudio: false } : m)
      );

      // 3. Send text to AI
      await fetchAiResponse(transcribedText);
    } catch (e) {
      console.error(e);
      setMessages((prev) => 
        prev.map(m => m.id === tempId ? { ...m, content: "❌ Ошибка обработки аудио", isAudio: false } : m)
      );
      setIsTyping(false);
    }
  };

  const fetchAiResponse = async (text: string) => {
    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.response || "Произошла ошибка при обращении к AI.",
        },
      ]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Произошла ошибка соединения с сервером." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    const newMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);
    
    await fetchAiResponse(text);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <main className="flex-1 flex flex-col h-[100dvh] max-w-2xl mx-auto w-full border-x border-border/10 bg-background relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full p-6 text-center z-10"
          >
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-8 border border-primary/30 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4 tracking-tight">FinBro</h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-[280px] font-medium">
              Твой персональный AI-наставник финансовых решений
            </p>
            
            <Button 
              size="lg" 
              className="w-full max-w-sm rounded-full text-lg h-14"
              onClick={() => setStarted(true)}
            >
              Начать общение
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full z-10 w-full"
          >
            <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">FinBro</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Всегда на связи
                </p>
              </div>
            </header>

            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="flex flex-col gap-6 pb-4">
                {messages.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i === messages.length - 1 ? 0 : 0.1 }}
                    key={msg.id}
                    className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {msg.role === "assistant" && (
                      <Avatar className="w-10 h-10 border border-primary/20 shrink-0 mt-auto mb-1">
                        <AvatarFallback className="bg-primary/10 text-primary"><MessageSquare className="w-5 h-5"/></AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`p-4 rounded-3xl ${
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground rounded-br-sm" 
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}>
                        <p className="text-[16px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      
                      {msg.role === "assistant" && i === 0 && messages.length === 1 && (
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                          className="flex gap-2 mt-2 flex-wrap"
                        >
                          <Button variant="outline" size="sm" className="rounded-full shadow-sm" onClick={toggleRecording}>
                            <Mic className={`w-4 h-4 mr-2 ${isRecording ? "text-destructive animate-pulse" : "text-primary"}`} /> 
                            {isRecording ? "Остановить запись" : "Рассказать голосом"}
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-full shadow-sm" onClick={() => document.getElementById('chat-input')?.focus()}>
                            ⌨️ Написать текстом
                          </Button>
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
                    <Avatar className="w-10 h-10 border border-primary/20 shrink-0 mt-auto mb-1">
                      <AvatarFallback className="bg-primary/10 text-primary"><MessageSquare className="w-5 h-5"/></AvatarFallback>
                    </Avatar>
                    <div className="p-4 rounded-3xl bg-muted text-foreground rounded-bl-sm flex items-center justify-center h-[56px] w-[72px]">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 bg-background border-t border-border/10">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className={`flex items-center gap-2 relative rounded-full p-1 border shadow-inner transition-colors ${
                  isRecording ? "bg-destructive/10 border-destructive/30" : "bg-muted border-border/10"
                }`}
              >
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost" 
                  onClick={toggleRecording}
                  className={`rounded-full shrink-0 ${
                    isRecording 
                      ? "text-destructive hover:text-destructive hover:bg-destructive/20 animate-pulse" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isRecording ? <Square className="w-5 h-5" fill="currentColor" /> : <Mic className="w-5 h-5" />}
                </Button>
                <Input 
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isRecording ? "Слушаю..." : "Написать сообщение..."} 
                  disabled={isRecording}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-2 text-[16px] h-12 disabled:opacity-50"
                  autoComplete="off"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!input.trim() || isRecording || isTyping}
                  className="rounded-full shrink-0 h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
