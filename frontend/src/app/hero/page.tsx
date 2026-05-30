"use client";

import { useEffect, useState } from "react";
import { useAvatarStore } from "@/state/useAvatarStore";
import { AvaturnCreator } from "@/components/avaturn-creator";
import { AvatarViewer } from "@/components/avatar-viewer";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function HeroPage() {
  const { avatarUrl, setAvatarUrl } = useAvatarStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedUrl = localStorage.getItem("avaturn_url");
    if (savedUrl && !avatarUrl) {
      setAvatarUrl(savedUrl);
    }
  }, [avatarUrl, setAvatarUrl]);

  const handleExport = (url: string) => {
    setAvatarUrl(url);
    localStorage.setItem("avaturn_url", url);
  };

  const handleReset = () => {
    setAvatarUrl(null);
    localStorage.removeItem("avaturn_url");
  };

  if (!mounted) return null;

  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg tracking-tight">Avatar Profile</h1>
        </div>
        {avatarUrl && (
          <Button variant="outline" size="sm" onClick={handleReset} className="rounded-full flex items-center gap-2 border-white/10 hover:bg-white/5">
            <RefreshCw className="w-4 h-4" />
            Recreate
          </Button>
        )}
      </header>

      <div className="flex-1 w-full flex items-center justify-center p-4">
        {!avatarUrl ? (
          <div className="w-full h-[85vh] max-w-md mx-auto">
            <AvaturnCreator onAvatarExported={handleExport} />
          </div>
        ) : (
          <div className="w-full h-[85vh] max-w-md mx-auto bg-[#0F1117] rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center">
            <AvatarViewer url={avatarUrl} />
            <div className="absolute bottom-8 left-0 w-full flex justify-center px-6 pointer-events-none">
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-lg">
                <p className="text-sm font-medium text-white">3D Model Loaded Successfully</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
