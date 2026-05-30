"use client";

import { useState } from "react";
import { useAvatarStore } from "@/state/useAvatarStore";
import { AvatarViewer } from "@/components/avatar-viewer";
import { AvaturnCreator } from "@/components/avaturn-creator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type FlowStep = "welcome" | "create" | "result";

export default function HeroPage() {
  const [step, setStep] = useState<FlowStep>("welcome");
  const { setAvatarUrl } = useAvatarStore();
  const router = useRouter();

  const handleAvatarExported = (url: string) => {
    setAvatarUrl(url);
    // Optionally persist to local storage or backend here
    localStorage.setItem("avaturn_url", url);
    setStep("result");
  };

  const handleRetake = () => {
    setAvatarUrl("");
    setStep("create");
  };

  const completeFlow = () => {
    router.push("/path");
  };

  return (
    <main className="flex flex-col min-h-[100dvh] bg-background text-foreground overflow-hidden">
      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg tracking-tight">Create Avatar</h1>
        </div>
      </header>

      <div className="flex-1 w-full flex items-center justify-center p-4 md:p-6 relative">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: WELCOME SCREEN */}
          {step === "welcome" && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm mx-auto flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-primary/20 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-primary/30 shadow-2xl">
                <span className="text-4xl">😎</span>
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight">Create Your AI Avatar</h2>
              <p className="text-muted-foreground mb-10 text-lg">
                Design a custom 3D companion to guide you through your financial journey.
              </p>
              
              <Button 
                size="lg" 
                className="rounded-full w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                onClick={() => setStep("create")}
              >
                Start Creator
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* STEP 2: AVATURN CREATOR */}
          {step === "create" && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-[85vh] max-w-3xl mx-auto"
            >
              <AvaturnCreator onAvatarExported={handleAvatarExported} />
            </motion.div>
          )}

          {/* STEP 3: RESULT SCREEN */}
          {step === "result" && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full h-full max-h-[85vh] max-w-md mx-auto flex flex-col"
            >
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Here is your Avatar!</h2>
                <p className="text-muted-foreground">Looking good! You can rotate the model to inspect it.</p>
              </div>

              {/* 3D Viewer Container */}
              <div className="flex-1 w-full bg-[#0F1117] rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center mb-6">
                <AvatarViewer />
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="rounded-full w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                  onClick={completeFlow}
                >
                  Looks Good! Continue
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost"
                  size="lg" 
                  className="rounded-full w-full h-14 text-lg font-medium text-muted-foreground hover:bg-white/5 hover:text-white"
                  onClick={handleRetake}
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Redesign Avatar
                </Button>
              </div>
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </main>
  );
}
