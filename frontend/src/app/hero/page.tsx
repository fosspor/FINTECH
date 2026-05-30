"use client";

import { useEffect, useState } from "react";
import { useAvatarStore } from "@/state/useAvatarStore";
import { AvaturnCreator } from "@/components/avaturn-creator";
import { AvatarViewer } from "@/components/avatar-viewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RefreshCw, Check } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Step = "welcome" | "create" | "review" | "complete";

export default function HeroPage() {
  const { avatarUrl, setAvatar, clearAvatar } = useAvatarStore();
  const [step, setStep] = useState<Step>("welcome");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedUrl = localStorage.getItem("avaturn_url");
    if (savedUrl && !avatarUrl) {
      setAvatar(savedUrl);
    }
  }, [avatarUrl, setAvatar]);

  // Handle flow state if URL already exists
  useEffect(() => {
    if (mounted && avatarUrl && step === "welcome") {
      setStep("review");
    }
  }, [mounted, avatarUrl, step]);

  const handleExport = (url: string) => {
    setAvatar(url);
    localStorage.setItem("avaturn_url", url);
    setStep("review");
  };

  const handleReset = () => {
    clearAvatar();
    localStorage.removeItem("avaturn_url");
    setStep("create");
  };

  const finishOnboarding = () => {
    setStep("complete");
  };

  if (!mounted) return null;

  return (
    <main className="flex flex-col min-h-[100dvh] bg-background text-foreground overflow-hidden">
      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg tracking-tight">AI Avatar</h1>
        </div>
      </header>

      <div className="flex-1 w-full flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center text-center px-6"
            >
              <div className="w-24 h-24 bg-primary/20 rounded-[2rem] flex items-center justify-center mb-8 border border-primary/30 shadow-2xl">
                <span className="text-4xl">😎</span>
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight">Create Your AI Avatar</h2>
              <p className="text-muted-foreground mb-10 max-w-sm text-lg">
                Design a custom 3D companion to guide you through your financial journey.
              </p>
              <Button 
                size="lg" 
                className="rounded-full w-full max-w-sm h-14 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                onClick={() => setStep("create")}
              >
                Start
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === "create" && (
            <motion.div 
              key="create"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-[85vh] max-w-2xl mx-auto p-4"
            >
              <AvaturnCreator onAvatarExported={handleExport} />
            </motion.div>
          )}

          {step === "review" && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full max-h-[85vh] max-w-md mx-auto flex flex-col p-4"
            >
              <div className="flex-1 w-full bg-[#0F1117] rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center mb-6">
                {avatarUrl ? (
                  <AvatarViewer url={avatarUrl} />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <p className="text-muted-foreground">Error loading avatar</p>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Button variant="outline" size="sm" onClick={handleReset} className="rounded-full bg-black/50 border-white/10 hover:bg-white/10 backdrop-blur-md">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="rounded-full w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                  onClick={finishOnboarding}
                >
                  Continue
                  <Check className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost"
                  size="lg" 
                  className="rounded-full w-full h-14 text-lg font-medium text-muted-foreground hover:bg-white/5 hover:text-white"
                  onClick={() => setStep("create")}
                >
                  Back
                </Button>
              </div>
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div 
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center px-6"
            >
              <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mb-6 border border-success/30">
                <Check className="w-10 h-10 font-bold" />
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight">Profile Complete!</h2>
              <p className="text-muted-foreground mb-10 max-w-sm">
                Your AI companion is ready. Let&apos;s get started with your tasks.
              </p>
              <Link href="/path" className="w-full max-w-sm">
                <Button 
                  size="lg" 
                  className="rounded-full w-full h-14 text-lg font-semibold"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
