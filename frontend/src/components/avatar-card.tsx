"use client";

import { useAvatarStore, Mood } from "@/state/useAvatarStore";
import { AvatarViewer } from "@/components/avatar-viewer";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Sparkles, Smile, Frown, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function AvatarCard() {
  const { level, xp, mood, setMood, achievements } = useAvatarStore();

  const handleMoodTest = (newMood: Mood) => {
    setMood(newMood);
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-[#0F1117] rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col">
      {/* 3D Viewer Area */}
      <div className="w-full h-[400px] relative bg-gradient-to-b from-transparent to-black/20">
        <AvatarViewer />
        
        {/* Mood Tags */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
          {mood === "idle" && <Smile className="w-4 h-4 text-emerald-400" />}
          {mood === "thinking" && <Brain className="w-4 h-4 text-purple-400" />}
          {mood === "happy" && <Sparkles className="w-4 h-4 text-amber-400" />}
          {mood === "celebrate" && <Star className="w-4 h-4 text-amber-400" />}
          {mood === "sad" && <Frown className="w-4 h-4 text-blue-400" />}
          <span className="text-xs font-semibold capitalize text-white">{mood}</span>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-6 bg-white/5 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">FinBro</h2>
            <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              Level {level} Assistant
            </p>
          </div>
          
          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-xl">🦉</span>
          </div>
        </div>

        {/* Level Progress */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-white/80">Experience</span>
            <span className="text-primary">{xp}%</span>
          </div>
          <Progress value={xp} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {100 - xp} XP to Level {level + 1}
          </p>
        </div>

        {/* Mood Tester (For Demonstration of Event System) */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Event Simulator</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => handleMoodTest("idle")}>Idle</Button>
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => handleMoodTest("thinking")}>Think</Button>
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => handleMoodTest("happy")}>Happy</Button>
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => handleMoodTest("celebrate")}>Win</Button>
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => handleMoodTest("sad")}>Sad</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
