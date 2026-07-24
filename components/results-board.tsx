"use client";

import { useMemo, useState } from "react";
import { useBolao } from "./bolao-context";
import { formatDate } from "@/lib/data";

export function ResultsBoard() {
  const { games, isAdmin, saveResult, loading } = useBolao();
  const [round, setRound] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, { score1: string; score2: string }>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const rounds = useMemo(() => Array.from(new Set(games.map((game) => game.round))).sort((a, b) => a - b), [games]);
  const selectedRound = round && rounds.includes(round) ? round : rounds[0] ?? 1;
  const selected = games.filter((game) => game.round === selectedRound);

  const statusLabel: Record<string, string> = {
    scheduled: "Agendado",
    postponed: "Adiado",
    suspended: "Suspenso",
    cancelled: "Cancelado",
    live: "Ao vivo",
    finished: "Encerrado",
  };

  const draftFor = (gameId: number, score1: number | string | null, score2: number | string | null) =>
    drafts[gameId] ?? { score1: String(score1 ?? ""), score2: String(score2 ?? "") };

  const updateDraft = (gameId: number, current: { score1: string; score2: string }, field: "score1" | "score2", value: string) => {
    setDrafts((items) => ({
      ...items,
      [gameId]: { ...current, [field]: value.replace(/\D/g, "").slice(0, 2) },
    }));
  };

  const save = async (gameId: number, draft: { score1: string; score2: string }) => {
    setSaving(gameId);
    setMessage("");
    const result = await saveResult(gameId, draft.score1, draft.score2);
    setSaving(null);
    setMessage(result.success ? "Resultado salvo." : result.error || "Não foi possível salvar o resultado.");
  };

  if (loading) return <section className="h-40 animate-pulse rounded-2xl bg-white shadow-lg" />;

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl bg-white/90 shadow-xl">
      <header className="grid gap-3 border-b p-4 sm:flex sm:items-end sm:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-widest text-[#3157d5]">Tabela oficial</p><h2 className="text-xl font-black">Resultados · Rodada {selectedRound}</h2></div>
        <label className="grid w-full gap-1 text-[10px] font-black uppercase text-muted-foreground sm:w-auto">
          Rodada
          <select value={selectedRound} onChange={(e) => { setRound(Number(e.target.value)); setMessage(""); }} className="h-10 w-full rounded-xl border bg-white px-3 text-sm font-bold normal-case text-foreground sm:min-w-36">{(rounds.length ? rounds : [1]).map((item) => <option key={item} value={item}>Rodada {item}</option>)}</select>
        </label>
      </header>
      {message && <p className="mx-4 mt-3 rounded-xl bg-secondary px-3 py-2 text-xs font-bold">{message}</p>}
      <div className="divide-y lg:hidden">
        {selected.map((game) => {
          const draft = draftFor(game.id, game.score1, game.score2);
          const saved = game.score1 !== null && game.score2 !== null
            && String(game.score1) === draft.score1 && String(game.score2) === draft.score2;
          return <article key={game.id} className="min-w-0 p-4">
            <h3 className="break-words text-sm font-black leading-snug">{game.team1} x {game.team2}</h3>
            <time className="mt-1 block text-[11px] text-muted-foreground">{formatDate(game.datetime)}</time>
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-black uppercase text-muted-foreground">Resultado</p>
              <div className="flex items-center gap-2">
              {isAdmin ? <>
                <input aria-label={`Gols de ${game.team1}`} value={draft.score1} onChange={(e) => updateDraft(game.id, draft, "score1", e.target.value)} className="block h-10 w-12 shrink-0 rounded-lg border bg-white text-center text-base font-black" />
                <span className="shrink-0">x</span>
                <input aria-label={`Gols de ${game.team2}`} value={draft.score2} onChange={(e) => updateDraft(game.id, draft, "score2", e.target.value)} className="block h-10 w-12 shrink-0 rounded-lg border bg-white text-center text-base font-black" />
                <button disabled={saving === game.id || saved} onClick={() => save(game.id, draft)} className={`block h-10 shrink-0 rounded-lg px-4 text-xs font-black text-white ${saved ? "bg-emerald-600" : "bg-[#3157d5] disabled:opacity-40"}`}>{saving === game.id ? "..." : saved ? "Salvo" : "Salvar"}</button>
              </> : <strong>{game.score1 === null || game.score2 === null ? "—" : `${game.score1} x ${game.score2}`}</strong>}
              </div>
            </div>
            <div className="mt-3 border-t border-dashed pt-2 text-right text-xs text-muted-foreground">Status: <strong className="text-foreground">{statusLabel[game.status] ?? game.status}</strong></div>
          </article>;
        })}
        {selected.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum jogo cadastrado nesta rodada.</p>}
      </div>
      <div className="hidden w-full overflow-x-auto lg:block"><table className="w-full min-w-[560px] text-sm"><thead><tr className="bg-[#f5f7ff] text-left text-[10px] uppercase text-muted-foreground"><th className="p-3">Data</th><th className="p-3">Jogo</th><th className="p-3">Resultado</th><th className="p-3">Status</th></tr></thead>
      <tbody>{selected.map((game) => {
        const draft = draftFor(game.id, game.score1, game.score2);
        const saved = game.score1 !== null && game.score2 !== null
          && String(game.score1) === draft.score1 && String(game.score2) === draft.score2;
        return <tr key={game.id} className="border-t"><td className="p-3 text-xs">{formatDate(game.datetime)}</td><td className="p-3 font-black">{game.team1} x {game.team2}</td><td className="p-3">{isAdmin ? <div className="flex items-center gap-2"><input value={draft.score1} onChange={(e) => updateDraft(game.id, draft, "score1", e.target.value)} className="h-9 w-12 rounded-lg border text-center font-black" /><span>x</span><input value={draft.score2} onChange={(e) => updateDraft(game.id, draft, "score2", e.target.value)} className="h-9 w-12 rounded-lg border text-center font-black" /><button disabled={saving === game.id || saved} onClick={() => save(game.id, draft)} className={`rounded-lg px-3 py-2 text-xs font-black text-white ${saved ? "bg-emerald-600" : "bg-[#3157d5] disabled:opacity-40"}`}>{saving === game.id ? "..." : saved ? "Salvo" : "Salvar"}</button></div> : <strong>{game.score1 === null || game.score2 === null ? "—" : `${game.score1} x ${game.score2}`}</strong>}</td><td className="p-3 text-xs font-bold">{statusLabel[game.status] ?? game.status}</td></tr>;
      })}
      {selected.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum jogo cadastrado nesta rodada.</td></tr>}</tbody></table></div>
    </section>
  );
}
