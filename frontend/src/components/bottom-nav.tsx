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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-2xl items-center justify-around border-x border-t border-border/10 bg-background/90 px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl shadow-black/30 backdrop-blur-xl">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        
        return (
          <Link 
            key={link.href} 
            href={link.href}
            className="relative flex min-h-16 w-16 flex-col items-center justify-center gap-1 rounded-2xl p-1.5"
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
              <span className="absolute bottom-0 max-w-full truncate px-1 text-[10px] font-medium text-primary">
                {link.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
