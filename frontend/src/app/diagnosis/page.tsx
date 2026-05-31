"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Loader2,
  ReceiptText,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    label: "Стабильно",
    text: "База выглядит спокойно. Можно усиливать привычки, цель и регулярность.",
    className: "from-success/30 via-success/10 to-transparent border-success/25 text-success",
  },
  yellow: {
    title: "Жёлтая зона",
    label: "Нужен фокус",
    text: "Финансы требуют внимания, но ситуацию можно быстро взять под контроль.",
    className: "from-warning/30 via-warning/10 to-transparent border-warning/25 text-warning",
  },
  red: {
    title: "Красная зона",
    label: "Сначала разгрузка",
    text: "Первым шагом снижаем давление долгов, обязательных платежей и хаоса в расходах.",
    className: "from-destructive/30 via-destructive/10 to-transparent border-destructive/25 text-destructive",
  },
} as const;

const formatMoney = (value: number | null) =>
  typeof value === "number" ? `${new Intl.NumberFormat("ru-RU").format(value)} ₽` : "не указано";

function normalizeDiagnosis(value: Partial<DiagnosisData> | null): DiagnosisData {
  return {
    main_problem: value?.main_problem || "Нужно уточнить главную финансовую проблему",
    main_risk: value?.main_risk || "Без плана расходы могут снова стать непрозрачными",
    first_recommendation: value?.first_recommendation || "Начни с короткой карты доходов, расходов и долгов",
  };
}

function normalizeProfile(value: Partial<ProfileData> | null): ProfileData | null {
  if (!value) return null;
  const riskZone = value.risk_zone === "green" || value.risk_zone === "red" ? value.risk_zone : "yellow";

  return {
    monthly_income: typeof value.monthly_income === "number" ? value.monthly_income : null,
    mandatory_expenses: typeof value.mandatory_expenses === "number" ? value.mandatory_expenses : null,
    free_money: typeof value.free_money === "number" ? value.free_money : null,
    has_credit: Boolean(value.has_credit),
    debts: Array.isArray(value.debts) ? value.debts : [],
    savings_months: typeof value.savings_months === "number" ? value.savings_months : null,
    main_goal: typeof value.main_goal === "string" ? value.main_goal : null,
    spending_leaks: Array.isArray(value.spending_leaks) ? value.spending_leaks : [],
    risk_zone: riskZone,
    missing_fields: Array.isArray(value.missing_fields) ? value.missing_fields : [],
  };
}

export default function DiagnosisPage() {
  const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const storedDiagnosis = localStorage.getItem("finbro_diagnosis");
    const storedProfile = localStorage.getItem("finbro_profile");

    try {
      setDiagnosis(normalizeDiagnosis(storedDiagnosis ? JSON.parse(storedDiagnosis) : null));
    } catch (error) {
      console.error("Failed to parse diagnosis", error);
      localStorage.removeItem("finbro_diagnosis");
      setDiagnosis(normalizeDiagnosis(null));
    }

    if (storedProfile) {
      try {
        setProfile(normalizeProfile(JSON.parse(storedProfile)));
      } catch (error) {
        console.error("Failed to parse profile", error);
        localStorage.removeItem("finbro_profile");
      }
    }
  }, []);

  const risk = riskCopy[profile?.risk_zone ?? "yellow"];
  const filledFields = useMemo(() => {
    if (!profile) return 0;
    return [
      profile.monthly_income,
      profile.mandatory_expenses,
      profile.free_money,
      profile.main_goal,
      profile.savings_months,
    ].filter((value) => value !== null && value !== "").length;
  }, [profile]);

  if (!diagnosis) {
    return (
      <div className="flex h-[100dvh] flex-1 items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="relative mx-auto flex h-[100dvh] w-full max-w-2xl flex-1 flex-col overflow-y-auto bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(124,92,255,0.22),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-44 h-72 bg-[radial-gradient(circle_at_20%_20%,rgba(48,213,200,0.18),transparent_68%)]" />

      <section className="relative z-10 flex flex-col gap-5 px-5 pb-28 pt-7">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("overflow-hidden rounded-[2rem] border bg-gradient-to-br p-5 shadow-2xl", risk.className)}
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Финансовая аналитика
            </div>
            <span className="rounded-full bg-background/70 px-3 py-1 text-xs font-black">{risk.label}</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-background/70 shadow-xl">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black leading-none tracking-tight">{risk.title}</h1>
              <p className="mt-3 text-base font-semibold leading-relaxed text-muted-foreground">{risk.text}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={Wallet} label="Доход" value={formatMoney(profile?.monthly_income ?? null)} tone="success" />
          <MetricCard icon={ReceiptText} label="Обязательные траты" value={formatMoney(profile?.mandatory_expenses ?? null)} tone="warning" />
          <MetricCard icon={TrendingUp} label="Свободные деньги" value={formatMoney(profile?.free_money ?? null)} tone="primary" />
          <MetricCard icon={CreditCard} label="Долги" value={profile?.has_credit ? "есть" : "не указаны"} tone="destructive" />
        </div>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Портрет денег</h2>
              <p className="text-sm text-muted-foreground">Что AI понял из разговора</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-3 py-2 text-center">
              <p className="text-xs font-bold text-primary">данных</p>
              <p className="text-lg font-black">{filledFields}/5</p>
            </div>
          </div>

          <Insight icon={AlertCircle} title="Главная проблема" text={diagnosis.main_problem} />
          <Insight icon={ShieldAlert} title="Главный риск" text={diagnosis.main_risk} />
          <Insight icon={Target} title="Первый шаг" text={diagnosis.first_recommendation} highlight />
        </motion.section>

        {(profile?.main_goal || profile?.spending_leaks.length || profile?.missing_fields.length) && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="rounded-[2rem] border border-white/10 bg-background/70 p-5"
          >
            <h2 className="mb-4 text-xl font-black">Детали профиля</h2>
            <div className="space-y-3">
              {profile?.main_goal && <ChipLine title="Цель" value={profile.main_goal} />}
              {!!profile?.spending_leaks.length && <ChipLine title="Утечки" value={profile.spending_leaks.join(", ")} />}
              {!!profile?.missing_fields.length && (
                <div className="flex gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-3 text-sm">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p>
                    <span className="font-black text-warning">Уточнить:</span> {profile.missing_fields.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        )}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Link href="/path" className="block">
            <Button className="h-16 w-full rounded-3xl text-lg font-black shadow-xl shadow-primary/20">
              Открыть мой путь
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: "success" | "warning" | "primary" | "destructive";
}) {
  const toneClass = {
    success: "text-success bg-success/10 border-success/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    primary: "text-primary bg-primary/10 border-primary/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-4"
    >
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border", toneClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-black">{value}</p>
    </motion.div>
  );
}

function Insight({
  icon: Icon,
  title,
  text,
  highlight = false,
}: {
  icon: typeof AlertCircle;
  title: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("mb-3 flex gap-3 rounded-2xl border p-4 last:mb-0", highlight ? "border-primary/25 bg-primary/10" : "border-white/10 bg-background/60")}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", highlight ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground")}>
        {highlight ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
        <p className="mt-1 text-base font-bold leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function ChipLine({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
