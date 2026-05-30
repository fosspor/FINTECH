"use client";

import { useState, useRef } from "react";
import { useAvatarStore } from "@/state/useAvatarStore";
import { AvatarViewer } from "@/components/avatar-viewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Upload, Camera, Loader2, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type FlowStep = "upload" | "generating" | "result";

export default function SelfieAvatarFlow() {
  const [step, setStep] = useState<FlowStep>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { avatarUrl, setAvatarUrl } = useAvatarStore();
  const router = useRouter();

  // Handle photo selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreview(URL.createObjectURL(file));
    }
  };

  // Mock process: Upload selfie -> Wait -> Receive avatar GLB URL
  const generateAvatar = async () => {
    setStep("generating");
    
    // Simulate external avatar service processing time
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    // Mock response from external avatar generation API (e.g. ReadyPlayerMe / Avaturn)
    const externalResponse = {
      avatarId: "usr_ai_12345",
      avatarUrl: "/avatar/avatar.glb"
    };

    setAvatarUrl(externalResponse.avatarUrl);
    setStep("result");
  };

  const handleRetake = () => {
    setPreview(null);
    setAvatarUrl(""); // clear it correctly to string empty or you can adjust state to accept null
    setStep("upload");
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

      <div className="flex-1 w-full flex items-center justify-center p-6 relative">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: UPLOAD PHOTO */}
          {step === "upload" && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm mx-auto flex flex-col items-center"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
                  <Camera className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Snap a Selfie</h2>
                <p className="text-muted-foreground">
                  Upload a photo of your face, and our AI will generate a perfect 3D avatar for you.
                </p>
              </div>

              {/* Upload Dropzone / Preview */}
              <div 
                className="w-full aspect-[3/4] bg-white/5 border-2 border-dashed border-white/20 rounded-[32px] flex flex-col items-center justify-center overflow-hidden relative cursor-pointer hover:bg-white/10 transition-colors group mb-8"
                onClick={() => !preview && fileInputRef.current?.click()}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Selfie preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="rounded-full">
                        <RefreshCcw className="w-4 h-4 mr-2" /> Change Photo
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-white/40 mb-3" />
                    <span className="font-medium text-white/80">Tap to choose photo</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>

              <Button 
                size="lg" 
                className="rounded-full w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow disabled:opacity-50"
                disabled={!preview}
                onClick={generateAvatar}
              >
                Generate Avatar
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* STEP 2: GENERATING SCREEN */}
          {step === "generating" && (
            <motion.div 
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center px-6"
            >
              {/* Neural network particles effect / Loader */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="relative flex items-center justify-center w-48 h-48 mb-8"
              >
                <div className="absolute w-full h-full rounded-full border-[2px] border-primary border-dashed opacity-40 mix-blend-screen" />
                <div className="absolute w-3/4 h-3/4 rounded-full border-[4px] border-primary/50 border-dotted opacity-60" />
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-2">Analyzing Features...</h2>
              <p className="text-muted-foreground max-w-xs">
                Sending your selfie to our 3D processing engine. Please wait a moment.
              </p>
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
                  Looks Good! Save Avatar
                </Button>
                <Button 
                  variant="ghost"
                  size="lg" 
                  className="rounded-full w-full h-14 text-lg font-medium text-muted-foreground hover:bg-white/5 hover:text-white"
                  onClick={handleRetake}
                >
                  Retake Photo
                </Button>
              </div>
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </main>
  );
}
