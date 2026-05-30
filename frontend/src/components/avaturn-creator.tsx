"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface AvaturnCreatorProps {
  onAvatarExported: (url: string) => void;
}

export function AvaturnCreator({ onAvatarExported }: AvaturnCreatorProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check could go here if needed, but for MVP we accept Avaturn messages
      if (event.data?.source === "avaturn" && event.data?.eventName === "v2.avatar.exported") {
        const url = event.data?.data?.url;
        if (url) {
          onAvatarExported(url);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onAvatarExported]);

  return (
    <div className="w-full h-full relative bg-background rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Loading Avaturn Editor...</p>
        </div>
      )}
      <iframe
        src="https://demo.avaturn.me" // Public demo URL for Avaturn
        className="w-full h-full border-none relative z-20"
        allow="camera; microphone; clipboard-write; clipboard-read"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
