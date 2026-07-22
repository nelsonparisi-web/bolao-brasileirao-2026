"use client";

import { useMemo, useState } from "react";
import { useBolao } from "./bolao-context";
import { formatDate } from "@/lib/data";

export function ResultsBoard() {
  const { games, isAdmin, setRealScore, loading } = useBolao();
  const [round, setRound] = useState(1);
  const rounds = useMemo(() => Array.from(new Set(games.map((game) => game.round))).sort((a, b) => a - b), [games]);
  const selected = games.filter((game) => game.round === round);

  if (loading) return <section className="h-40 animate-pulse rounded-2xl bg-white shadow-lg" />;

  return (
    <section className="overflow-hidden rounded-2xl bg-white/90 shadow-xl">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b p-4">
        <div><p className="text-[10px] font-black uppercase tracking-widest text-[#3157d5]">Tabela oficial</p><h2 className="text-xl font-black">Resultados</h2></div>
        <select value={round} onChange={(e) => setRound(Number(e.target.value))} className="h-10 rounded-xl border px-3 text-sm font-bold">{(rounds.length ? rounds : [1]).map((item) => <option key={item} value={item}>Rodada {item}</option>)}</select>
      </header>
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="bg-[#f5f7ff] text-left text-[10px] uppercase text-muted-foreground"><th className="p-3">Data</th><th className="p-3">Jogo</th><th className="p-3">Resultado</th><th className="p-3">Status</th></tr></thead>
      <tbody>{selected.map((game) => <tr key={game.id} className="border-t"><td className="p-3 text-xs">{formatDate(game.datetime)}</td><td className="p-3 font-black">{game.team1} x {game.team2}</td><td className="p-3">{isAdmin ? <div className="flex items-center gap-2"><input defaultValue={game.score1 ?? ""} onBlur={(e) => setRealScore(game.id, "score1", e.target.value)} className="h-9 w-12 rounded-lg border text-center font-black" /><span>x</span><input defaultValue={game.score2 ?? ""} onBlur={(e) => setRealScore(game.id, "score2", e.target.value)} className="h-9 w-12 rounded-lg border text-center font-black" /></div> : <strong>{game.score1 === null || game.score2 === null ? "—" : `${game.score1} x ${game.score2}`}</strong>}</td><td className="p-3 text-xs font-bold">{game.status}</td></tr>)}</tbody></table></div>
    </section>
  );
}
