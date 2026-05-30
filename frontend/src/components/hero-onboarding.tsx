"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, BrainCircuit, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HeroAvatar3D } from "@/components/hero-avatar-3d";

const TRAITS = ["Friendly", "Ambitious", "Funny", "Supportive", "Creative", "Analytical"];
const STYLES = ["Minimalist", "Techwear", "Casual", "Business", "Streetwear"];

const AvatarGraphic = ({ stage }: { stage: 'silhouette' | 'neutral' | 'final' }) => {
  const isSil = stage === 'silhouette';
  const skin = isSil ? '#1e1e2f' : '#e5c298';
  const topColor = '#f3f4f6'; 
  const shortsColor = '#1e293b'; 

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      {/* Particles for silhouette */}
      {isSil && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-dashed border-[#7B61FF]/30 opacity-50"
        />
      )}

      {/* Neural net rings for generating stage */}
      {stage === 'neutral' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-2 border-[#A78BFA] opacity-30"
        />
      )}

      <svg viewBox="0 0 200 400" className="w-[65%] h-auto drop-shadow-2xl z-10 transition-all duration-1000">
        <motion.g
          animate={isSil ? { opacity: [0.6, 1, 0.6], filter: ["blur(4px)", "blur(8px)", "blur(4px)"] } : { opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Base Body */}
          {/* Left Arm */}
          <rect x="35" y="140" width="24" height="110" rx="12" fill={skin} transform="rotate(10, 47, 140)" />
          {/* Right Arm */}
          <rect x="141" y="140" width="24" height="110" rx="12" fill={skin} transform="rotate(-10, 153, 140)" />
          {/* Legs */}
          <rect x="68" y="240" width="26" height="120" rx="13" fill={skin} />
          <rect x="106" y="240" width="26" height="120" rx="13" fill={skin} />
          {/* Torso */}
          <rect x="60" y="125" width="80" height="120" rx="30" fill={skin} />
          {/* Head */}
          <rect x="85" y="110" width="30" height="30" rx="10" fill={skin} />
          <circle cx="100" cy="75" r="45" fill={skin} />

          {/* Clothes for Final */}
          {stage === 'final' && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
              {/* Athletic Top */}
              <rect x="60" y="125" width="80" height="75" rx="20" fill={topColor} />
              {/* Shorts */}
              <rect x="60" y="200" width="80" height="50" rx="15" fill={shortsColor} />
              <rect x="68" y="235" width="26" height="35" rx="5" fill={shortsColor} />
              <rect x="106" y="235" width="26" height="35" rx="5" fill={shortsColor} />
              {/* Eyes/Face */}
              <circle cx="82" cy="70" r="5" fill="#111" />
              <circle cx="118" cy="70" r="5" fill="#111" />
              <path d="M 85 95 Q 100 110 115 95" stroke="#111" strokeWidth="3" fill="transparent" strokeLinecap="round" />
              {/* Modern Hair */}
              <path d="M 55 75 Q 100 15 145 75 Q 140 35 100 30 Q 60 35 55 75" fill="#2d3748" />
            </motion.g>
          )}

          {/* Basic features for Neutral */}
          {stage === 'neutral' && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <circle cx="82" cy="70" r="4" fill="#888" />
              <circle cx="118" cy="70" r="4" fill="#888" />
            </motion.g>
          )}
        </motion.g>
      </svg>
    </div>
  );
};

