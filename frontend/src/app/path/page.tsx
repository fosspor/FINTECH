"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Gem, Check, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LevelMascot, getLevelMascot, type LevelMascotId } from "@/components/level-mascots";
import { DEFAULT_LEVELS } from "@/lib/default-levels";
import { apiUrl, authFetch } from "@/lib/api";

type LevelData = {
  id: string | number;
  title: string;
  description?: string;
  icon_name: string;
  status: string;
  order_index?: number;
  mascot: LevelMascotId;
};

export default function PathPage() {
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [stats, setStats] = useState({ streak: 0, crystals: 0 });
  const [loading, setLoading] = useState(true);
  const [practiceCount, setPracticeCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPath() {
      try {
        const [pathResponse, userResponse] = await Promise.all([
          authFetch(apiUrl("/path")),
          authFetch(apiUrl("/users/me")),
        ]);

        if (pathResponse.ok) {
          const data = await pathResponse.json();
          const fromApi = data.levels.map((level: Omit<LevelData, "mascot">) => ({
            ...level,
            mascot: getLevelMascot(level.order_index, `${level.title} ${level.description ?? ""}`),
          }));
          const padded = ensureEightLevels(fromApi);
          if (!cancelled) {
            setLevels(padded);
            localStorage.setItem("finbro_path", JSON.stringify(padded));
          }
        } else {
          loadLocalPath();
        }

        if (userResponse.ok) {
          const user = await userResponse.json();
          if (!cancelled) {
            setStats({
              streak: user.streak?.current_streak ?? 0,
              crystals: user.currency?.crystals ?? 0,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load backend path", error);
        loadLocalPath();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    function loadLocalPath() {
      const stored = localStorage.getItem("finbro_path");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const withStatus = parsed.map((lvl: Partial<LevelData> & Pick<LevelData, "id" | "title">, i: number) => ({
            ...lvl,
            status: lvl.status ?? (i === 0 ? "current" : "locked"),
            mascot: getLevelMascot(lvl.order_index ?? Number(lvl.id), `${lvl.title} ${lvl.description ?? ""}`)
          }));
          if (!cancelled) setLevels(withStatus);
          return;
        } catch (e) {
          console.error("Failed to parse dynamic path", e);
        }
      }

      const fallback = DEFAULT_LEVELS.map((lvl, i) => ({
        ...lvl,
        status: i === 0 ? "current" : "locked",
        order_index: lvl.id,
        mascot: getLevelMascot(lvl.id, `${lvl.title} ${lvl.description}`)
      }));
      if (!cancelled) setLevels(fallback);
    }

    loadPath();
    function refreshPractice() {
      try {
        const raw = localStorage.getItem("finbro_practice");
        const items = raw ? JSON.parse(raw) : [];
        setPracticeCount(Array.isArray(items) ? items.length : 0);
      } catch { setPracticeCount(0); }
    }
    refreshPractice();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "finbro_practice") refreshPractice();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

function ensureEightLevels(levels: LevelData[]): LevelData[] {
  if (levels.length >= 8) return levels;
  const existingOrders = new Set(levels.map((l) => l.order_index ?? Number(l.id)));
  const needed = 8 - levels.length;
  const placeholders: LevelData[] = [];
  for (const d of DEFAULT_LEVELS) {
    const ord = d.id;
    if (existingOrders.has(ord)) continue;
    placeholders.push({
      id: d.id,
      title: d.title,
      description: d.description,
      icon_name: d.icon_name,
      status: "locked",
      order_index: d.id,
      mascot: getLevelMascot(d.id, `${d.title} ${d.description}`),
    });
    if (placeholders.length >= needed) break;
  }
  return [...levels, ...placeholders].slice(0, 8);
}

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback to empty state if no path exists
  if (levels.length === 0) {
    return (
      <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative items-center justify-center text-center p-6">
        <h2 className="text-xl font-bold mb-2">Путь еще не построен</h2>
        <p className="text-muted-foreground mb-6">Тебе нужно пообщаться с FinBro, чтобы он составил персональный план.</p>
        <Link href="/">
          <Button>Вернуться в чат</Button>
        </Link>
      </main>
    );
  }
  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <h2 className="font-semibold text-xl">Мой путь</h2>
        <div className="flex gap-4">
          {/* Flame / Streak */}
          <div className="flex items-center gap-1.5 bg-warning/10 text-warning px-3 py-1.5 rounded-full font-bold text-sm border border-warning/20">
            <Flame className="w-4 h-4 fill-warning" />
            {stats.streak}
          </div>
          {/* Gem / Crystals */}
          <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-500 px-3 py-1.5 rounded-full font-bold text-sm border border-sky-500/20">
            <Gem className="w-4 h-4 fill-sky-500" />
            {stats.crystals}
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col items-center py-12 px-6 pb-8 relative w-full overflow-x-hidden min-h-[800px]">
          {/* Practice entry top-left */}
          <div className="absolute left-3 top-2 md:left-4 md:top-3 z-10">
            <Link href="/path/practice">
              <div className="group cursor-pointer rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 shadow-none hover:shadow-sm transition max-w-[180px]">
                <div className="text-[11px] font-black uppercase tracking-widest text-primary leading-none">Отработка материала</div>
                <div className="mt-1 text-foreground font-bold text-xs leading-none">{practiceCount} вопрос(ов)</div>
              </div>
            </Link>
          </div>
          {/* Connecting dashed line in the center */}
          <div className="absolute top-12 bottom-12 left-1/2 -translate-x-1/2 w-1 border-l-4 border-dashed border-border/40 z-0" />

          {levels.map((level, index) => {
            const isEven = index % 2 === 0;
            const isCompleted = level.status === "completed";
            const isCurrent = level.status === "current";
            const isLocked = level.status === "locked";
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, type: "spring", stiffness: 200, damping: 20 }}
                key={level.id}
                className={cn(
                  "relative z-10 flex flex-col items-center mb-14 w-full",
                  isEven ? "pr-[30%]" : "pl-[30%]"
                )}
              >
                <Link href={isLocked ? "#" : `/level/${level.id}`}>
                  <div className="relative group cursor-pointer">
                    {/* Node Circle */}
                    <div 
                      className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center border-[4px] shadow-xl transition-transform duration-300 relative",
                        isCompleted && "bg-success border-success-foreground text-success-foreground shadow-success/30 hover:scale-105",
                        isCurrent && "bg-background border-primary text-primary shadow-primary/40 scale-110",
                        isLocked && "bg-muted border-border text-muted-foreground opacity-60 grayscale"
                      )}
                    >
                      {/* Checkmark badge for completed */}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-white text-success rounded-full flex items-center justify-center shadow-md">
                          <Check className="w-5 h-5 font-bold" />
                        </div>
                      )}
                      
                      {/* Lock badge for locked */}
                      {isLocked && (
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-muted text-muted-foreground border-2 border-background rounded-full flex items-center justify-center shadow-md">
                          <Lock className="w-4 h-4 font-bold" />
                        </div>
                      )}

                      {/* Current pulse effect */}
                      {isCurrent && (
                        <span className="absolute inset-0 rounded-full border-4 border-primary/50 animate-ping" />
                      )}

                      <LevelMascot
                        mascot={level.mascot}
                        levelId={level.order_index ?? Number(level.id)}
                        title={level.title}
                        mood={isCompleted ? "celebrate" : isCurrent ? "happy" : "idle"}
                        size="sm"
                        locked={isLocked}
                      />
                    </div>
                  </div>
                </Link>

                {/* Level Title Container */}
                <div className="mt-4 text-center">
                  <h3 className={cn(
                    "font-bold text-lg",
                    isLocked ? "text-muted-foreground" : "text-foreground",
                    isCurrent && "text-primary text-xl"
                  )}>
                    {level.title}
                  </h3>
                  {isCurrent && (
                    <span className="inline-block mt-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest border border-primary/20">
                      Текущий уровень
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </main>
  );
}
