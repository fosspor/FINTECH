"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Map as MapIcon, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/path", icon: MapIcon, label: "Путь" },
    { href: "/games", icon: Trophy, label: "Игры" },
    { href: "/", icon: MessageSquare, label: "Bro" },
    { href: "/leaderboard", icon: Home, label: "Рейтинг" },
    { href: "/hero", icon: User, label: "Герой" },
  ];

  // We don't show the bottom nav on the welcome screen
  if (pathname === "/welcome") return null;

  return (
    <div className="flex items-center justify-around p-3 bg-background/80 backdrop-blur-xl border-t border-border/10 shrink-0 safe-area-bottom">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        
        return (
          <Link 
            key={link.href} 
            href={link.href}
            className="flex flex-col items-center gap-1 p-2 w-16"
          >
            <div className={cn(
              "p-2 rounded-2xl transition-all duration-300",
              isActive 
                ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(124,92,255,0.2)]" 
                : "text-muted-foreground hover:text-foreground"
            )}>
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            {isActive && (
              <span className="text-[10px] font-medium text-primary absolute bottom-1">
                {link.label}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
