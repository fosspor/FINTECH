import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "FinBro - AI Financial Mentor",
  description: "Твой персональный AI-наставник финансовых решений.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased h-[100dvh] overflow-hidden mx-auto max-w-2xl w-full border-x border-border/10 shadow-2xl shadow-primary/5`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
