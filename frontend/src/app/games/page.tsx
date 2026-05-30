"use client";

import { motion } from "framer-motion";
import { Gem, Play, ShoppingCart, TrafficCone, ShieldAlert, PiggyBank } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const GAMES = [
  { id: 1, title: "Импульсивная покупка", icon: ShoppingCart, color: "bg-primary", reward: 20, desc: "Отличи реальную потребность от навязанной маркетологами." },
  { id: 2, title: "Кредитный светофор", icon: TrafficCone, color: "bg-warning", reward: 30, desc: "Оцени выгодность кредита за 10 секунд по 3 параметрам." },
  { id: 3, title: "Найди утечку", icon: ShieldAlert, color: "bg-destructive", reward: 25, desc: "Проанализируй выписку и найди скрытые подписки." },
  { id: 4, title: "Собери подушку", icon: PiggyBank, color: "bg-success", reward: 50, desc: "Распредели бюджет так, чтобы отложить 10%." },
];

export default function GamesPage() {
  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative z-10 pb-20">
      <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <h2 className="font-semibold text-xl">Мини-игры</h2>
        <p className="text-sm text-muted-foreground mt-1">Учись финансам играючи и зарабатывай кристаллы</p>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 flex flex-col gap-5">
          {GAMES.map((game, idx) => {
            const Icon = game.icon;
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                key={game.id}
                className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden group"
              >
                {/* Glow effect */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-20 ${game.color} pointer-events-none group-hover:opacity-40 transition-opacity`} />
                
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${game.color}/20 flex items-center justify-center border border-${game.color}/30 shrink-0`}>
                    <Icon className={`w-7 h-7 text-${game.color.replace('bg-', '')}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg leading-tight mb-1">{game.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{game.desc}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5 font-bold text-sky-500">
                    <Gem className="w-4 h-4 fill-sky-500" />
                    До +{game.reward}
                  </div>
                  <Button className="rounded-full shadow-lg hover:scale-105 transition-transform gap-1.5 px-6">
                    <Play className="w-4 h-4" fill="currentColor" /> Играть
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </main>
  );
}