export function HeroOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("Minimalist");

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => setStep(3), 2500);
    }
    if (step === 6) {
      let p = 0;
      const interval = setInterval(() => {
        p += Math.floor(Math.random() * 5) + 2;
        if (p >= 100) {
          clearInterval(interval);
          setProgress(100);
          setTimeout(() => setStep(7), 500);
        } else {
          setProgress(p);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step]);

  const toggleTrait = (t: string) => {
    setSelectedTraits(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const wrapScreen = (content: React.ReactNode) => (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="absolute inset-0 flex flex-col p-6 items-center justify-center text-center max-w-lg mx-auto w-full"
    >
      {content}
    </motion.div>
  );

  return (
    <div className="flex-1 w-full min-h-[100dvh] bg-[#0F1117] text-white relative overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        
        {/* Screen 1: Silhouette */}
        {step === 1 && wrapScreen(
          <>
            <div className="flex-1 w-full flex items-center justify-center relative">
              <HeroAvatar3D isSilhouette />
            </div>
            <div className="pb-10 w-full">
              <h1 className="text-3xl font-bold mb-3 tracking-tight text-white">Create Your AI Companion</h1>
              <p className="text-[#A78BFA] mb-8 text-[17px]">Design a unique personality that understands you.</p>
              <Button 
                onClick={() => setStep(2)} 
                className="w-full h-14 rounded-[24px] bg-[#7B61FF] hover:bg-[#684be6] text-white text-lg font-semibold shadow-[0_0_30px_rgba(123,97,255,0.3)]"
              >
                Start Creating
              </Button>
            </div>
          </>
        )}

        {/* Screen 2: Building Character (Neutral) */}
        {step === 2 && wrapScreen(
          <>
            <div className="flex-1 w-full flex items-center justify-center relative">
              <HeroAvatar3D />
            </div>
            <div className="pb-10 w-full flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-[#7B61FF] animate-spin mb-4" />
              <h2 className="text-2xl font-bold">Building Your Character</h2>
            </div>
          </>
        )}

        {/* Screen 3: Customization Screen */}
        {step === 3 && wrapScreen(
          <>
            <div className="flex-1 w-full flex items-center justify-center relative mt-8 mb-4 max-h-[30vh]">
              <HeroAvatar3D />
            </div>
            <div className="w-full bg-[#171923] border border-white/5 rounded-[24px] p-6 shadow-xl flex-1 flex flex-col mb-8 text-left relative overflow-hidden">
              <h3 className="text-xl font-bold mb-4">Avatar Features</h3>
              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="flex flex-col gap-4">
                  {["Face shape", "Eyes", "Hair", "Skin tone", "Body type", "Height", "Voice"].map((feature) => (
                    <div key={feature} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                      <span className="font-medium">{feature}</span>
                      <ChevronRight className="w-5 h-5 text-white/40" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="pt-4 mt-auto">
                <Button onClick={() => setStep(4)} className="w-full h-14 rounded-[24px] bg-[#7B61FF] hover:bg-[#684be6] text-white text-lg font-semibold">
                  Next Step
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Screen 4: Personality Generation */}
        {step === 4 && wrapScreen(
          <>
            <div className="w-full flex-1 flex flex-col justify-center text-left">
              <div className="w-16 h-16 rounded-3xl bg-[#7B61FF]/20 flex items-center justify-center mb-6 border border-[#7B61FF]/30 shadow-[0_0_30px_rgba(123,97,255,0.2)]">
                <BrainCircuit className="w-8 h-8 text-[#7B61FF]" />
              </div>
              <h2 className="text-3xl font-bold mb-3">AI Personality</h2>
              <p className="text-[#A78BFA] mb-8 text-lg">Select traits to shape how your companion thinks and acts.</p>
              
              <div className="flex flex-wrap gap-3 mb-10">
                {TRAITS.map(t => {
                  const isActive = selectedTraits.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTrait(t)}
                      className={`px-5 py-3 rounded-2xl text-[16px] font-medium transition-all duration-300 border ${
                        isActive 
                          ? "bg-[#7B61FF] border-[#7B61FF] text-white shadow-lg" 
                          : "bg-[#171923] border-white/10 text-white/70 hover:border-white/30"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pb-10 w-full">
              <Button onClick={() => setStep(5)} disabled={selectedTraits.length === 0} className="w-full h-14 rounded-[24px] bg-[#7B61FF] hover:bg-[#684be6] text-white text-lg font-semibold disabled:opacity-50">
                Configure Style
              </Button>
            </div>
          </>
        )}

        {/* Screen 5: Avatar Style */}
        {step === 5 && wrapScreen(
          <>
            <div className="flex-1 w-full flex items-center justify-center relative mt-4 max-h-[35vh]">
              <HeroAvatar3D />
            </div>
            <div className="w-full bg-[#171923] border border-white/5 rounded-[24px] p-6 shadow-xl mb-8 text-left">
              <h3 className="text-xl font-bold mb-4">Outfit Style</h3>
              <div className="flex flex-wrap gap-3 mb-6">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStyle(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedStyle === s 
                        ? "bg-[#A78BFA]/20 border border-[#A78BFA] text-[#A78BFA]" 
                        : "bg-white/5 border border-white/5 text-white/60"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Button onClick={() => setStep(6)} className="w-full h-14 rounded-[24px] bg-[#7B61FF] hover:bg-[#684be6] text-white text-lg font-semibold gap-2 shadow-[0_0_20px_rgba(123,97,255,0.4)]">
                <Sparkles className="w-5 h-5" /> Generate Companion
              </Button>
            </div>
          </>
        )}

        {/* Screen 6: Generation Sequence */}
        {step === 6 && wrapScreen(
          <>
            <div className="flex-1 w-full flex items-center justify-center relative">
              {/* Neural network particles effect */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center opacity-40 mix-blend-screen"
              >
                <div className="w-[300px] h-[300px] rounded-full border-[1px] border-[#A78BFA] border-dashed" />
                <div className="absolute w-[200px] h-[200px] rounded-full border-[2px] border-[#7B61FF] border-dotted" />
              </motion.div>
              
              <div className="relative z-10 text-[#7B61FF] w-full h-[40vh]">
                <HeroAvatar3D />
              </div>
            </div>
            <div className="pb-16 w-full flex flex-col items-center">
              <div className="text-5xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#7B61FF] to-[#A78BFA]">
                {progress}%
              </div>
              <h2 className="text-xl font-medium text-white/80">Generating Your Unique AI Companion...</h2>
            </div>
          </>
        )}

        {/* Screen 7: Final Reveal */}
        {step === 7 && wrapScreen(
          <>
            <div className="flex-1 w-full flex items-center justify-center relative mt-4 h-[40vh]">
              <div className="absolute inset-0 bg-[#7B61FF]/10 blur-[100px] rounded-full" />
              <HeroAvatar3D />
            </div>
            
            <div className="w-full bg-[#171923] border border-white/10 rounded-[24px] p-6 shadow-2xl mb-8 text-left relative z-20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">FinBro</h3>
                  <p className="text-[#A78BFA] text-sm">Personal Financial Mentor</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#7B61FF]/20 border border-[#7B61FF]/30 flex items-center justify-center text-xl">
                  🦉
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedTraits.length > 0 ? selectedTraits.map(t => (
                  <span key={t} className="px-3 py-1 bg-white/5 rounded-lg text-xs text-white/70 border border-white/5">{t}</span>
                )) : (
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-xs text-white/70 border border-white/5">Supportive</span>
                )}
                <span className="px-3 py-1 bg-white/5 rounded-lg text-xs text-white/70 border border-white/5">{selectedStyle}</span>
              </div>
              
              <Button onClick={onComplete} className="w-full h-14 rounded-[24px] bg-[#7B61FF] hover:bg-[#684be6] text-white text-lg font-semibold shadow-[0_0_20px_rgba(123,97,255,0.4)]">
                Start Chatting
              </Button>
            </div>
          </>
        )}

      </AnimatePresence>
    </div>
  );
}
