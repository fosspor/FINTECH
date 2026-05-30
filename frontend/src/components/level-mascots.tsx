"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FinbroMascot } from "@/components/finbro-mascot";
import type { Mood } from "@/state/useAvatarStore";

export type LevelMascotId =
  | "finclip"
  | "anti_impulse"
  | "budget_calc"
  | "piggy"
  | "credit_light"
  | "checklist"
  | "invest_sprout"
  | "crystal_bro";

type LevelMascotProps = {
  mascot?: LevelMascotId;
  levelId?: number;
  title?: string;
  mood?: Mood;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  locked?: boolean;
};

const sizeClass = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-36 h-36",
  xl: "w-56 h-56",
};

const levelMascots: LevelMascotId[] = [
  "finclip",
  "anti_impulse",
  "budget_calc",
  "piggy",
  "credit_light",
  "checklist",
  "invest_sprout",
  "crystal_bro",
];

const topicRules: Array<{ test: RegExp; mascot: LevelMascotId }> = [
  { test: /импульс|покуп|трат|утеч|подпис/i, mascot: "anti_impulse" },
  { test: /бюдж|расход|доход|категор|план/i, mascot: "budget_calc" },
  { test: /подуш|накоп|сбереж|резерв/i, mascot: "piggy" },
  { test: /кредит|долг|карт|займ/i, mascot: "credit_light" },
  { test: /цель|чек|план|шаг/i, mascot: "checklist" },
  { test: /инвест|рост|капитал|рын/i, mascot: "invest_sprout" },
  { test: /streak|привыч|награ|кристалл|серия/i, mascot: "crystal_bro" },
];

export function getLevelMascot(levelId?: number, title = ""): LevelMascotId {
  const matched = topicRules.find((rule) => rule.test.test(title));
  if (matched) return matched.mascot;

  if (!levelId || Number.isNaN(levelId)) return "finclip";
  return levelMascots[(levelId - 1) % levelMascots.length];
}

export function LevelMascot({
  mascot,
  levelId,
  title,
  mood = "idle",
  size = "lg",
  className,
  locked = false,
}: LevelMascotProps) {
  const resolved = mascot ?? getLevelMascot(levelId, title);

  return (
    <div className={cn("relative flex items-center justify-center", sizeClass[size], locked && "grayscale opacity-55", className)}>
      {resolved === "finclip" && <FinbroMascot mood={mood} size={size === "xl" ? "lg" : "md"} showShadow={false} />}
      {resolved === "anti_impulse" && <ShieldMascot mood={mood} />}
      {resolved === "budget_calc" && <CalculatorMascot mood={mood} />}
      {resolved === "piggy" && <PiggyMascot mood={mood} />}
      {resolved === "credit_light" && <TrafficMascot mood={mood} />}
      {resolved === "checklist" && <ChecklistMascot mood={mood} />}
      {resolved === "invest_sprout" && <SproutMascot mood={mood} />}
      {resolved === "crystal_bro" && <CrystalMascot mood={mood} />}
    </div>
  );
}

function MascotShell({
  children,
  mood,
  label,
}: {
  children: ReactNode;
  mood: Mood;
  label: string;
}) {
  const bounce = mood === "celebrate" ? -10 : mood === "happy" ? -5 : -2;

  return (
    <motion.svg
      viewBox="0 0 160 160"
      role="img"
      aria-label={label}
      className="h-full w-full drop-shadow-2xl"
      animate={{ y: [0, bounce, 0], rotate: mood === "thinking" ? [-1.5, 1.5, -1.5] : [0, 0, 0] }}
      transition={{ repeat: Infinity, duration: mood === "celebrate" ? 0.9 : 2.2, ease: "easeInOut" }}
    >
      {children}
    </motion.svg>
  );
}

function Face({ mood = "idle", cx = 80, cy = 78 }: { mood?: Mood; cx?: number; cy?: number }) {
  const happy = mood === "happy" || mood === "celebrate";
  const sad = mood === "sad";
  const thinking = mood === "thinking";
  const eyeY = cy + (sad ? 4 : happy ? -2 : 0);
  const pupilY = eyeY + (sad ? 3 : thinking ? -4 : 0);
  const mouth = sad
    ? `M${cx - 13} ${cy + 31} Q${cx} ${cy + 22} ${cx + 13} ${cy + 31}`
    : happy
      ? `M${cx - 17} ${cy + 25} Q${cx} ${cy + 43} ${cx + 17} ${cy + 25}`
      : `M${cx - 13} ${cy + 29} Q${cx} ${cy + 36} ${cx + 13} ${cy + 29}`;

  return (
    <g>
      <ellipse cx={cx - 17} cy={eyeY} rx="11" ry="13" fill="#fff" stroke="#111827" strokeOpacity="0.18" strokeWidth="2" />
      <ellipse cx={cx + 17} cy={eyeY} rx="11" ry="13" fill="#fff" stroke="#111827" strokeOpacity="0.18" strokeWidth="2" />
      <circle cx={cx - 14} cy={pupilY} r="4.5" fill="#111827" />
      <circle cx={cx + 14} cy={pupilY} r="4.5" fill="#111827" />
      <path d={mouth} stroke="#111827" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    </g>
  );
}

