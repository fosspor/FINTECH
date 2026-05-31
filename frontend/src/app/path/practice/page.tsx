"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type PracticeItem = {
  id: string;
  levelId: string;
  taskId: string;
  question: string;
  answers: string[];
  correct_answer: string;
  created_at: number;
};

export default function PracticePage() {
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<Record<string, string>>({});
  const [state, setState] = useState<Record<string, "idle" | "correct" | "wrong">>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("finbro_practice");
      const arr = raw ? (JSON.parse(raw) as PracticeItem[]) : [];
      setItems(Array.isArray(arr) ? arr : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const total = items.length;

  function persist(next: PracticeItem[]) {
    localStorage.setItem("finbro_practice", JSON.stringify(next));
    setItems(next);
    try {
      window.dispatchEvent(new StorageEvent("storage", { key: "finbro_practice", newValue: JSON.stringify(next) }));
    } catch {}
  }

  function onSubmit(item: PracticeItem) {
    const selected = answer[item.id];
    if (!selected) return;
    if (selected === item.correct_answer) {
      setState((s) => ({ ...s, [item.id]: "correct" }));
      const next = items.filter((it) => it.id !== item.id);
      setTimeout(() => persist(next), 300);
    } else {
      setState((s) => ({ ...s, [item.id]: "wrong" }));
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative">
      <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center gap-3">
        <Link href="/path">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h2 className="font-semibold text-xl flex-1">Отработка материала</h2>
        <div className="text-sm font-black">{total} вопрос(ов)</div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">Пока здесь пусто. Ошибочные ответы из квизов будут появляться здесь для повторения.</div>
        ) : (
          items.map((it) => {
            const seed = it.id;
            const answers = stableShuffle(it.answers, seed);
            const sel = answer[it.id];
            const st = state[it.id] || "idle";
            return (
              <div key={it.id} className="rounded-2xl border border-border/10 bg-muted/50 p-4">
                <div className="text-sm font-black mb-3">{it.question}</div>
                <div className="flex flex-col gap-3">
                  {answers.map((a) => {
                    const isSelected = sel === a;
                    const isCorrect = st !== "idle" && a === it.correct_answer;
                    const isWrong = st === "wrong" && isSelected && a !== it.correct_answer;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          setAnswer((ans) => ({ ...ans, [it.id]: a }));
                          setState((s) => ({ ...s, [it.id]: "idle" }));
                        }}
                        className={cn(
                          "flex min-h-12 items-center gap-3 rounded-xl border px-4 py-2 text-left text-sm font-bold transition",
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
                        {a}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    className="rounded-full font-black"
                    onClick={() => onSubmit(it)}
                    disabled={!answer[it.id]}
                  >
                    Проверить
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}

function stableShuffle(items: string[], seed: string): string[] {
  const keyed = items.map((v) => ({ key: hashStr(`${seed}|${v}`), v }));
  keyed.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return keyed.map((x) => x.v);
}

function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}
