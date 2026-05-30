"use client";

import { motion } from "framer-motion";
import { Gem, Flame, Shirt, Palette, PackageOpen, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const SHOP_ITEMS = [
  { id: 1, name: "Деловой костюм", type: "clothing", price: 500, icon: "👔", rarity: "epic", isOwned: false },
  { id: 2, name: "Очки ботана", type: "accessory", price: 150, icon: "👓", rarity: "common", isOwned: true, isEquipped: true },
  { id: 3, name: "Корона инвестора", type: "accessory", price: 1200, icon: "👑", rarity: "legendary", isOwned: false },
  { id: 4, name: "Неоновый фон", type: "background", price: 300, icon: "🌌", rarity: "rare", isOwned: false },
];

export default function HeroPage() {
  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative z-10 pb-20">
      <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <h2 className="font-semibold text-xl">Мой Герой</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 bg-warning/10 text-warning px-3 py-1.5 rounded-full font-bold text-sm border border-warning/20">
            <Flame className="w-4 h-4 fill-warning" />
            12
          </div>
          <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-500 px-3 py-1.5 rounded-full font-bold text-sm border border-sky-500/20">
            <Gem className="w-4 h-4 fill-sky-500" />
            450
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 flex flex-col gap-8">
          {/* Hero Showcase */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full aspect-square rounded-[3rem] bg-gradient-to-br from-primary/20 via-secondary/10 to-background border border-white/10 flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(124,92,255,0.15)]"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
            
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative z-10"
            >
              <div className="text-[120px] leading-none drop-shadow-2xl relative">
                🦉
                {/* Equipped Accessory */}
                <div className="absolute -top-4 right-2 text-5xl rotate-12">👓</div>
              </div>
            </motion.div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-sm font-semibold tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              FinBro Готов
            </div>
          </motion.div>

          {/* Categories */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            <Button variant="secondary" className="rounded-full bg-primary text-primary-foreground hover:bg-primary px-5 h-10">
              <Shirt className="w-4 h-4 mr-2" /> Одежда
            </Button>
            <Button variant="outline" className="rounded-full bg-white/5 border-white/10 px-5 h-10 text-muted-foreground">
              <Palette className="w-4 h-4 mr-2" /> Фоны
            </Button>
            <Button variant="outline" className="rounded-full bg-white/5 border-white/10 px-5 h-10 text-muted-foreground">
              <PackageOpen className="w-4 h-4 mr-2 text-warning" /> Лутбоксы
            </Button>
          </div>

          {/* Shop Grid */}
          <div className="grid grid-cols-2 gap-4">
            {SHOP_ITEMS.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-3xl border flex flex-col items-center text-center gap-3 relative overflow-hidden ${
                  item.isEquipped ? "bg-primary/20 border-primary/50 shadow-lg shadow-primary/20" : "bg-white/5 border-white/10"
                }`}
              >
                {item.rarity === 'legendary' && <div className="absolute inset-0 bg-gradient-to-tr from-warning/0 via-warning/20 to-transparent pointer-events-none" />}
                
                <div className="text-4xl mt-2">{item.icon}</div>
                <div className="mt-auto">
                  <h4 className="font-bold text-sm leading-tight mb-2">{item.name}</h4>
                  
                  {item.isEquipped ? (
                    <Button size="sm" variant="secondary" className="w-full text-xs h-8 bg-primary/20 text-primary pointer-events-none">
                      Надето
                    </Button>
                  ) : item.isOwned ? (
                    <Button size="sm" variant="outline" className="w-full text-xs h-8">
                      Надеть
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full text-xs h-8 gap-1.5 bg-white/10 hover:bg-white/20 text-foreground">
                      <Gem className="w-3 h-3 fill-sky-500 text-sky-500" /> {item.price}
                    </Button>
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