function ShieldMascot({ mood }: { mood: Mood }) {
  return (
    <MascotShell mood={mood} label="Anti-Impulse shield mascot">
      <path d="M80 18 L126 34 V73 C126 105 106 130 80 143 C54 130 34 105 34 73 V34 Z" fill="#22C55E" />
      <path d="M80 30 L113 42 V73 C113 96 99 115 80 126 C61 115 47 96 47 73 V42 Z" fill="#BFF8EA" opacity="0.9" />
      <path d="M57 91 L73 107 L106 57" stroke="#0F5132" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Face mood={mood} cy={62} />
    </MascotShell>
  );
}

function CalculatorMascot({ mood }: { mood: Mood }) {
  return (
    <MascotShell mood={mood} label="Budget calculator mascot">
      <rect x="36" y="24" width="88" height="112" rx="20" fill="#37A7FF" />
      <rect x="50" y="40" width="60" height="28" rx="10" fill="#D8F7FF" />
      <Face mood={mood} cy={52} />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <motion.circle
            key={`${row}-${col}`}
            cx={58 + col * 22}
            cy={88 + row * 17}
            r="6"
            fill={row === 2 && col === 2 ? "#FFD166" : "#EAF6FF"}
            animate={{ scale: mood === "thinking" ? [1, 0.78, 1] : 1 }}
            transition={{ repeat: Infinity, delay: (row + col) * 0.08, duration: 0.7 }}
          />
        ))
      )}
    </MascotShell>
  );
}

function PiggyMascot({ mood }: { mood: Mood }) {
  return (
    <MascotShell mood={mood} label="Savings piggy mascot">
      <motion.g animate={{ rotate: mood === "celebrate" ? [0, -8, 8, 0] : 0 }} transition={{ repeat: Infinity, duration: 1.2 }}>
        <circle cx="80" cy="82" r="45" fill="#FF9EC7" />
        <circle cx="45" cy="73" r="15" fill="#FF9EC7" />
        <path d="M55 39 L67 56 L48 58 Z" fill="#F57FAF" />
        <path d="M105 39 L93 56 L112 58 Z" fill="#F57FAF" />
        <rect x="65" y="37" width="31" height="7" rx="4" fill="#7A3E58" opacity="0.55" />
        <Face mood={mood} cy={68} />
        <circle cx="44" cy="74" r="4" fill="#7A3E58" />
        <circle cx="51" cy="80" r="4" fill="#7A3E58" />
      </motion.g>
      <motion.circle
        cx="80"
        cy="22"
        r="13"
        fill="#FFD166"
        animate={{ y: mood === "celebrate" || mood === "happy" ? [0, 12, 0] : 0 }}
        transition={{ repeat: Infinity, duration: 1.1 }}
      />
    </MascotShell>
  );
}

function TrafficMascot({ mood }: { mood: Mood }) {
  const active = mood === "sad" ? 0 : mood === "thinking" ? 1 : 2;
  const colors = ["#EF4444", "#F59E0B", "#22C55E"];

  return (
    <MascotShell mood={mood} label="Credit traffic light mascot">
      <rect x="48" y="16" width="64" height="126" rx="22" fill="#1F2937" />
      {colors.map((color, index) => (
        <motion.circle
          key={color}
          cx="80"
          cy={43 + index * 36}
          r="16"
          fill={color}
          opacity={active === index ? 1 : 0.25}
          animate={{ scale: active === index ? [1, 1.08, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      ))}
      <Face mood={mood} cy={60} />
    </MascotShell>
  );
}

function ChecklistMascot({ mood }: { mood: Mood }) {
  return (
    <MascotShell mood={mood} label="Checklist mascot">
      <path d="M45 24 H108 L124 43 V132 H45 Z" fill="#F8FAFC" />
      <path d="M108 24 V44 H124" fill="#CBD5E1" />
      <Face mood={mood} cy={55} />
      {[0, 1, 2].map((row) => (
        <g key={row}>
          <path d={`M55 ${91 + row * 15} L61 ${97 + row * 15} L72 ${84 + row * 15}`} stroke="#22C55E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M80 ${91 + row * 15} H110`} stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
    </MascotShell>
  );
}

function SproutMascot({ mood }: { mood: Mood }) {
  return (
    <MascotShell mood={mood} label="Investment sprout mascot">
      <path d="M80 139 C102 126 115 105 108 86 C102 69 89 63 80 62 C71 63 58 69 52 86 C45 105 58 126 80 139 Z" fill="#A7F3D0" />
      <path d="M80 66 C64 42 43 44 31 57 C50 70 66 72 80 66 Z" fill="#22C55E" />
      <path d="M80 66 C98 39 121 44 132 57 C112 72 95 73 80 66 Z" fill="#16A34A" />
      <path d="M80 66 V113" stroke="#15803D" strokeWidth="7" strokeLinecap="round" />
      <path d="M56 111 C68 103 79 101 92 90 C103 81 112 71 124 64" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" fill="none" />
      <Face mood={mood} cy={84} />
    </MascotShell>
  );
}

function CrystalMascot({ mood }: { mood: Mood }) {
  return (
    <MascotShell mood={mood} label="Reward crystal mascot">
      <motion.g animate={{ rotate: mood === "celebrate" ? [0, 8, -8, 0] : [0, 2, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>
        <path d="M80 16 L121 50 L107 122 L80 146 L53 122 L39 50 Z" fill="#7C5CFF" />
        <path d="M80 16 L80 146 L53 122 L39 50 Z" fill="#37A7FF" opacity="0.78" />
        <path d="M80 16 L121 50 L80 62 L39 50 Z" fill="#BFF8EA" opacity="0.8" />
        <Face mood={mood} cy={69} />
      </motion.g>
    </MascotShell>
  );
}
