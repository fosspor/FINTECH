"use client";

import { motion } from "framer-motion";
import { AlertCircle, Target, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DiagnosisPage() {
  return (
    <main className="flex-1 flex flex-col min-h-0 h-[100dvh] max-w-2xl mx-auto w-full bg-background relative overflow-y-auto">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-96 bg-warning/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="p-6 pt-16 flex flex-col gap-5 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="flex flex-col items-center text-center mb-6"
        >
          <div className="w-24 h-24 rounded-[2rem] bg-warning/20 border border-warning/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            <div className="w-14 h-14 rounded-2xl bg-warning flex items-center justify-center">
              <span className="text-warning-foreground font-black text-3xl">!</span>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Жёлтая зона</h1>
          <p className="text-muted-foreground text-lg max-w-[280px]">Твои финансы требуют внимания, но ситуация под контролем.</p>
        </motion.div>

        {/* Glass Cards */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex items-start gap-4 shadow-lg"
        >
          <div className="p-3 bg-success/20 border border-success/30 rounded-2xl text-success shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Сильная сторона</h3>
            <p className="text-[19px] font-bold text-foreground">Стабильный доход</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex items-start gap-4 shadow-lg"
        >
          <div className="p-3 bg-destructive/20 border border-destructive/30 rounded-2xl text-destructive shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Главный риск</h3>
            <p className="text-[19px] font-bold text-foreground">Нет финансовой подушки</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="bg-primary/10 backdrop-blur-xl border border-primary/20 rounded-3xl p-5 flex items-start gap-4 shadow-lg mt-2 relative overflow-hidden"
        >
          {/* Subtle shine effect inside the card */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-white/5 to-transparent pointer-events-none" />
          
          <div className="p-3 bg-primary/20 border border-primary/30 rounded-2xl text-primary shrink-0 relative z-10">
            <Target className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-primary/80 uppercase tracking-wider mb-1">Первая рекомендация</h3>
            <p className="text-[19px] font-bold text-primary-foreground">Начать отслеживать ежедневные расходы</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 mb-6"
        >
          <Link href="/path" className="w-full block">
            <Button className="w-full h-16 rounded-2xl text-lg font-bold shadow-[0_10px_30px_rgba(124,92,255,0.3)] gap-2 hover:scale-[1.02] transition-transform">
              ✨ Построить мой путь
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
