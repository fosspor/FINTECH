"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Gem, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

type TaskData = {
  id: number;
  title: string;
  type: string;
  crystals: number;
};

type LevelDetails = {
  id: number;
  title: string;
  description: string;
  tasks: TaskData[];
};

export default function LevelDetailsPage() {
  const params = useParams();
  const levelId = params?.id;
  const [level, setLevel] = useState<LevelDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("finbro_path");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const found = parsed.find((l: LevelDetails) => l.id.toString() === levelId);
        setLevel(found || null);
      } catch (e) {
        console.error("Failed to parse dynamic path", e);
      }
    }
    setLoading(false);
  }, [levelId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[100dvh] bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!level) {
    return (
      <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative items-center justify-center text-center p-6">
        <h2 className="text-xl font-bold mb-2">Уровень не найден</h2>
        <p className="text-muted-foreground mb-6">Возможно, он был удален или вы перешли по неверной ссылке.</p>
        <Link href="/path">
          <Button>Вернуться к пути</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative z-50">
      {/* Header */}
      <header className="px-4 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center gap-4">
        <Link href="/path">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h2 className="font-bold text-xl">Уровень {levelId}</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold mb-2 text-primary">{level.title}</h1>
          <p className="text-muted-foreground text-lg">
            {level.description}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {level.tasks?.map((task: TaskData, idx: number) => {
            // For MVP dynamically mock status
            const isCompleted = idx === 0;
            const isCurrent = idx === 1;
            const isLocked = idx > 1;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, type: "spring" }}
                className={`p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  isCompleted ? "bg-success/5 border-success/20" :
                  isCurrent ? "bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(124,92,255,0.15)]" :
                  "bg-muted/50 border-border/10 opacity-70 grayscale"
                }`}
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                      isCompleted ? "bg-success/20 text-success" :
                      isCurrent ? "bg-primary/20 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {task.type === "mini_game" ? "Игра" :
                       task.type === "quiz" ? "Квиз" :
                       task.type === "lesson" ? "Урок" : "Задание"}
                    </span>
                    {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <h3 className={`font-bold text-[17px] ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </h3>
                </div>

                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="flex items-center gap-1 font-bold text-sky-500 mb-2">
                    <Gem className="w-4 h-4 fill-sky-500" />
                    +{task.crystals}
                  </div>
                  
                  {!isLocked && !isCompleted && (
                    <Button size="sm" className="rounded-full shadow-md hover:scale-105 transition-transform">
                      <Play className="w-4 h-4 mr-1" fill="currentColor" /> Начать
                    </Button>
                  )}
                  {isCompleted && (
                    <div className="text-sm font-semibold text-success bg-success/10 px-3 py-1.5 rounded-full">
                      Пройдено
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
