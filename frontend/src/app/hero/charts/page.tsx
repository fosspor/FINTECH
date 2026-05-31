"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function HeroChartsPage() {
  const [series, setSeries] = useState<Array<{ label: string; value: number; color: string }>>([
    { label: "Долги", value: 0, color: "#ef4444" },
    { label: "Подушка", value: 0, color: "#22c55e" },
    { label: "Траты", value: 0, color: "#f59e0b" },
    { label: "Бюджет", value: 0, color: "#3b82f6" },
    { label: "Другое", value: 0, color: "#8b5cf6" },
  ]);
  const [stats, setStats] = useState<{ userMsgs: number; botMsgs: number; avgLen: number }>({ userMsgs: 0, botMsgs: 0, avgLen: 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("finbro_charts_overrides");
      if (raw) {
        const ov = JSON.parse(raw);
        if (Array.isArray(ov.series)) setSeries(ov.series);
        if (ov.stats) setStats(ov.stats);
        return;
      }
    } catch {}
    loadFromChat();
  }, []);

  function loadFromChat() {
    try {
      const raw = localStorage.getItem("finbro_chat_messages");
      const arr = raw ? (JSON.parse(raw) as { role: string; content: string }[]) : [];
      const m = parseChatMetrics(arr);
      setSeries(m.series);
      setStats({ userMsgs: m.userMsgs, botMsgs: m.botMsgs, avgLen: m.avgLen });
    } catch {}
  }

  function saveOverrides() {
    const payload = { series, stats };
    localStorage.setItem("finbro_charts_overrides", JSON.stringify(payload));
  }

  function resetOverrides() {
    localStorage.removeItem("finbro_charts_overrides");
    loadFromChat();
  }

  return (
    <main className="flex-1 flex flex-col min-h-0 w-full bg-background text-foreground overflow-y-auto relative">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(48,213,200,0.24),transparent_62%)] pointer-events-none" />

      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/hero">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="font-semibold text-xl">Аналитика чата</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Распределение тем и статистика сообщений</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={loadFromChat}>Загрузить из диалога</Button>
          <Button size="sm" variant="secondary" className="rounded-full" onClick={resetOverrides}><RotateCcw className="w-4 h-4 mr-1" />Сбросить</Button>
          <Button size="sm" className="rounded-full" onClick={saveOverrides}>Сохранить</Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3 p-6">
        {/* Charts area */}
        <div className="grid gap-6 lg:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h3 className="font-bold mb-3">Распределение тем</h3>
            <div className="block md:hidden"><DonutChart data={series} size={220} /></div>
            <div className="hidden md:block"><DonutChart data={series} size={300} /></div>
            <ScrollArea className="mt-4 h-44 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {series.map((s, idx) => (
                  <div key={s.label} className="flex items-center gap-2 text-sm">
                    <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="font-semibold flex-1 min-w-0 truncate">{s.label}</span>
                    <input
                      type="number"
                      min={0}
                      className="w-24 rounded-md border border-white/10 bg-background px-2 py-1 text-right text-sm"
                      value={s.value}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setSeries((cur) => cur.map((it, i) => i === idx ? { ...it, value: v } : it));
                      }}
                    />
                    <input
                      type="text"
                      className="w-28 rounded-md border border-white/10 bg-background px-2 py-1 text-xs"
                      value={s.color}
                      onChange={(e) => setSeries((cur) => cur.map((it, i) => i === idx ? { ...it, color: e.target.value } : it))}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h3 className="font-bold mb-3">Сообщения и средняя длина</h3>
            <BarChart
              data={[
                { label: "Пользователь", value: stats.userMsgs, color: "#22c55e" },
                { label: "ФИНБРО", value: stats.botMsgs, color: "#3b82f6" },
                { label: "Ср. длина", value: stats.avgLen, color: "#8b5cf6" },
              ]}
            />
          </div>
        </div>

        {/* Editor side */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)]">
          <h3 className="font-bold mb-4">Редактирование данных</h3>
          <ScrollArea className="h-full pr-2">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Пользователь</label>
                  <input
                    type="number"
                    min={0}
                    className="rounded-md border border-white/10 bg-background px-2 py-1 text-sm"
                    value={stats.userMsgs}
                    onChange={(e) => setStats((s) => ({ ...s, userMsgs: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">ФИНБРО</label>
                  <input
                    type="number"
                    min={0}
                    className="rounded-md border border-white/10 bg-background px-2 py-1 text-sm"
                    value={stats.botMsgs}
                    onChange={(e) => setStats((s) => ({ ...s, botMsgs: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Ср. длина</label>
                  <input
                    type="number"
                    min={0}
                    className="rounded-md border border-white/10 bg-background px-2 py-1 text-sm"
                    value={stats.avgLen}
                    onChange={(e) => setStats((s) => ({ ...s, avgLen: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <h4 className="font-semibold text-sm">Темы</h4>
                {series.map((s, idx) => (
                  <div key={s.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                      <input
                        type="text"
                        className="rounded-md border border-white/10 bg-background px-2 py-1 text-sm w-full"
                        value={s.label}
                        onChange={(e) => setSeries((cur) => cur.map((it, i) => i === idx ? { ...it, label: e.target.value } : it))}
                      />
                    </div>
                    <input
                      type="number"
                      min={0}
                      className="w-24 rounded-md border border-white/10 bg-background px-2 py-1 text-right text-sm"
                      value={s.value}
                      onChange={(e) => setSeries((cur) => cur.map((it, i) => i === idx ? { ...it, value: Number(e.target.value) || 0 } : it))}
                    />
                    <input
                      type="text"
                      className="w-28 rounded-md border border-white/10 bg-background px-2 py-1 text-xs"
                      value={s.color}
                      onChange={(e) => setSeries((cur) => cur.map((it, i) => i === idx ? { ...it, color: e.target.value } : it))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </main>
  );
}

function DonutChart({ data, size = 260, thickness = 28 }: { data: { label: string; value: number; color: string }[]; size?: number; thickness?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2;
  const inner = radius - thickness;
  let startAngle = -90;
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

function BarChart({ data, maxBarHeight = 180 }: { data: { label: string; value: number; color: string }[]; maxBarHeight?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="grid grid-cols-3 gap-4 items-end w-full">
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
