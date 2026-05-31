"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  Flame,
  Gem,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LevelMascot, getLevelMascot, type LevelMascotId } from "@/components/level-mascots";
import { DEFAULT_LEVELS } from "@/lib/default-levels";
import { apiUrl, authFetch } from "@/lib/api";

type TaskData = {
  id: string | number;
  title: string;
  type: string;
  crystals: number;
  status?: string;
};

type LevelData = {
  id: string | number;
  title: string;
  description?: string;
  icon_name: string;
  status: string;
  order_index?: number;
  mascot: LevelMascotId;
  tasks?: TaskData[];
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
          const withStatus = parsed.map((level: Partial<LevelData> & Pick<LevelData, "id" | "title">, index: number) => ({
            ...level,
            status: level.status ?? (index === 0 ? "current" : "locked"),
            mascot: getLevelMascot(level.order_index ?? Number(level.id), `${level.title} ${level.description ?? ""}`),
          }));
          if (!cancelled) setLevels(ensureEightLevels(withStatus));
          return;
        } catch (error) {
          console.error("Failed to parse dynamic path", error);
        }
      }

      const fallback = DEFAULT_LEVELS.map((level, index) => ({
        ...level,
        status: index === 0 ? "current" : "locked",
        order_index: level.id,
        mascot: getLevelMascot(level.id, `${level.title} ${level.description}`),
      }));
      if (!cancelled) setLevels(fallback);
    }

    function refreshPractice() {
      try {
        const raw = localStorage.getItem("finbro_practice");
        const items = raw ? JSON.parse(raw) : [];
        setPracticeCount(Array.isArray(items) ? items.length : 0);
      } catch {
        setPracticeCount(0);
      }
    }

    loadPath();
    refreshPractice();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "finbro_practice") refreshPractice();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const progress = useMemo(() => {
    const total = levels.length || 1;
    const completed = levels.filter((level) => level.status === "completed").length;
    const current = levels.find((level) => level.status === "current") ?? levels.find((level) => level.status !== "completed") ?? levels[0];
    const tasksTotal = levels.reduce((sum, level) => sum + (level.tasks?.length ?? 0), 0);
    const tasksDone = levels.reduce((sum, level) => sum + (level.tasks?.filter((task) => task.status === "completed").length ?? 0), 0);
    return {
      completed,
      total,
      current,
      tasksDone,
      tasksTotal,
      percent: Math.round((completed / total) * 100),
    };
  }, [levels]);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center bg-background p-6 text-center">
        <h2 className="mb-2 text-xl font-black">Путь ещё не построен</h2>
        <p className="mb-6 text-muted-foreground">Сначала пообщайся с ФИНБРО, чтобы он собрал персональный план.</p>
        <Link href="/chat">
          <Button>Вернуться в чат</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="relative flex h-[100dvh] min-h-0 w-full flex-1 flex-col overflow-y-auto bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(48,213,200,0.22),transparent_70%)]" />
      <section className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 pb-28 pt-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Личный прогресс
            </div>
            <h1 className="text-3xl font-black tracking-tight">Мой путь</h1>
          </div>
          <div className="flex gap-2">
            <StatPill icon={Flame} value={stats.streak} tone="warning" />
            <StatPill icon={Gem} value={stats.crystals} tone="sky" />
          </div>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-muted-foreground">Пройдено уровней</p>
              <p className="mt-1 text-4xl font-black">
                {progress.completed}
                <span className="text-lg text-muted-foreground">/{progress.total}</span>
              </p>
            </div>
            <div className="rounded-3xl bg-primary/10 px-4 py-3 text-right">
              <p className="text-xs font-black text-primary">прогресс</p>
              <p className="text-2xl font-black">{progress.percent}%</p>
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[#30D5C8] to-primary"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <QuickAction href={progress.current ? `/level/${progress.current.id}` : "/path"} icon={BookOpenCheck} title="Продолжить" text={progress.current?.title ?? "Следующий уровень"} />
            <QuickAction href="/path/practice" icon={RotateCcw} title="Отработка" text={`${practiceCount} вопросов`} />
          </div>
        </motion.section>

        {progress.current && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[2rem] border border-primary/20 bg-primary/10 p-5"
          >
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.75rem] border border-primary/30 bg-background/70">
                <LevelMascot
                  mascot={progress.current.mascot}
                  levelId={progress.current.order_index ?? Number(progress.current.id)}
                  title={progress.current.title}
                  mood="happy"
                  size="sm"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Текущий уровень</p>
                <h2 className="mt-1 truncate text-xl font-black">{progress.current.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{progress.current.description}</p>
              </div>
            </div>
            <Link href={`/level/${progress.current.id}`} className="mt-4 block">
              <Button className="h-13 w-full rounded-2xl font-black">
                Начать задания
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.section>
        )}

        <section className="rounded-[2rem] border border-white/10 bg-background/70 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Карта уровней</h2>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-black text-warning">
              <Trophy className="h-3.5 w-3.5" />
              {progress.tasksTotal ? `${progress.tasksDone}/${progress.tasksTotal} заданий` : "задания"}
            </div>
          </div>

          <div className="relative flex flex-col gap-4">
            <div className="absolute bottom-10 left-10 top-10 w-1 rounded-full bg-border/40" />
            {levels.map((level, index) => (
              <LevelRow key={level.id} level={level} index={index} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function ensureEightLevels(levels: LevelData[]): LevelData[] {
  if (levels.length >= 8) return levels;
  const existingOrders = new Set(levels.map((level) => level.order_index ?? Number(level.id)));
  const placeholders: LevelData[] = [];

  for (const fallback of DEFAULT_LEVELS) {
    if (existingOrders.has(fallback.id)) continue;
    placeholders.push({
      id: fallback.id,
      title: fallback.title,
      description: fallback.description,
      icon_name: fallback.icon_name,
      status: "locked",
      order_index: fallback.id,
      mascot: getLevelMascot(fallback.id, `${fallback.title} ${fallback.description}`),
      tasks: fallback.tasks,
    });
    if (levels.length + placeholders.length >= 8) break;
  }

  return [...levels, ...placeholders].slice(0, 8);
}

function StatPill({ icon: Icon, value, tone }: { icon: typeof Flame; value: number; tone: "warning" | "sky" }) {
  const className = tone === "warning" ? "bg-warning/10 text-warning border-warning/20" : "bg-sky-500/10 text-sky-500 border-sky-500/20";
  return (
    <div className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-black", className)}>
      <Icon className="h-4 w-4 fill-current" />
      {value}
    </div>
  );
}

function QuickAction({ href, icon: Icon, title, text }: { href: string; icon: typeof BookOpenCheck; title: string; text: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-white/10 bg-background/70 p-4 transition hover:border-primary/30 hover:bg-primary/10">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="font-black">{title}</p>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{text}</p>
    </Link>
  );
}

function LevelRow({ level, index }: { level: LevelData; index: number }) {
  const isCompleted = level.status === "completed";
  const isCurrent = level.status === "current";
  const isLocked = level.status === "locked";
  const completedTasks = level.tasks?.filter((task) => task.status === "completed").length ?? 0;
  const totalTasks = level.tasks?.length ?? 0;

  const content = (
    <div
      className={cn(
        "relative z-10 flex items-center gap-4 rounded-[1.75rem] border p-3 transition",
        isCompleted && "border-success/25 bg-success/10",
        isCurrent && "border-primary/35 bg-primary/10 shadow-lg shadow-primary/10",
        isLocked && "border-white/10 bg-white/5 opacity-70"
      )}
    >
      <div
        className={cn(
          "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border bg-background",
          isCompleted && "border-success text-success",
          isCurrent && "border-primary text-primary",
          isLocked && "border-border grayscale"
        )}
      >
        {isCompleted && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground">
            <Check className="h-4 w-4" />
          </span>
        )}
        {isLocked && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-background bg-muted text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
          </span>
        )}
        {isCurrent && <span className="absolute inset-0 animate-ping rounded-3xl border-2 border-primary/35" />}
        <LevelMascot
          mascot={level.mascot}
          levelId={level.order_index ?? Number(level.id)}
          title={level.title}
          mood={isCompleted ? "celebrate" : isCurrent ? "happy" : "idle"}
          size="sm"
          locked={isLocked}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-black text-muted-foreground">Уровень {level.order_index ?? index + 1}</p>
          {isCurrent && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black uppercase text-primary">сейчас</span>}
        </div>
        <h3 className={cn("mt-1 truncate text-base font-black", isCurrent && "text-primary")}>{level.title}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{level.description}</p>
        {totalTasks > 0 && (
          <p className="mt-2 text-xs font-bold text-muted-foreground">
            {completedTasks}/{totalTasks} заданий
          </p>
        )}
      </div>

      {!isLocked && <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
      {isLocked ? content : <Link href={`/level/${level.id}`}>{content}</Link>}
    </motion.div>
  );
}
