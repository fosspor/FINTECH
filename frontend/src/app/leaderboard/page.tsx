"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, ChevronUp, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { apiUrl, authFetch } from "@/lib/api";

type Player = {
  name: string;
  score: number;
  streak: number;
  avatar: string;
  isMe?: boolean;
  rank?: number;
  trend?: "up" | "down" | "same";
};

const BASE_PLAYERS: Player[] = [
  { name: "Александр В.", score: 12500, streak: 45, avatar: "👨🏻‍💻" },
  { name: "Мария К.",     score: 11200, streak: 30, avatar: "👩🏼‍🎨" },
  { name: "Дмитрий С.",   score: 9500,  streak: 8,  avatar: "🧔🏽‍♂️" },
  { name: "Елена П.",     score: 8900,  streak: 21, avatar: "👩🏻‍💼" },
  { name: "Игорь Т.",     score: 8100,  streak: 5,  avatar: "👨🏻‍🚀" },
  { name: "Сергей Л.",    score: 7800,  streak: 11, avatar: "🧑🏼‍🔧" },
  { name: "Анна Р.",      score: 7300,  streak: 6,  avatar: "��‍🍳" },
  { name: "Павел Д.",     score: 6800,  streak: 2,  avatar: "👨🏻‍🔬" },
  { name: "Юлия Н.",      score: 6400,  streak: 4,  avatar: "👩�‍�" },
];

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const prevRankRef = useRef<number | null>(null);

  // Initial paint: place me at rank 3 visually, then update with real crystals
  useEffect(() => {
    const baseline = [...BASE_PLAYERS];
    const sorted = [...baseline].sort((a, b) => b.score - a.score);
    const s2 = sorted[1]?.score ?? 10000;
    const s3 = sorted[2]?.score ?? 9000;
    const targetForThird = Math.max(s3 + 1, s2 - 1);
    const me: Player = { name: "Вы", score: targetForThird, streak: 12, avatar: "🦉", isMe: true };
    const initial = computeRanks([me, ...baseline]);
    const myInitial = initial.find((p) => p.isMe)?.rank ?? null;
    prevRankRef.current = myInitial;
    setPlayers(initial);
    void refreshMyCrystals();
    const id = setInterval(refreshMyCrystals, 10000);
    return () => clearInterval(id);
  }, []);

  async function refreshMyCrystals() {
    try {
      const res = await authFetch(apiUrl("/users/me"));
      if (!res.ok) return;
      const user = await res.json();
      const crystals = user?.currency?.crystals ?? 0;
      setPlayers(() => {
        const baseOthers = BASE_PLAYERS.map((p) => ({ ...p }));
        const adjustedOthers = adjustOthersForThird(baseOthers, crystals);
        const me: Player = { name: "Вы", score: crystals, streak: user?.streak?.current_streak ?? 0, avatar: "🦉", isMe: true };
        const next = computeRanks([me, ...adjustedOthers]);
        const newRank = next.find((p) => p.isMe)?.rank ?? null;
        const prev = prevRankRef.current;
        prevRankRef.current = newRank ?? prev;
        // mark trend for me only
        return next.map((p) => {
          if (!p.isMe) return { ...p, trend: "same" as const };
          if (prev == null || newRank == null || prev === newRank) return { ...p, trend: "same" as const };
          return { ...p, trend: newRank < prev ? ("up" as const) : ("down" as const) };
        });
      });
    } catch {}
  }

  const top3 = useMemo(() => players.slice(0, 3), [players]);

  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative z-10">
      <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex flex-col gap-2">
        <h2 className="font-semibold text-xl flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" /> Рейтинг
        </h2>
        <p className="text-sm text-muted-foreground">Турнир Лиги Сбережений заканчивается через 2 дня.</p>
      </header>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 pb-8">
          {/* Podium for Top 3 */}
          {top3.length === 3 && (
            <div className="flex items-end justify-center gap-2 mb-10 mt-4 h-48 px-2">
              {/* Rank 2 */}
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center w-1/3 z-10">
                <div className="text-2xl mb-2">{top3[1].avatar}</div>
                <div className="text-xs font-bold text-muted-foreground mb-2 truncate max-w-full px-1">{top3[1].name}</div>
                <div className="w-full bg-gradient-to-t from-secondary/40 to-secondary/10 border border-secondary/20 rounded-t-xl h-24 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl font-black text-secondary/80">2</span>
                </div>
              </motion.div>
              
              {/* Rank 1 */}
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center w-1/3 z-20">
                <div className="absolute -top-6 text-warning animate-bounce">👑</div>
                <div className="text-3xl mb-2">{top3[0].avatar}</div>
                <div className="text-xs font-bold text-warning mb-2 truncate max-w-full px-1">{top3[0].name}</div>
                <div className="w-full bg-gradient-to-t from-warning/40 to-warning/10 border border-warning/30 rounded-t-xl h-32 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)] backdrop-blur-sm">
                  <span className="text-4xl font-black text-warning">1</span>
                </div>
              </motion.div>
              
              {/* Rank 3 */}
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center w-1/3 z-10">
                <div className="text-2xl mb-2">{top3[2].avatar}</div>
                <div className="text-xs font-bold text-primary mb-2 truncate max-w-full px-1">{top3[2].name}</div>
                <div className="w-full bg-gradient-to-t from-primary/40 to-primary/10 border border-primary/20 rounded-t-xl h-20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl font-black text-primary/80">3</span>
                </div>
              </motion.div>
            </div>
          )}

          {/* List */}
          <div className="flex flex-col gap-3">
            {players.map((user, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                key={`${user.name}-${user.rank}`}
                className={`flex items-center gap-4 p-4 rounded-2xl border ${
                  user.isMe ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10" : "bg-white/5 border-white/10"
                }`}
              >
                <div className="w-6 text-center font-bold text-muted-foreground">{user.rank}</div>
                
                <Avatar className="w-10 h-10 border border-white/10 bg-white/5 items-center justify-center">
                  <span className="text-xl">{user.avatar}</span>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className={`font-bold truncate ${user.isMe ? "text-primary" : "text-foreground"}`}>
                    {user.name}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Flame className="w-3 h-3 fill-warning text-warning" /> {user.streak} дней
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div className="font-bold text-[17px]">{user.score.toLocaleString('ru-RU')}</div>
                  {user.isMe ? (
                    user.trend === "up" ? <ChevronUp className="w-4 h-4 text-success" /> : user.trend === "down" ? <ChevronDown className="w-4 h-4 text-destructive" /> : <div className="w-4 h-4 flex items-center justify-center text-muted-foreground">-</div>
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </main>
  );
}

function computeRanks(players: Player[]): Player[] {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
}

function adjustOthersForThird(others: Player[], myScore: number): Player[] {
  // Keep realistic ordering while ensuring myScore lands at position 3 when compared to others
  // Strategy: ensure there are at least two players strictly above myScore and the rest at or below.
  const sorted = [...others].sort((a, b) => b.score - a.score);
  // If there are fewer than 2 players strictly above myScore, nudge the top scores up a bit above myScore
  let above = sorted.filter((p) => p.score > myScore).length;
  const res = sorted.map((p) => ({ ...p }));
  if (above < 2) {
    for (let i = 0; i < res.length && above < 2; i++) {
      if (res[i].score <= myScore) {
        res[i].score = myScore + (2 - above); // ensure > myScore, minimal bump
        above++;
      }
    }
  }
  // Make sure no one equals myScore exactly to avoid tie issues affecting rank placement
  for (let i = 0; i < res.length; i++) {
    if (res[i].score === myScore) res[i].score = myScore - 1;
  }
  return res;
}
