"use client";

import { motion } from "framer-motion";
import { Sprout, Shield, PiggyBank, TrendingUp, Rocket, Flame, Gem, Check, Lock } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const LEVELS = [
  { id: 1, title: "Финансовая осознанность", icon: Sprout, status: "completed", color: "bg-success" },
  { id: 2, title: "Контроль расходов", icon: Shield, status: "current", color: "bg-primary" },
  { id: 3, title: "Первая подушка", icon: PiggyBank, status: "locked", color: "bg-muted" },
  { id: 4, title: "Устойчивость", icon: TrendingUp, status: "locked", color: "bg-muted" },
  { id: 5, title: "Свобода", icon: Rocket, status: "locked", color: "bg-muted" },
];

export default function PathPage() {
  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <h2 className="font-semibold text-xl">Мой путь</h2>
        <div className="flex gap-4">
          {/* Flame / Streak */}
          <div className="flex items-center gap-1.5 bg-warning/10 text-warning px-3 py-1.5 rounded-full font-bold text-sm border border-warning/20">
            <Flame className="w-4 h-4 fill-warning" />
            12
          </div>
          {/* Gem / Crystals */}
          <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-500 px-3 py-1.5 rounded-full font-bold text-sm border border-sky-500/20">
            <Gem className="w-4 h-4 fill-sky-500" />
            450
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center py-12 px-6 relative w-full overflow-x-hidden min-h-[800px]">
          {/* Connecting dashed line in the center */}
          <div className="absolute top-12 bottom-12 left-1/2 -translate-x-1/2 w-1 border-l-4 border-dashed border-border/40 z-0" />

          {LEVELS.map((level, index) => {
            const isEven = index % 2 === 0;
            const Icon = level.icon;
            const isCompleted = level.status === "completed";
            const isCurrent = level.status === "current";
            const isLocked = level.status === "locked";
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, type: "spring", stiffness: 200, damping: 20 }}
                key={level.id}
                className={cn(
                  "relative z-10 flex flex-col items-center mb-14 w-full",
                  isEven ? "pr-[30%]" : "pl-[30%]"
                )}
              >
                <Link href={isLocked ? "#" : `/level/${level.id}`}>
                  <div className="relative group cursor-pointer">
                    {/* Node Circle */}
                    <div 
                      className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center border-[4px] shadow-xl transition-transform duration-300 relative",
                        isCompleted && "bg-success border-success-foreground text-success-foreground shadow-success/30 hover:scale-105",
                        isCurrent && "bg-background border-primary text-primary shadow-primary/40 scale-110",
                        isLocked && "bg-muted border-border text-muted-foreground opacity-60 grayscale"
                      )}
                    >
                      {/* Checkmark badge for completed */}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-white text-success rounded-full flex items-center justify-center shadow-md">
                          <Check className="w-5 h-5 font-bold" />
                        </div>
                      )}
                      
                      {/* Lock badge for locked */}
                      {isLocked && (
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-muted text-muted-foreground border-2 border-background rounded-full flex items-center justify-center shadow-md">
                          <Lock className="w-4 h-4 font-bold" />
                        </div>
                      )}

                      {/* Current pulse effect */}
                      {isCurrent && (
                        <span className="absolute inset-0 rounded-full border-4 border-primary/50 animate-ping" />
                      )}

                      <Icon className={cn("w-10 h-10", isCompleted && "fill-white/20")} strokeWidth={isCompleted ? 2.5 : 2} />
                    </div>
                  </div>
                </Link>

                {/* Level Title Container */}
                <div className="mt-4 text-center">
                  <h3 className={cn(
                    "font-bold text-lg",
                    isLocked ? "text-muted-foreground" : "text-foreground",
                    isCurrent && "text-primary text-xl"
                  )}>
                    {level.title}
                  </h3>
                  {isCurrent && (
                    <span className="inline-block mt-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest border border-primary/20">
                      Текущий уровень
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </main>
  );
}
