"use client";

import { useBolao } from "./bolao-context";
import { currency } from "@/lib/data";

export function Metrics() {
  const { getMetrics, loading } = useBolao();
  const metrics = getMetrics();

  const cards = [
    { label: "Participantes", value: metrics.participantsCount, icon: "👥", accent: "from-[#009b5a] to-[#006b3f]" },
    { label: "Jogos", value: metrics.gamesCount, icon: "⚽", accent: "from-[#1f5fbf] to-[#0f3b82]" },
    { label: "Arrecadado", value: currency.format(metrics.totalPot), icon: "💰", accent: "from-[#f6c343] to-[#d89a00]" },
    { label: "Doação", value: currency.format(metrics.donationAmount), icon: "🤝", accent: "from-[#009b5a] to-[#f6c343]" },
    { label: "Com resultado", value: `${metrics.completedGames}/${metrics.gamesCount}`, icon: "🏁", accent: "from-[#f6c343] to-[#009b5a]" },
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
        <article key={card.label} className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-3 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-xl">
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
