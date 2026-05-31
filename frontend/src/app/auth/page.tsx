"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FinbroMascot } from "@/components/finbro-mascot";
import { ensureAuth, loginUser, registerUser } from "@/lib/api";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isRegister = mode === "register";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isRegister) {
        await registerUser({
          name: name.trim() || email.trim().split("@")[0] || "FinBro User",
          email: email.trim(),
          password,
        });
      } else {
        await loginUser({
          email: email.trim(),
          password,
        });
      }

      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = async () => {
    setError("");
    setIsLoading(true);

    try {
      await ensureAuth();
      router.push("/onboarding");
    } catch {
      setError("Не удалось создать гостевой профиль");
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
        <p className="text-sm font-black uppercase tracking-[0.24em] text-primary">FinBro</p>
        <div className="h-10 w-10" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, type: "spring", bounce: 0.25 }}
          className="mb-5 flex justify-center"
        >
          <FinbroMascot mood={isRegister ? "celebrate" : "happy"} size="lg" />
        </motion.div>

        <div className="rounded-[2rem] border border-white/10 bg-white/6 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="mb-4 grid grid-cols-2 rounded-2xl bg-muted p-1">
            {(["login", "register"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setError("");
                }}
                className={cn(
                  "h-11 rounded-xl text-sm font-black transition",
                  mode === item
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          <div className="mb-5">
            <h1 className="text-3xl font-black tracking-tight">
              {isRegister ? "Создай профиль" : "С возвращением"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isRegister
                ? "Сохраним прогресс, кристаллы и персональный финансовый путь."
                : "Войди, чтобы продолжить уровни и задания с того же места."}
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            {isRegister && (
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">Имя</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-12 rounded-2xl pl-10 font-semibold"
                    placeholder="Как тебя звать?"
                    autoComplete="name"
                  />
                </div>
              </label>
            )}

            <label className="space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 rounded-2xl pl-10 font-semibold"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground">Пароль</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-2xl pl-10 font-semibold"
                  placeholder="Минимум 6 символов"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength={6}
                  required
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
              className="mt-1 h-13 rounded-2xl text-base font-extrabold shadow-lg shadow-primary/20"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isRegister ? "Создать аккаунт" : "Войти"}
            </Button>
          </form>

          <button
            type="button"
            onClick={continueAsGuest}
            disabled={isLoading}
            className="mt-4 w-full rounded-2xl px-3 py-3 text-sm font-black text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-60"
          >
            Продолжить как гость
          </button>
        </div>
      </section>
    </main>
  );
}
