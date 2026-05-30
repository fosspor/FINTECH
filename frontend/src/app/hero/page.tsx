"use client";

import { motion } from "framer-motion";
import type { ElementType } from "react";
import { ArrowLeft, Award, Brain, Frown, Gem, Medal, RotateCcw, Sparkles, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FinbroMascot } from "@/components/finbro-mascot";
import { Mood, useAvatarStore } from "@/state/useAvatarStore";
import { cn } from "@/lib/utils";

const moodOptions: Array<{ mood: Mood; label: string; icon: ElementType }> = [
  { mood: "idle", label: "Спокойный", icon: Star },
  { mood: "thinking", label: "Думает", icon: Brain },
  { mood: "happy", label: "Радость", icon: Sparkles },
  { mood: "celebrate", label: "Победа", icon: Trophy },
  { mood: "sad", label: "Ошибка", icon: Frown },
];

const rewards = [
  { title: "Финансовый старт", value: "1 уровень", icon: Medal },
  { title: "Кристаллы", value: "450", icon: Gem },
  { title: "Дней подряд", value: "12", icon: Award },
];

export default function HeroPage() {
  const { mood, setMood, level, xp } = useAvatarStore();

  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background text-foreground overflow-y-auto relative">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(48,213,200,0.24),transparent_62%)] pointer-events-none" />

      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/path">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-lg tracking-tight">Мой герой</h1>
            <p className="text-xs text-muted-foreground">FinBro растет вместе с твоими привычками</p>
          </div>
        </div>
      </header>

      <section className="relative z-10 flex flex-col items-center px-6 pt-8 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className="relative flex min-h-[320px] w-full items-center justify-center"
        >
          <div className="absolute bottom-8 h-36 w-36 rounded-full bg-primary/20 blur-3xl" />
          <FinbroMascot mood={mood} size="xl" />
        </motion.div>

        <div className="w-full max-w-md">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">FinBro</h2>
              <p className="text-muted-foreground">Твой игровой финансовый наставник</p>
            </div>
            <div className="rounded-2xl border border-primary/25 bg-primary/15 px-4 py-2 text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary/80">Level</div>
              <div className="text-2xl font-black text-primary">{level}</div>
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex justify-between text-sm font-semibold">
              <span>Опыт героя</span>
              <span className="text-primary">{xp}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xp}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#30D5C8] via-[#37A7FF] to-primary"
              />
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            {rewards.map((reward) => {
              const Icon = reward.icon;
              return (
                <div key={reward.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Icon className="mb-3 h-5 w-5 text-warning" />
                  <div className="text-lg font-black leading-tight">{reward.value}</div>
                  <div className="mt-1 text-[11px] leading-tight text-muted-foreground">{reward.title}</div>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-bold">Эмоция героя</h3>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground"
                onClick={() => setMood("idle")}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {moodOptions.map((option) => {
                const Icon = option.icon;
                const isActive = mood === option.mood;

                return (
                  <Button
                    key={option.mood}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    className={cn(
                      "h-12 justify-start gap-2 rounded-2xl text-sm",
                      isActive ? "shadow-lg shadow-primary/20" : "border-white/10 bg-white/5"
                    )}
                    onClick={() => setMood(option.mood)}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
