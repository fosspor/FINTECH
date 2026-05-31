"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

// Simple donut (pie) chart using SVG arcs
function DonutChart({ data, size = 220, thickness = 28 }: { data: { label: string; value: number; color: string }[]; size?: number; thickness?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2;
  const inner = radius - thickness;

  let startAngle = -90; // start at top

  const arcs = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const endAngle = startAngle + angle;

    const largeArc = angle > 180 ? 1 : 0;
    const sx = radius + radius * Math.cos((Math.PI / 180) * startAngle);
    const sy = radius + radius * Math.sin((Math.PI / 180) * startAngle);
    const ex = radius + radius * Math.cos((Math.PI / 180) * endAngle);
    const ey = radius + radius * Math.sin((Math.PI / 180) * endAngle);

    const path = `M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 1 ${ex} ${ey} L ${radius} ${radius} Z`;
    startAngle = endAngle;

    return <path key={i} d={path} fill={d.color} opacity={0.9} />;
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
        <g>
          {arcs}
          <circle cx={radius} cy={radius} r={inner} fill="hsl(var(--background))" />
        </g>
      </svg>
    </div>
  );
}

// Simple bar chart
function BarChart({ data, maxBarHeight = 160 }: { data: { label: string; value: number; color: string }[]; maxBarHeight?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="grid grid-cols-5 gap-3 items-end w-full">
      {data.map((d) => {
        const h = Math.round((d.value / max) * maxBarHeight);
        return (
          <div key={d.label} className="flex flex-col items-center gap-2">
            <div className="rounded-md border border-white/10 bg-white/5 w-full flex items-end justify-center" style={{ height: maxBarHeight }}>
              <div className="w-full rounded-md" style={{ height: h, backgroundColor: d.color, transition: "height 300ms ease" }} />
            </div>
            <div className="text-xs font-bold text-center leading-tight">
              <div className="opacity-80">{d.value}</div>
              <div className="text-[10px] text-muted-foreground">{d.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function parseChatMetrics(messages: { role: string; content: string }[]) {
  const text = messages.map((m) => m.content.toLowerCase()).join("\n");
  const count = (re: RegExp) => (text.match(re) || []).length;

  const buckets = [
    { key: "Долги", re: /(кредит|долг|карт|займ)/g, color: "#ef4444" },
    { key: "Подушка", re: /(подуш|накоп|резерв|сбереж)/g, color: "#22c55e" },
    { key: "Траты", re: /(импульс|покуп|трат|подпис)/g, color: "#f59e0b" },
    { key: "Бюджет", re: /(бюдж|расход|доход|категор|план)/g, color: "#3b82f6" },
  ];

  const series = buckets.map((b) => ({ label: b.key, value: count(b.re), color: b.color }));
  const other = Math.max(0, messages.length - series.reduce((s, d) => s + d.value, 0));
  series.push({ label: "Другое", value: other, color: "#8b5cf6" });

  const avgLen = Math.round(messages.reduce((s, m) => s + m.content.length, 0) / Math.max(1, messages.length));
  const userMsgs = messages.filter((m) => m.role !== "assistant").length;
  const botMsgs = messages.filter((m) => m.role === "assistant").length;

  return { series, avgLen, userMsgs, botMsgs };
}

export default function ChartsPage() {
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<{ label: string; value: number; color: string }[]>([]);
  const [stats, setStats] = useState<{ avgLen: number; userMsgs: number; botMsgs: number }>({ avgLen: 0, userMsgs: 0, botMsgs: 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("finbro_chat_messages");
      const arr = raw ? (JSON.parse(raw) as { role: string; content: string }[]) : [];
      const m = parseChatMetrics(arr);
      setSeries(m.series);
      setStats({ avgLen: m.avgLen, userMsgs: m.userMsgs, botMsgs: m.botMsgs });
    } catch {}
    setLoading(false);
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background relative z-10 pb-20">
      <header className="px-6 py-4 border-b border-border/10 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-xl">Графики из диалога</h2>
            <p className="text-sm text-muted-foreground mt-1">Данные зависят от твоего чата с ФИНБРО</p>
          </div>
          <Link href="/games">
            <Button size="sm" className="rounded-full" variant="secondary"><ArrowLeft className="w-4 h-4 mr-1" /> Игры</Button>
          </Link>
        </div>
      </header>

      <div className="p-6 flex flex-col gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-lg font-bold mb-3">Распределение тем (донат)</h3>
          <div className="flex flex-col items-center gap-4">
            <DonutChart data={series} />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-md">
              {series.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
                  <span className="font-bold">{s.label}</span>
                  <span className="text-muted-foreground">— {s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-lg font-bold mb-3">Сообщения и средняя длина</h3>
          <div className="flex items-end gap-6">
            <div className="flex-1">
              <BarChart data={[
                { label: "Пользователь", value: stats.userMsgs, color: "#22c55e" },
                { label: "ФИНБРО", value: stats.botMsgs, color: "#3b82f6" },
                { label: "Ср. длина", value: stats.avgLen, color: "#8b5cf6" },
              ]} />
            </div>
            <div className="text-sm font-medium text-muted-foreground min-w-[160px]">
              <div><span className="font-bold text-foreground">Пользователь:</span> {stats.userMsgs}</div>
              <div><span className="font-bold text-foreground">ФИНБРО:</span> {stats.botMsgs}</div>
              <div><span className="font-bold text-foreground">Ср. длина:</span> {stats.avgLen} симв.</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
