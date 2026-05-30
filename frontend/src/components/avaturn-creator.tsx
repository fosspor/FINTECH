"use client";

import { useEffect, useRef } from "react";
import { AvaturnSDK } from "@avaturn/sdk";
import { Loader2 } from "lucide-react";

interface AvaturnCreatorProps {
  onAvatarExported: (url: string) => void;
}

export function AvaturnCreator({ onAvatarExported }: AvaturnCreatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sdk = new AvaturnSDK();
    
    // Initialize the SDK with the official Avaturn demo URL
    sdk.init(containerRef.current, {
      url: "https://demo.avaturn.dev"
    }).then(() => {
      console.log("Avaturn SDK initialized");
    });

    // Listen for export event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sdk.on("export", (data: any) => {
      if (data && data.url) {
        onAvatarExported(data.url);
      }
    });

    return () => {
      // Cleanup the SDK on unmount
      sdk.destroy();
    };
  }, [onAvatarExported]);

  return (
    <div className="w-full h-full relative bg-background rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
      {/* Container for Avaturn SDK iframe injection */}
      <div ref={containerRef} className="w-full h-full relative z-20" />
      
      {/* Loading state behind the container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 pointer-events-none">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading Avaturn Editor...</p>
      </div>
    </div>
  );
}
