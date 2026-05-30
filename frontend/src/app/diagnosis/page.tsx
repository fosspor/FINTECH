"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Target, ArrowRight, TrendingUp, Loader2, Wallet, ReceiptText, CreditCard, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type DiagnosisData = {
  main_problem: string;
  main_risk: string;
  first_recommendation: string;
};

type ProfileData = {
  monthly_income: number | null;
  mandatory_expenses: number | null;
  free_money: number | null;
  has_credit: boolean;
  debts?: Array<{
    type: string;
    amount: number | null;
    monthly_payment: number | null;
  }>;
  savings_months: number | null;
  main_goal: string | null;
  spending_leaks: string[];
  risk_zone: "green" | "yellow" | "red";
  missing_fields: string[];
};

const riskCopy = {
  green: {
    title: "Зелёная зона",
    text: "База выглядит спокойно, можно усиливать привычки и цели.",
  },
  yellow: {
    title: "Жёлтая зона",
    text: "Твои финансы требуют внимания, но ситуация под контролем.",
  },
  red: {
    title: "Красная зона",
    text: "Сначала снизим давление долгов и обязательных платежей.",
  },
};

const formatMoney = (value: number | null) =>
  typeof value === "number" ? `${new Intl.NumberFormat("ru-RU").format(value)} ₽` : "не указано";

export default function DiagnosisPage() {
  const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("finbro_diagnosis");
    const storedProfile = localStorage.getItem("finbro_profile");
    if (stored) {
      try {
        setDiagnosis(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse diagnosis", e);
      }
    } else {
      // Mock fallback if user navigates directly
      setDiagnosis({
        main_problem: "Отсутствие финансовой подушки",
        main_risk: "Жизнь от зарплаты до зарплаты",
        first_recommendation: "Начать отслеживать ежедневные расходы в течение недели"
      });
    }

    if (storedProfile) {
      try {
        setProfile(JSON.parse(storedProfile));
      } catch (e) {
        console.error("Failed to parse profile", e);
      }
    }
  }, []);

  if (!diagnosis) {
    return (
      <div className="flex-1 flex items-center justify-center h-[100dvh] bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const risk = riskCopy[profile?.risk_zone ?? "yellow"];

  return (
    <main className="flex-1 flex flex-col min-h-0 h-[100dvh] max-w-2xl mx-auto w-full bg-background relative overflow-y-auto">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-96 bg-warning/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="p-6 pt-16 flex flex-col gap-5 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="flex flex-col items-center text-center mb-6"
        >
          <div className="w-24 h-24 rounded-[2rem] bg-warning/20 border border-warning/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            <div className="w-14 h-14 rounded-2xl bg-warning flex items-center justify-center">
              <span className="text-warning-foreground font-black text-3xl">!</span>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">{risk.title}</h1>
          <p className="text-muted-foreground text-lg max-w-[280px]">{risk.text}</p>
        </motion.div>

        {profile && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring" }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-black">Профиль FinClip</h2>
                <p className="text-sm text-muted-foreground">Что уже понятно из разговора</p>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                {profile.risk_zone}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background/50 border border-white/10 p-3 min-h-[92px]">
                <Wallet className="w-5 h-5 text-success mb-2" />
                <p className="text-xs text-muted-foreground">Доход</p>
                <p className="text-base font-bold">{formatMoney(profile.monthly_income)}</p>
              </div>
              <div className="rounded-2xl bg-background/50 border border-white/10 p-3 min-h-[92px]">
                <ReceiptText className="w-5 h-5 text-warning mb-2" />
                <p className="text-xs text-muted-foreground">Обязательные траты</p>
                <p className="text-base font-bold">{formatMoney(profile.mandatory_expenses)}</p>
              </div>
              <div className="rounded-2xl bg-background/50 border border-white/10 p-3 min-h-[92px]">
                <TrendingUp className="w-5 h-5 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Свободные деньги</p>
                <p className="text-base font-bold">{formatMoney(profile.free_money)}</p>
              </div>
              <div className="rounded-2xl bg-background/50 border border-white/10 p-3 min-h-[92px]">
                <CreditCard className="w-5 h-5 text-destructive mb-2" />
                <p className="text-xs text-muted-foreground">Долги</p>
                <p className="text-base font-bold">{profile.has_credit ? "есть" : "не указаны"}</p>
              </div>
            </div>

            {(profile.main_goal || profile.spending_leaks.length > 0 || profile.missing_fields.length > 0) && (
              <div className="mt-4 space-y-3 text-sm">
                {profile.main_goal && (
                  <p>
                    <span className="text-muted-foreground">Цель:</span>{" "}
                    <span className="font-semibold">{profile.main_goal}</span>
                  </p>
                )}
                {profile.spending_leaks.length > 0 && (
                  <p>
                    <span className="text-muted-foreground">Утечки:</span>{" "}
                    <span className="font-semibold">{profile.spending_leaks.join(", ")}</span>
                  </p>
                )}
                {profile.missing_fields.length > 0 && (
                  <div className="flex items-start gap-2 rounded-2xl bg-warning/10 border border-warning/20 p-3">
                    <HelpCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <p>
                      <span className="text-warning font-semibold">Нужно уточнить:</span>{" "}
                      {profile.missing_fields.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.section>
        )}

        {/* Glass Cards */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex items-start gap-4 shadow-lg"
        >
          <div className="p-3 bg-success/20 border border-success/30 rounded-2xl text-success shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Сильная сторона</h3>
            <p className="text-[19px] font-bold text-foreground">Заинтересованность в улучшении</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex items-start gap-4 shadow-lg"
        >
          <div className="p-3 bg-destructive/20 border border-destructive/30 rounded-2xl text-destructive shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Главная проблема / риск</h3>
            <p className="text-[19px] font-bold text-foreground">{diagnosis.main_problem}<br/><span className="text-[15px] font-normal opacity-80 mt-1 block">{diagnosis.main_risk}</span></p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="bg-primary/10 backdrop-blur-xl border border-primary/20 rounded-3xl p-5 flex items-start gap-4 shadow-lg mt-2 relative overflow-hidden"
        >
          {/* Subtle shine effect inside the card */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-white/5 to-transparent pointer-events-none" />
          
          <div className="p-3 bg-primary/20 border border-primary/30 rounded-2xl text-primary shrink-0 relative z-10">
            <Target className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-primary/80 uppercase tracking-wider mb-1">Первая рекомендация</h3>
            <p className="text-[19px] font-bold text-primary-foreground">{diagnosis.first_recommendation}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 mb-6"
        >
          <Link href="/path" className="w-full block">
            <Button className="w-full h-16 rounded-2xl text-lg font-bold shadow-[0_10px_30px_rgba(124,92,255,0.3)] gap-2 hover:scale-[1.02] transition-transform">
              ✨ Построить мой путь
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
