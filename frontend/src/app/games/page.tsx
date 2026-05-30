"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gem, Play, ShoppingCart, TrafficCone, ShieldAlert, PiggyBank, Target, Zap, AlertCircle, Sprout, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart, TrafficCone, ShieldAlert, PiggyBank, Target, Zap, AlertCircle, Sprout
};

type GameData = {
  id: number;
  title: string;
  icon_name: string;
  color: string;
  reward: number;
  desc: string;
  icon?: React.ElementType;
};

export default function GamesPage() {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("finbro_games");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const mapped = parsed.map((g: GameData) => ({
          ...g,
          icon: ICON_MAP[g.icon_name] || ShoppingCart
        }));
        setGames(mapped);
      } catch(e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  if (games.length === 0) return (
     <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative items-center justify-center text-center p-6">
      <h2 className="text-xl font-bold mb-2">Игры еще не сгенерированы</h2>
      <p className="text-muted-foreground mb-6">Пройди опрос в чате, чтобы получить персональные мини-игры.</p>
      <Link href="/"><Button>Вернуться в чат</Button></Link>
     </main>
  );

  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative z-10 pb-20">
      <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <h2 className="font-semibold text-xl">Мини-игры</h2>
        <p className="text-sm text-muted-foreground mt-1">Учись финансам играючи и зарабатывай кристаллы</p>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 flex flex-col gap-5">
          {games.map((game, idx) => {
            const Icon = game.icon || ShoppingCart;
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                key={game.id}
                className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden group"
              >
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-20 ${game.color} pointer-events-none group-hover:opacity-40 transition-opacity`} />
                <div className="flex items-start gap-4 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl ${game.color.replace('bg-', 'bg-')}/20 flex items-center justify-center border border-white/10 shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg leading-tight mb-1">{game.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{game.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5 relative z-10">
                  <div className="flex items-center gap-1.5 font-bold text-sky-500">
                    <Gem className="w-4 h-4 fill-sky-500" /> До +{game.reward}
                  </div>
                  <Link href={`/games/${game.id}`}>
                    <Button className="rounded-full shadow-lg hover:scale-105 transition-transform gap-1.5 px-6">
                      <Play className="w-4 h-4" fill="currentColor" /> Играть
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </main>
  );
}
