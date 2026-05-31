"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { AuthMenu } from "@/components/auth-menu";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasBottomNav =
    pathname !== "/welcome" &&
    pathname !== "/auth" &&
    pathname !== "/onboarding" &&
    !pathname.startsWith("/level");

  return (
    <>
      <div
        className={cn(
          "flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden",
          hasBottomNav && "pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
        )}
      >
        <AuthMenu />
        {children}
      </div>
      {hasBottomNav && <BottomNav />}
    </>
  );
}
