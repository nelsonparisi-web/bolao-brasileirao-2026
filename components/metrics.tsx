"use client";

import { useBolao } from "./bolao-context";
import { currency } from "@/lib/data";

export function Metrics() {
  const { getMetrics, loading } = useBolao();
  const metrics = getMetrics();

  const cards = [
    { label: "Participantes", value: metrics.participantsCount, icon: "👥", accent: "from-[#3157d5] to-[#4338ca]" },
    { label: "Jogos", value: metrics.gamesCount, icon: "⚽", accent: "from-[#06b6d4] to-[#3157d5]" },
    { label: "Arrecadado", value: currency.format(metrics.totalPot), icon: "💰", accent: "from-[#ff6b6b] to-[#e85272]" },
    { label: "Doação", value: currency.format(metrics.donationAmount), icon: "🤝", accent: "from-[#8b5cf6] to-[#3157d5]" },
    { label: "Com resultado", value: `${metrics.completedGames}/${metrics.gamesCount}`, icon: "🏁", accent: "from-[#22d3ee] to-[#8b5cf6]" },
  ];

  if (loading) {
    return (
      <section className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Resumo do bolão">
        {[1, 2, 3, 4, 5].map((i) => (
          <article key={i} className="animate-pulse rounded-2xl border border-white/70 bg-white/80 p-3 shadow-lg backdrop-blur-md">
            <div className="mb-2 h-3 w-16 rounded bg-muted"></div>
            <div className="h-6 w-10 rounded bg-muted"></div>
          </article>
        ))}
      </section>
    );
  }

  return (
    <section className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Resumo do bolão">
      {cards.map((card) => (
        <article key={card.label} className="group relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/85 p-3 shadow-[0_12px_35px_rgba(30,41,59,0.08)] backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-xl">
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} />
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">{card.label}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-base shadow-inner">{card.icon}</span>
          </div>
          <strong className="mt-2 block truncate text-lg font-black leading-none text-foreground sm:text-xl">{card.value}</strong>
        </article>
      ))}
    </section>
  );
}
