"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Mood } from "@/state/useAvatarStore";

type FinbroMascotProps = {
  mood?: Mood;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showShadow?: boolean;
};

const sizeClass = {
  sm: "w-10 h-10",
  md: "w-24 h-24",
  lg: "w-44 h-44",
  xl: "w-72 h-72",
};

const moodConfig = {
  idle: {
    eyeY: 75,
    pupilY: 75,
    mouth: "M123 137 Q138 149 153 137",
    browLeft: "M103 58 Q116 50 128 57",
    browRight: "M145 57 Q158 50 170 58",
    tilt: 0,
    bounce: -3,
    sparkle: false,
  },
  thinking: {
    eyeY: 74,
    pupilY: 70,
    mouth: "M128 139 Q138 143 148 139",
    browLeft: "M102 56 Q116 47 129 56",
    browRight: "M146 55 Q160 62 171 58",
    tilt: -3,
    bounce: -2,
    sparkle: false,
  },
  happy: {
    eyeY: 73,
    pupilY: 73,
    mouth: "M119 133 Q138 154 157 133",
    browLeft: "M103 59 Q116 52 129 58",
    browRight: "M145 58 Q158 52 171 59",
    tilt: 2,
    bounce: -6,
    sparkle: true,
  },
  celebrate: {
    eyeY: 71,
    pupilY: 71,
    mouth: "M116 130 Q138 158 160 130",
    browLeft: "M101 61 Q116 50 130 59",
    browRight: "M144 59 Q159 50 173 61",
    tilt: 5,
    bounce: -11,
    sparkle: true,
  },
  sad: {
    eyeY: 80,
    pupilY: 84,
    mouth: "M123 146 Q138 136 153 146",
    browLeft: "M103 58 Q116 66 129 59",
    browRight: "M145 59 Q158 66 171 58",
    tilt: -2,
    bounce: 1,
    sparkle: false,
  },
};

export function FinbroMascot({
  mood = "idle",
  size = "lg",
  className,
  showShadow = true,
}: FinbroMascotProps) {
  const config = moodConfig[mood];
  const duration = mood === "celebrate" ? 0.82 : 2.2;

  return (
    <div className={cn("relative flex items-center justify-center", sizeClass[size], className)}>
      {showShadow && (
        <motion.div
          className="absolute bottom-[7%] h-[10%] w-[64%] rounded-full bg-black/35 blur-md"
          animate={{ scaleX: mood === "celebrate" ? [1, 0.75, 1] : [1, 0.94, 1] }}
          transition={{ repeat: Infinity, duration, ease: "easeInOut" }}
        />
      )}

      <motion.svg
        viewBox="0 0 240 240"
        role="img"
        aria-label="ФИНБРО, маскот-скрепка"
        className="relative z-10 h-full w-full drop-shadow-2xl"
        animate={{ y: [0, config.bounce, 0], rotate: [0, config.tilt, 0] }}
        transition={{ repeat: Infinity, duration, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="finbroNote" x1="62" y1="69" x2="197" y2="184" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF8B8" />
            <stop offset="0.55" stopColor="#E8F48F" />
            <stop offset="1" stopColor="#BFE86D" />
          </linearGradient>
          <linearGradient id="finbroClip" x1="74" y1="30" x2="164" y2="174" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8ECFF" />
            <stop offset="0.38" stopColor="#7786D9" />
            <stop offset="1" stopColor="#4940A8" />
          </linearGradient>
          <linearGradient id="finbroEye" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#DDE8FF" />
          </linearGradient>
          <filter id="finbroSoftShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#020617" floodOpacity="0.28" />
          </filter>
        </defs>

        <g id="paper" filter="url(#finbroSoftShadow)">
          <path
            d="M64 82 L198 72 L168 184 L43 160 Z"
            fill="url(#finbroNote)"
            stroke="#8EAC39"
            strokeOpacity="0.45"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M87 99 L178 92" stroke="#9BA94F" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
          <path d="M81 115 L174 108" stroke="#9BA94F" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
          <path d="M76 131 L169 124" stroke="#9BA94F" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
          <path d="M70 147 L159 141" stroke="#9BA94F" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
          <path d="M52 158 L168 184 L158 195 L42 161 Z" fill="#8DBE3E" opacity="0.28" />
        </g>

        <motion.g
          id="clip"
          animate={{ rotate: mood === "thinking" ? [-2, 2, -2] : [0, 0, 0] }}
          transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut" }}
          style={{ transformOrigin: "117px 108px" }}
        >
          <path
            d="M100 43 C119 16 158 32 154 62 L141 158 C136 196 77 187 84 148 L96 79 C101 52 139 57 135 82 L124 148 C122 160 104 158 106 145 L116 83"
            fill="none"
            stroke="#2B276E"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.22"
          />
          <path
            d="M96 39 C116 12 155 28 151 59 L138 155 C133 193 74 184 81 145 L93 76 C98 49 136 54 132 79 L121 145 C119 157 101 155 103 142 L113 80"
            fill="none"
            stroke="url(#finbroClip)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M96 39 C116 12 155 28 151 59"
            fill="none"
            stroke="#F8FAFF"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.75"
          />
        </motion.g>

        <g id="face">
          <motion.path d={config.browLeft} stroke="#161A3A" strokeWidth="6" strokeLinecap="round" fill="none" />
          <motion.path d={config.browRight} stroke="#161A3A" strokeWidth="6" strokeLinecap="round" fill="none" />

          <ellipse cx="115" cy={config.eyeY} rx="18" ry="20" fill="url(#finbroEye)" stroke="#A8B3D8" strokeWidth="2" />
          <ellipse cx="157" cy={config.eyeY} rx="18" ry="20" fill="url(#finbroEye)" stroke="#A8B3D8" strokeWidth="2" />
          <circle cx="119" cy={config.pupilY} r="7" fill="#111827" />
          <circle cx="153" cy={config.pupilY} r="7" fill="#111827" />
          <circle cx="122" cy={config.pupilY - 3} r="2.5" fill="#FFFFFF" />
          <circle cx="156" cy={config.pupilY - 3} r="2.5" fill="#FFFFFF" />

          <path d={config.mouth} stroke="#17142E" strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>

        <g id="coin">
          <circle cx="61" cy="69" r="15" fill="#FFD166" stroke="#9C6A00" strokeOpacity="0.22" strokeWidth="3" />
          <path d="M61 60 V78 M54 66 H65 C71 66 71 74 65 74 H55" stroke="#7A4D00" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {config.sparkle && (
          <motion.g
            id="sparkles"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.86, 1.08, 0.86] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
          >
            <path d="M42 41 L48 54 L61 60 L48 66 L42 79 L36 66 L23 60 L36 54 Z" fill="#FFD166" />
            <path d="M191 34 L196 44 L207 49 L196 54 L191 65 L186 54 L175 49 L186 44 Z" fill="#A7F3D0" />
            <path d="M196 154 L201 164 L212 169 L201 174 L196 185 L191 174 L180 169 L191 164 Z" fill="#BFD7FF" />
          </motion.g>
        )}
      </motion.svg>
    </div>
  );
}
