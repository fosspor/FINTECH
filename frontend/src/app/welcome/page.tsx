"use client";

import { motion } from "framer-motion";
import { Keyboard, MessageCircle, Mic, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FinbroMascot } from "@/components/finbro-mascot";
import { LevelMascot } from "@/components/level-mascots";

const supportMascots = [
  { mascot: "anti_impulse" as const, className: "left-4 top-8", delay: 0.15 },
  { mascot: "piggy" as const, className: "right-5 top-12", delay: 0.25 },
  { mascot: "budget_calc" as const, className: "left-10 bottom-7", delay: 0.35 },
  { mascot: "credit_light" as const, className: "right-10 bottom-5", delay: 0.45 },
];

export default function WelcomePage() {
  useEffect(() => {
    document.cookie = "finbro_seen_welcome=1; Path=/; SameSite=Lax";
  }, []);

  return (
    <main className="flex-1 min-h-0 h-[100dvh] max-w-2xl mx-auto w-full bg-background relative overflow-hidden text-center">
      <div className="absolute inset-x-0 top-0 h-[58%] bg-[radial-gradient(circle_at_50%_0%,rgba(48,213,200,0.26),transparent_64%)] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[radial-gradient(circle_at_50%_100%,rgba(124,92,255,0.22),transparent_68%)] pointer-events-none" />

      <section className="relative z-10 flex h-full flex-col px-6 pb-8 pt-7">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-3 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-primary"
        >
          <Sparkles className="h-4 w-4" />
          ФИНБРО
        </motion.div>

        <div className="relative mx-auto flex min-h-[300px] w-full max-w-md flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.45 }}
            className="absolute h-56 w-56 rounded-full bg-white/5 blur-2xl"
          />

          {supportMascots.map((item) => (
            <motion.div
              key={item.mascot}
              initial={{ opacity: 0, scale: 0.5, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: item.delay, type: "spring", stiffness: 180, damping: 16 }}
              className={`absolute ${item.className}`}
            >
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-2 backdrop-blur-md shadow-xl">
                <LevelMascot mascot={item.mascot} mood="happy" size="sm" />
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.82 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.1, type: "spring", bounce: 0.38 }}
            className="relative"
          >
            <div className="absolute inset-x-8 bottom-4 h-12 rounded-full bg-primary/25 blur-2xl" />
            <FinbroMascot mood="celebrate" size="xl" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
            <MessageCircle className="h-3.5 w-3.5" />
            Сначала просто поговорим
          </div>

          <h1 className="mb-4 text-4xl font-black leading-[0.98] tracking-tight">
            Учись деньгам
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#30D5C8] via-[#37A7FF] to-primary">
              как в игре
            </span>
          </h1>

          <p className="mx-auto mb-7 max-w-[330px] text-[17px] font-medium leading-relaxed text-muted-foreground">
            Впиши имя, и AI-наставник начнёт диалог лично с тобой: соберёт ситуацию и построит путь с уровнями, заданиями и наградами.
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/auth" className="block">
              <Button className="h-15 min-h-15 w-full rounded-2xl text-[17px] font-extrabold gap-3 shadow-lg shadow-primary/25">
                <Mic className="h-5 w-5" />
                Начать
              </Button>
            </Link>

            <Link href="/auth" className="block">
              <Button
                variant="outline"
                className="h-14 w-full rounded-2xl border-white/10 bg-white/5 text-[16px] font-bold backdrop-blur-sm hover:bg-white/10 gap-3"
              >
                <Keyboard className="h-5 w-5 text-muted-foreground" />
                Ввести имя
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-70"
        >
          <ShieldCheck className="h-4 w-4 text-success" />
          Личный путь строится только из твоих ответов
        </motion.div>
      </section>
    </main>
  );
}
