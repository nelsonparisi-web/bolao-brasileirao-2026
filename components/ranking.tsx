"use client";

import { useBolao } from "./bolao-context";

export function Ranking() {
  const { getRanking, currentUser, loading } = useBolao();
  const ranking = getRanking();
  if (loading) return <section className="h-40 animate-pulse rounded-2xl bg-white shadow-lg" />;
  return (
    <section className="overflow-hidden rounded-2xl bg-white/90 shadow-xl">
      <header className="border-b p-4"><p className="text-[10px] font-black uppercase tracking-widest text-[#3157d5]">Classificação</p><h2 className="text-xl font-black">Ranking acumulado</h2></header>
      {!currentUser ? <p className="p-5 text-sm text-muted-foreground">Entre para acompanhar o ranking.</p> : <ol className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">{ranking.map((item, index) => <li key={item.participant.id} className={`flex items-center gap-3 rounded-xl border p-3 ${item.participant.id === currentUser.id ? "border-[#3157d5] bg-indigo-50" : "bg-white"}`}><span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-sm font-black">{index + 1}º</span><span className="min-w-0 flex-1 truncate font-black">{item.participant.name}</span><strong className="text-[#3157d5]">{item.points} pts</strong></li>)}</ol>}
    </section>
  );
}
