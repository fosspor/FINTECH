"use client";

import { motion } from "framer-motion";
import { Trophy, Flame, ChevronUp, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";

const LEADERBOARD = [
  { rank: 1, name: "Александр В.", score: 12500, streak: 45, trend: "up", avatar: "👨🏻‍💻" },
  { rank: 2, name: "Мария К.", score: 11200, streak: 30, trend: "same", avatar: "👩🏼‍🎨" },
  { rank: 3, name: "Вы", score: 9800, streak: 12, trend: "up", avatar: "🦉", isMe: true },
  { rank: 4, name: "Дмитрий С.", score: 9500, streak: 8, trend: "down", avatar: "🧔🏽‍♂️" },
  { rank: 5, name: "Елена П.", score: 8900, streak: 21, trend: "up", avatar: "👩🏻‍💼" },
  { rank: 6, name: "Игорь Т.", score: 8100, streak: 5, trend: "down", avatar: "👨🏻‍🚀" },
];

export default function LeaderboardPage() {
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
          <div className="flex items-end justify-center gap-2 mb-10 mt-4 h-48 px-2">
            {/* Rank 2 */}
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center w-1/3 z-10">
              <div className="text-2xl mb-2">{LEADERBOARD[1].avatar}</div>
              <div className="text-xs font-bold text-muted-foreground mb-2 truncate max-w-full px-1">{LEADERBOARD[1].name}</div>
              <div className="w-full bg-gradient-to-t from-secondary/40 to-secondary/10 border border-secondary/20 rounded-t-xl h-24 flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl font-black text-secondary/80">2</span>
              </div>
            </motion.div>
            
            {/* Rank 1 */}
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center w-1/3 z-20">
              <div className="absolute -top-6 text-warning animate-bounce">👑</div>
              <div className="text-3xl mb-2">{LEADERBOARD[0].avatar}</div>
              <div className="text-xs font-bold text-warning mb-2 truncate max-w-full px-1">{LEADERBOARD[0].name}</div>
              <div className="w-full bg-gradient-to-t from-warning/40 to-warning/10 border border-warning/30 rounded-t-xl h-32 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)] backdrop-blur-sm">
                <span className="text-4xl font-black text-warning">1</span>
              </div>
            </motion.div>
            
            {/* Rank 3 */}
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center w-1/3 z-10">
              <div className="text-2xl mb-2">{LEADERBOARD[2].avatar}</div>
              <div className="text-xs font-bold text-primary mb-2 truncate max-w-full px-1">{LEADERBOARD[2].name}</div>
              <div className="w-full bg-gradient-to-t from-primary/40 to-primary/10 border border-primary/20 rounded-t-xl h-20 flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl font-black text-primary/80">3</span>
              </div>
            </motion.div>
          </div>

          {/* List */}
          <div className="flex flex-col gap-3">
            {LEADERBOARD.map((user, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                key={user.rank}
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
                  {user.trend === "up" && <ChevronUp className="w-4 h-4 text-success" />}
                  {user.trend === "down" && <ChevronDown className="w-4 h-4 text-destructive" />}
                  {user.trend === "same" && <div className="w-4 h-4 flex items-center justify-center text-muted-foreground">-</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </main>
  );
}
