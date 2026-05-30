"use client";

import { Brain, Frown, Smile, Sparkles, Star, Trophy } from "lucide-react";
import type { ElementType } from "react";
import { Button } from "@/components/ui/button";
import { FinbroMascot } from "@/components/finbro-mascot";
import { Mood, useAvatarStore } from "@/state/useAvatarStore";

const moods: Array<{ mood: Mood; label: string; icon: ElementType }> = [
  { mood: "idle", label: "Idle", icon: Smile },
  { mood: "thinking", label: "Think", icon: Brain },
  { mood: "happy", label: "Happy", icon: Sparkles },
  { mood: "celebrate", label: "Win", icon: Star },
  { mood: "sad", label: "Sad", icon: Frown },
];

export function AvatarCard() {
  const { level, xp, mood, setMood } = useAvatarStore();

  return (
    <div className="w-full max-w-sm mx-auto rounded-3xl border border-white/10 bg-white/5 shadow-2xl relative overflow-hidden flex flex-col">
      <div className="relative flex h-[360px] items-center justify-center bg-[radial-gradient(circle_at_50%_25%,rgba(48,213,200,0.22),transparent_62%)]">
        <FinbroMascot mood={mood} size="xl" />
      </div>

      <div className="border-t border-white/10 bg-background/70 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">FinBro</h2>
            <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
              <Trophy className="w-4 h-4 text-warning" />
              Level {level} Mentor
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Experience</span>
            <span className="text-primary">{xp}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-[#30D5C8] via-[#37A7FF] to-primary" style={{ width: `${xp}%` }} />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Mood simulator</p>
          <div className="flex flex-wrap gap-2">
            {moods.map((item) => {
              const Icon = item.icon;
              return (
                <Button key={item.mood} size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setMood(item.mood)}>
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
