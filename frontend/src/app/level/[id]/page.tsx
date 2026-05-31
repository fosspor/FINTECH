"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Gem,
  Lightbulb,
  Loader2,
  Lock,
  Play,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { LevelMascot, getLevelMascot } from "@/components/level-mascots";
import { DEFAULT_LEVELS } from "@/lib/default-levels";
import { apiUrl, authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type TaskData = {
  id: string | number;
  title: string;
  type: string;
  crystals: number;
  status?: string;
};

type LevelDetails = {
  id: string | number;
  title: string;
  description?: string;
  order_index?: number;
  tasks: TaskData[];
};

export default function LevelDetailsPage() {
  const params = useParams();
  const levelId = params?.id;
  const [level, setLevel] = useState<LevelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [reflection, setReflection] = useState("");
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [isCompleting, setIsCompleting] = useState(false);
  const [reward, setReward] = useState<{ crystals: number; title: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLevel() {
      try {
        const response = await authFetch(apiUrl(`/levels/${levelId}`));
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) setLevel(data);
          return;
        }
      } catch (error) {
        console.error("Failed to load level from backend", error);
      }

      const stored = localStorage.getItem("finbro_path");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const found = parsed.find((l: LevelDetails) => l.id.toString() === levelId);
          if (!cancelled) setLevel(found || null);
        } catch (e) {
          console.error("Failed to parse dynamic path", e);
        }
      } else {
        const found = DEFAULT_LEVELS.find((l) => l.id.toString() === levelId);
        if (!cancelled) setLevel(found || null);
      }

      if (!cancelled) setLoading(false);
    }

    loadLevel().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [levelId]);

  const firstPendingIndex = level?.tasks.findIndex((item) => item.status !== "completed") ?? -1;

  const startTask = async (task: TaskData) => {
    setActiveTask(task);
    setSelectedAnswer("");
    setReflection("");
    setAnswerState("idle");
    setReward(null);

    if (task.type === "quiz") {
      try {
        const historyStr = (typeof window !== "undefined" ? localStorage.getItem("finbro_chat_messages") : null) || "";
        type StoredMsg = { role: string; content: string };
        const chat_history = historyStr ? (JSON.parse(historyStr) as StoredMsg[]).map((m: StoredMsg) => `${m.role}: ${m.content}`).join("\n") : "";
        const res = await authFetch(apiUrl(`/levels/${levelId}/quiz`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_history }),
        });
        if (res.ok) {
          const data = await res.json();
          // Cache quiz for this task so buildTaskLesson can use it
          sessionStorage.setItem(`finbro_quiz_${levelId}_${task.id}` , JSON.stringify(data));
        }
      } catch (e) {
        console.error("Failed to fetch generated quiz", e);
      }
    }
  };

  const closeTask = () => {
    setActiveTask(null);
    setSelectedAnswer("");
    setReflection("");
    setAnswerState("idle");
  };

  const completeTask = async (task: TaskData) => {
    setIsCompleting(true);

    try {
      let nextStatus = "completed";
      let earnedCrystals = task.crystals;

      if (typeof task.id === "string") {
        const response = await authFetch(apiUrl(`/tasks/${task.id}/complete`), {
          method: "POST",
        });
        if (!response.ok) throw new Error(`Complete task failed: ${response.status}`);
        const data = await response.json();
        nextStatus = data.task?.status ?? "completed";
        earnedCrystals = data.crystals_awarded ?? task.crystals;
      }

      setLevel((current) => {
        if (!current) return current;
        return {
          ...current,
          tasks: current.tasks.map((item) =>
            item.id === task.id ? { ...item, status: nextStatus } : item
          ),
        };
      });
      setReward({ crystals: earnedCrystals, title: task.title });
    } catch (error) {
      console.error("Failed to complete task", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const lesson = activeTask && level ? buildTaskLesson(activeTask, level) : null;
  const LessonIcon = lesson?.icon;

  const submitTask = async () => {
    if (!activeTask || !lesson) return;

    if (lesson.kind === "quiz" && selectedAnswer !== lesson.correctAnswer) {
      setAnswerState("wrong");
      return;
    }

    if (lesson.kind !== "quiz" && reflection.trim().length < 3) {
      setAnswerState("wrong");
      return;
    }

    setAnswerState("correct");
    await completeTask(activeTask);
  };

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
        <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 relative">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_50%_0%,rgba(48,213,200,0.22),transparent_70%)] pointer-events-none" />
          <div className="relative z-10 flex items-center gap-5">
            <LevelMascot
              mascot={getLevelMascot(level.order_index ?? Number(level.id), `${level.title} ${level.description ?? ""}`)}
              levelId={level.order_index ?? Number(level.id)}
              title={level.title}
              mood="happy"
              size="lg"
              className="shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold mb-2 text-primary">{level.title}</h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                {level.description}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Задания уровня</h2>
            <p className="text-sm text-muted-foreground">
              Проходи по одному: коротко, понятно, с наградой.
            </p>
          </div>
          <div className="rounded-2xl bg-muted px-3 py-2 text-right">
            <p className="text-[11px] font-bold text-muted-foreground">Прогресс</p>
            <p className="text-lg font-black">
              {level.tasks.filter((task) => task.status === "completed").length}/{level.tasks.length}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {level.tasks?.map((task: TaskData, idx: number) => {
            const isCompleted = task.status === "completed";
            const isCurrent = !isCompleted && idx === Math.max(firstPendingIndex, 0);
            const isLocked = !isCompleted && !isCurrent;

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
                    <Button
                      size="sm"
                      className="rounded-full shadow-md hover:scale-105 transition-transform"
                      onClick={() => startTask(task)}
                    >
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

      <AnimatePresence>
        {activeTask && lesson && (
          <motion.div
            className="fixed inset-0 z-[80] bg-background"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
          >
            <div className="mx-auto flex h-[100dvh] max-w-2xl flex-col">
              <header className="flex items-center gap-3 border-b border-border/10 px-4 py-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeTask}
                  className="rounded-full"
                  disabled={isCompleting}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                    {getTaskTypeLabel(activeTask.type)}
                  </p>
                  <h2 className="truncate text-lg font-black">{activeTask.title}</h2>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1.5 text-sm font-black text-sky-500">
                  <Gem className="h-4 w-4 fill-sky-500" />
                  +{activeTask.crystals}
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-8">
                {reward ? (
                  <RewardView reward={reward} onClose={closeTask} />
                ) : (
                  <motion.div
                    key={activeTask.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto flex max-w-md flex-col"
                  >
                    <div className="relative mb-5 flex h-52 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
                      <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_50%_0%,rgba(48,213,200,0.22),transparent_70%)]" />
                      <LevelMascot
                        mascot={getLevelMascot(level.order_index ?? Number(level.id), `${level.title} ${level.description ?? ""}`)}
                        levelId={level.order_index ?? Number(level.id)}
                        title={level.title}
                        mood={answerState === "wrong" ? "thinking" : "happy"}
                        size="xl"
                      />
                    </div>

                    <div className="mb-4 flex items-center gap-2 text-sm font-black text-primary">
                      {LessonIcon && <LessonIcon className="h-4 w-4" />}
                      {lesson.badge}
                    </div>

                    <h1 className="text-3xl font-black leading-tight">{lesson.title}</h1>
                    <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground">
                      {lesson.body}
                    </p>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-muted/70 p-4">
                      <p className="text-sm font-black">{lesson.prompt}</p>
                    </div>

                    {lesson.kind === "quiz" ? (
                      <div className="mt-4 flex flex-col gap-3">
                        {lesson.answers.map((answer) => {
                          const isSelected = selectedAnswer === answer;
                          const isCorrect = answerState !== "idle" && answer === lesson.correctAnswer;
                          const isWrong = answerState === "wrong" && isSelected && answer !== lesson.correctAnswer;

                          return (
                            <button
                              key={answer}
                              type="button"
                              onClick={() => {
                                setSelectedAnswer(answer);
                                setAnswerState("idle");
                              }}
                              className={cn(
                                "flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
                                isSelected ? "border-primary bg-primary/10 text-foreground" : "border-border/40 bg-background hover:bg-muted",
                                isCorrect && "border-success bg-success/10 text-success",
                                isWrong && "border-destructive bg-destructive/10 text-destructive"
                              )}
                            >
                              {isCorrect ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0" />
                              ) : isWrong ? (
                                <XCircle className="h-5 w-5 shrink-0" />
                              ) : (
                                <span className="h-5 w-5 shrink-0 rounded-full border border-current/30" />
                              )}
                              {answer}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <textarea
                        value={reflection}
                        onChange={(event) => {
                          setReflection(event.target.value);
                          setAnswerState("idle");
                        }}
                        placeholder={lesson.placeholder}
                        className={cn(
                          "mt-4 min-h-32 w-full resize-none rounded-2xl border bg-background px-4 py-3 text-base font-medium outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15",
                          answerState === "wrong" ? "border-destructive" : "border-border/50"
                        )}
                      />
                    )}

                    {answerState === "wrong" && (
                      <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm font-bold text-warning">
                        {lesson.kind === "quiz"
                          ? "Почти. Выбери вариант, который уменьшает риск прямо сейчас."
                          : "Напиши короткий ответ, хотя бы пару слов. Это нужно, чтобы действие стало твоим."}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {!reward && (
                <footer className="relative z-[90] border-t border-border/10 bg-background/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
                  <Button
                    type="button"
                    onClick={submitTask}
                    disabled={isCompleting || (lesson.kind === "quiz" ? !selectedAnswer : reflection.trim().length < 1)}
                    className="h-14 w-full rounded-2xl text-base font-extrabold shadow-lg shadow-primary/20"
                  >
                    {isCompleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                    Проверить и завершить
                  </Button>
                </footer>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function getTaskTypeLabel(type: string) {
  if (type === "mini_game") return "Мини-игра";
  if (type === "quiz") return "Квиз";
  if (type === "lesson") return "Урок";
  return "Действие";
}

function buildTaskLesson(task: TaskData, level: LevelDetails) {
  const topic = `${level.title} ${level.description ?? ""} ${task.title}`.toLowerCase();

  if (task.type === "quiz") {
    // Try to use generated quiz if present
    try {
      const key = `finbro_quiz_${level.id}_${task.id}`;
      const stored = typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        const answers: string[] = parsed.answers || [];
        const correct: string = parsed.correct_answer || (answers[0] ?? "");
        return {
          kind: "quiz" as const,
          icon: Target,
          badge: "Выбери лучший следующий шаг",
          title: task.title,
          body: "Здесь нет школьных оценок. Мы тренируем финансовый выбор: что даст максимум спокойствия и контроля уже сегодня.",
          prompt: parsed.question || "Что лучше сделать первым?",
          answers: answers.length ? answers : buildQuizAnswers(topic),
          correctAnswer: correct || buildQuizAnswers(topic)[0],
          placeholder: "",
        };
      }
    } catch {}
    return {
      kind: "quiz" as const,
      icon: Target,
      badge: "Выбери лучший следующий шаг",
      title: task.title,
      body: "Здесь нет школьных оценок. Мы тренируем финансовый выбор: что даст максимум спокойствия и контроля уже сегодня.",
      prompt: "Что лучше сделать первым?",
      answers: buildQuizAnswers(topic),
      correctAnswer: buildQuizAnswers(topic)[0],
      placeholder: "",
    };
  }

  if (task.type === "mini_game") {
    return {
      kind: "action" as const,
      icon: Sparkles,
      badge: "Быстрое игровое действие",
      title: task.title,
      body: "Мини-игра в FinBro — это короткое действие на внимательность. Найди одну привычку или трату, которую можно поймать до того, как деньги исчезнут.",
      prompt: "Напиши одну ловушку или привычку, которую заметил у себя.",
      answers: [],
      correctAnswer: "",
      placeholder: "Например: доставка вечером, маркетплейсы, такси без необходимости...",
    };
  }

  if (task.type === "lesson") {
    return {
      kind: "action" as const,
      icon: Lightbulb,
      badge: "Короткий урок",
      title: task.title,
      body: buildLessonBody(topic),
      prompt: "Зафиксируй главный вывод одним предложением.",
      answers: [],
      correctAnswer: "",
      placeholder: "Например: сначала закрываю кредитку, потом коплю подушку...",
    };
  }

  return {
    kind: "action" as const,
    icon: ClipboardCheck,
    badge: "Практическое действие",
    title: task.title,
    body: "Сейчас важно не идеально посчитать все на свете, а сделать один маленький шаг. Маленькие действия создают ощущение контроля.",
    prompt: "Напиши, что сделаешь сегодня после этого задания.",
    answers: [],
    correctAnswer: "",
    placeholder: "Например: выпишу расходы за неделю или отключу одну подписку...",
  };
}

function buildQuizAnswers(topic: string) {
  if (/кредит|долг|карт|займ/.test(topic)) {
    return [
      "Выписать остаток, ставку и минимальный платеж по каждому долгу",
      "Платить случайную сумму, когда останутся деньги",
      "Открыть еще один кредит, чтобы стало легче",
    ];
  }

  if (/подуш|накоп|резерв|сбереж/.test(topic)) {
    return [
      "Выбрать маленькую регулярную сумму и отделить ее в день дохода",
      "Ждать месяца, когда не будет никаких расходов",
      "Держать резерв на той же карте, где ежедневные траты",
    ];
  }

  if (/импульс|покуп|трат|подпис/.test(topic)) {
    return [
      "Поставить паузу перед покупкой и записать причину желания",
      "Покупать быстрее, пока действует скидка",
      "Не смотреть выписку, чтобы не расстраиваться",
    ];
  }

  return [
    "Сделать один маленький шаг, который можно проверить сегодня",
    "Составить идеальный план и начать когда-нибудь потом",
    "Ничего не менять, пока не появится больше денег",
  ];
}

function buildLessonBody(topic: string) {
  if (/кредит|долг|карт|займ/.test(topic)) {
    return "Долг становится управляемым, когда он виден в цифрах: остаток, ставка, минимальный платеж и дата. Без этой карты мозг спорит с тревогой, а не с реальностью.";
  }

  if (/подуш|накоп|резерв|сбереж/.test(topic)) {
    return "Подушка начинается не с большой суммы, а с отдельного места для денег и регулярного маленького перевода. Так резерв перестает конкурировать с ежедневными тратами.";
  }

  if (/импульс|покуп|трат|подпис/.test(topic)) {
    return "Импульсивная покупка часто длится всего несколько минут. Пауза возвращает тебе выбор: купить осознанно, отложить или заменить дешевле.";
  }

  if (/бюдж|расход|доход|категор|план/.test(topic)) {
    return "Бюджет нужен не для запретов, а для ясности. Сначала отделяем обязательные расходы от свободных, потом решаем, куда направить остаток.";
  }

  return "Финансовый прогресс начинается с маленького действия, которое можно повторить. Один понятный шаг лучше большого плана, который страшно открыть.";
}

function RewardView({
  reward,
  onClose,
}: {
  reward: { crystals: number; title: string };
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto flex h-full max-w-md flex-col items-center justify-center text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-x-4 bottom-3 h-12 rounded-full bg-primary/25 blur-2xl" />
        <LevelMascot mascot="crystal_bro" mood="celebrate" size="xl" />
      </div>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-sm font-black text-success">
        <CheckCircle2 className="h-4 w-4" />
        Задание пройдено
      </div>
      <h1 className="text-4xl font-black leading-tight">Отлично!</h1>
      <p className="mt-3 max-w-[340px] text-base font-medium leading-relaxed text-muted-foreground">
        Ты завершил “{reward.title}” и закрепил еще один шаг в своем финансовом пути.
      </p>
      <div className="my-7 flex items-center gap-2 rounded-3xl border border-sky-500/20 bg-sky-500/10 px-5 py-4 text-2xl font-black text-sky-500">
        <Gem className="h-7 w-7 fill-sky-500" />
        +{reward.crystals}
      </div>
      <Button
        type="button"
        onClick={onClose}
        className="h-14 w-full rounded-2xl text-base font-extrabold"
      >
        Продолжить уровень
      </Button>
    </motion.div>
  );
}
