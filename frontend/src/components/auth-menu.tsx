"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, Sparkles, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  logoutUser,
  onAuthChange,
  readAuth,
  type UserMe,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuthMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [auth, setAuth] = useState(() => readAuth());
  const [user, setUser] = useState<UserMe | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isHidden = pathname === "/welcome" || pathname === "/auth" || pathname === "/onboarding";

  useEffect(() => {
    const syncAuth = () => setAuth(readAuth());
    syncAuth();
    return onAuthChange(syncAuth);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!auth) {
        setUser(null);
        return;
      }

      try {
        const nextUser = await getCurrentUser();
        if (!cancelled) setUser(nextUser);
      } catch {
        if (!cancelled) setUser(null);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [auth]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const label = useMemo(() => {
    if (!auth) return "Войти";
    if (auth.is_guest) return "Гость";
    return user?.email?.split("@")[0] || auth.email.split("@")[0] || "Профиль";
  }, [auth, user]);

  if (isHidden) return null;

  if (!auth) {
    return (
      <div className="pointer-events-auto fixed right-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-50">
        <Link href="/auth">
          <Button className="h-10 rounded-full px-4 font-extrabold shadow-lg shadow-primary/20">
            <LogIn className="h-4 w-4" />
            Войти
          </Button>
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    setIsLoading(true);
    await logoutUser();
    setIsLoading(false);
    setIsOpen(false);
    router.push("/auth");
  };

  return (
    <div className="pointer-events-auto fixed right-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-50">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={cn(
          "flex h-11 max-w-[170px] items-center gap-2 rounded-full border border-white/10 bg-background/88 px-2.5 text-left shadow-xl shadow-black/20 backdrop-blur-xl transition hover:bg-muted",
          isOpen && "border-primary/35"
        )}
        aria-label="Открыть меню профиля"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserRound className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-black leading-4">{label}</span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-warning">
            <Sparkles className="h-3 w-3" />
            {user?.currency.crystals ?? 0}
          </span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-3xl border border-white/10 bg-background/96 p-3 shadow-2xl shadow-black/35 backdrop-blur-2xl">
          <div className="border-b border-white/10 px-2 pb-3">
            <p className="truncate text-sm font-black">
              {auth.is_guest ? "Гостевой профиль" : user?.email || auth.email}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {auth.is_guest
                ? "Создай аккаунт, чтобы не потерять прогресс."
                : `Streak: ${user?.streak.current_streak ?? 0} дней`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 py-3">
            <div className="rounded-2xl bg-muted px-3 py-2">
              <p className="text-[11px] font-bold text-muted-foreground">Кристаллы</p>
              <p className="text-lg font-black text-warning">{user?.currency.crystals ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-muted px-3 py-2">
              <p className="text-[11px] font-bold text-muted-foreground">Серия</p>
              <p className="text-lg font-black text-success">{user?.streak.current_streak ?? 0}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {auth.is_guest && (
              <Link href="/auth" className="block">
                <Button className="h-11 w-full rounded-2xl font-extrabold">
                  <LogIn className="h-4 w-4" />
                  Создать аккаунт
                </Button>
              </Link>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              disabled={isLoading}
              className="h-11 w-full rounded-2xl font-extrabold"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
