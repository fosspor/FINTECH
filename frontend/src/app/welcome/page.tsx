"use client";

import { motion } from "framer-motion";
import { Mic, Keyboard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  return (
    <main className="flex-1 flex flex-col min-h-0 h-[100dvh] max-w-2xl mx-auto w-full bg-background relative overflow-hidden items-center justify-center p-6 text-center">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
        className="relative flex items-center justify-center mb-8"
      >
        <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 shadow-[0_0_50px_rgba(124,92,255,0.3)]">
          {/* Hero Character Placeholder */}
          <span className="text-6xl drop-shadow-xl">🦉</span>
        </div>
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl font-extrabold mb-4 tracking-tight leading-tight"
      >
        Разберёмся с финансами <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">за 3 минуты</span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-lg text-muted-foreground mb-12 max-w-[320px] mx-auto font-medium leading-relaxed"
      >
        Без таблиц. Без сложных терминов. Просто расскажи что происходит.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col gap-4 w-full max-w-sm z-10"
      >
        <Link href="/">
          <Button className="w-full h-14 rounded-2xl text-[17px] gap-3 shadow-lg shadow-primary/25 font-semibold">
            <Mic className="w-5 h-5" />
            Рассказать голосом
          </Button>
        </Link>
        
        <Link href="/">
          <Button variant="outline" className="w-full h-14 rounded-2xl text-[17px] gap-3 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 font-medium">
            <Keyboard className="w-5 h-5 text-muted-foreground" />
            Написать текстом
          </Button>
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-10 flex items-center gap-2 text-xs text-muted-foreground opacity-60"
      >
        <ShieldCheck className="w-4 h-4 text-success" />
        Твои данные надежно зашифрованы
      </motion.div>
    </main>
  );
}
