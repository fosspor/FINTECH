"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Loader2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FinbroMascot } from "@/components/finbro-mascot";
import { ensureGuestAuth } from "@/lib/api";

export default function AuthPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const displayName = name.trim();

    if (displayName.length < 2) {
      setError("Впиши имя — хотя бы 2 буквы.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await ensureGuestAuth(displayName);
      localStorage.removeItem("finbro_chat_messages");
      document.cookie = "finbro_auth_ready=1; Path=/; SameSite=Lax";
      router.push("/chat");
    } catch {
      setError("Не удалось подготовить профиль. Проверь backend и попробуй ещё раз.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-background px-5 pb-6 pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(48,213,200,0.22),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_50%_100%,rgba(124,92,255,0.18),transparent_70%)]" />

      <div className="relative z-10 flex items-center justify-between">
        <Link
          href="/welcome"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-primary">ФИНБРО</p>
        <div className="h-10 w-10" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, type: "spring", bounce: 0.25 }}
          className="mb-5 flex justify-center"
        >
          <FinbroMascot mood="happy" size="lg" />
        </motion.div>

        <div className="rounded-[2rem] border border-white/10 bg-white/6 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="mb-6">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
              Давай познакомимся
            </p>
            <h1 className="text-3xl font-black tracking-tight">Как тебя зовут?</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              AI-наставник будет обращаться по имени и начнёт первый вопрос уже персонально.
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground">Имя</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-13 rounded-2xl pl-10 text-base font-semibold"
                  placeholder="Например, Георгий"
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </label>

            {error && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-1 h-14 rounded-2xl text-base font-extrabold shadow-lg shadow-primary/20"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Продолжить в чат
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
