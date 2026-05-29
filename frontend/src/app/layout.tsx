import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
      <body className={`${inter.className} bg-background text-foreground antialiased h-[100dvh] flex flex-col overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
