"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronLeft, MessageCircle, PiggyBank, Route, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FinbroMascot } from "@/components/finbro-mascot";
import { LevelMascot, type LevelMascotId } from "@/components/level-mascots";
import { cn } from "@/lib/utils";

type Slide = {
  title: string;
  text: string;
  icon: typeof MessageCircle;
  mascot: LevelMascotId | "finclip";
  accent: string;
};

const slides: Slide[] = [
  {
    title: "Сначала FinClip тебя выслушает",
    text: "Ты рассказываешь про доходы, расходы, долги и цель. Мы не начинаем с таблиц, а собираем картину через простой разговор.",
    icon: MessageCircle,
    mascot: "finclip",
    accent: "from-[#30D5C8] to-[#37A7FF]",
  },
  {
    title: "Потом появится личный путь",
    text: "Из ответов строятся уровни: сначала самые срочные проблемы, потом привычки, резерв, кредиты и рост денег.",
    icon: Route,
    mascot: "checklist",
    accent: "from-[#7C5CFF] to-[#A855F7]",
  },
  {
    title: "Каждый уровень решает одну задачу",
    text: "Без перегруза: маленькое действие, понятная причина и быстрая победа. Как уроки в Duolingo, только про деньги.",
    icon: PiggyBank,
    mascot: "piggy",
    accent: "from-[#FFD166] to-[#22C55E]",
  },
  {
    title: "Прогресс сохраняется",
    text: "За задания ты получаешь кристаллы, серию дней и новых помощников. FinClip будет вести тебя дальше.",
    icon: Sparkles,
    mascot: "crystal_bro",
    accent: "from-[#37A7FF] to-[#7C5CFF]",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;
  const Icon = slide.icon;

  const progress = useMemo(() => ((index + 1) / slides.length) * 100, [index]);

  const finish = () => {
    localStorage.setItem("finbro_seen_onboarding", "1");
    router.push("/chat");
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }

    setIndex((value) => value + 1);
  };

  return (
    <main className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-background px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] bg-[radial-gradient(circle_at_50%_0%,rgba(48,213,200,0.22),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-[radial-gradient(circle_at_50%_100%,rgba(124,92,255,0.2),transparent_70%)]" />

      <header className="relative z-10 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (index === 0 ? router.push("/auth") : setIndex((value) => value - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur"
          aria-label="Назад"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
        <button
          type="button"
          onClick={finish}
          className="h-10 rounded-full px-3 text-sm font-black text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          Пропустить
        </button>
      </header>

      <section className="relative z-10 mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.title}
            initial={{ opacity: 0, x: 28, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -28, scale: 0.98 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="flex flex-col items-center text-center"
          >
            <div className="relative mb-6 flex h-72 w-full items-center justify-center">
              <motion.div
                className={cn(
                  "absolute h-52 w-52 rounded-full bg-gradient-to-br opacity-25 blur-2xl",
                  slide.accent
                )}
                animate={{ scale: [0.92, 1.08, 0.92] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              />

              <div className="absolute left-4 top-7 rounded-3xl border border-white/10 bg-white/6 p-3 shadow-xl backdrop-blur-xl">
                <Icon className="h-8 w-8 text-primary" />
              </div>

              <div className="absolute right-5 bottom-8 rounded-3xl border border-white/10 bg-white/6 px-3 py-2 text-left shadow-xl backdrop-blur-xl">
                <p className="text-[11px] font-bold text-muted-foreground">Шаг</p>
                <p className="text-lg font-black">{index + 1}/{slides.length}</p>
              </div>

              {slide.mascot === "finclip" ? (
                <FinbroMascot mood="celebrate" size="xl" />
              ) : (
                <LevelMascot mascot={slide.mascot} mood="happy" size="xl" />
              )}
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-black text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Персонально под тебя
            </div>

            <h1 className="max-w-[360px] text-4xl font-black leading-[1.02] tracking-tight">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-[350px] text-[16px] font-medium leading-relaxed text-muted-foreground">
              {slide.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-4">
        <div className="flex justify-center gap-2">
          {slides.map((item, itemIndex) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setIndex(itemIndex)}
              className={cn(
                "h-2 rounded-full transition-all",
                itemIndex === index ? "w-8 bg-primary" : "w-2 bg-muted"
              )}
              aria-label={`Открыть слайд ${itemIndex + 1}`}
            />
          ))}
        </div>

        <Button
          type="button"
          onClick={next}
          className="h-14 w-full rounded-2xl text-base font-extrabold shadow-lg shadow-primary/25"
        >
          {isLast ? "Начать разговор" : "Дальше"}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </footer>
    </main>
  );
}
