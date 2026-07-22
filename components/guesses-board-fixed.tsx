"use client";

import { useMemo, useState } from "react";
import { useBolao } from "./bolao-context";
import { formatDate, isGuessLocked, scoreGuess } from "@/lib/data";

export function GuessesBoard() {
  const { games, currentUser, getGuess, saveGuess, settings, loading } = useBolao();
  const [round, setRound] = useState(1);
  const [drafts, setDrafts] = useState<Record<number, { score1: string; score2: string }>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const rounds = useMemo(() => Array.from(new Set(games.map((game) => game.round))).sort((a, b) => a - b), [games]);
  const roundGames = useMemo(() => games.filter((game) => game.round === round), [games, round]);

  if (loading) return <section className="h-48 animate-pulse rounded-2xl bg-white shadow-lg" />;
  if (!currentUser) return <section className="rounded-2xl bg-white p-5 shadow-lg"><h2 className="text-xl font-black">Palpites</h2><p className="mt-2 text-sm text-muted-foreground">Entre para registrar seus palpites.</p></section>;

  const draftFor = (gameId: number) => {
    const guess = getGuess(currentUser.id, gameId);
    return drafts[gameId] ?? { score1: String(guess?.score1 ?? ""), score2: String(guess?.score2 ?? "") };
  };

  const updateDraft = (gameId: number, field: "score1" | "score2", value: string) => {
    const current = draftFor(gameId);
    setDrafts((items) => ({ ...items, [gameId]: { ...current, [field]: value.replace(/\D/g, "").slice(0, 2) } }));
  };

  const save = async (gameId: number) => {
    const draft = draftFor(gameId);
    setSaving(gameId);
    const result = await saveGuess(currentUser.id, gameId, draft.score1, draft.score2);
    setSaving(null);
    setMessage(result.success ? "Palpite salvo." : result.error || "Erro ao salvar.");
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-xl">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b p-4">
        <div><p className="text-[10px] font-black uppercase tracking-widest text-[#3157d5]">Seus palpites</p><h2 className="text-xl font-black">Rodada {round}</h2><p className="text-xs text-muted-foreground">O bloqueio ocorre {settings?.guess_lock_hours ?? 6} horas antes de cada jogo.</p></div>
        <select value={round} onChange={(e) => setRound(Number(e.target.value))} className="h-10 rounded-xl border bg-white px-3 text-sm font-bold">
          {(rounds.length ? rounds : Array.from({ length: 38 }, (_, index) => index + 1)).map((item) => <option key={item} value={item}>Rodada {item}</option>)}
        </select>
      </header>
      {message && <p className="mx-4 mt-3 rounded-xl bg-secondary px-3 py-2 text-xs font-bold">{message}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead><tr className="bg-[#f5f7ff] text-left text-[10px] uppercase text-muted-foreground"><th className="p-3">Data</th><th className="p-3">Partida</th><th className="p-3">Palpite</th><th className="p-3">Resultado</th><th className="p-3">Pts</th></tr></thead>
          <tbody>
            {roundGames.map((game) => {
              const draft = draftFor(game.id);
              const guess = getGuess(currentUser.id, game.id);
              const locked = isGuessLocked(game, settings?.guess_lock_hours ?? 6);
              return <tr key={game.id} className="border-t">
                <td className="p-3 text-xs">{formatDate(game.datetime)}</td>
                <td className="p-3 font-black">{game.team1} <span className="font-normal text-muted-foreground">x</span> {game.team2}<small className="block font-normal text-muted-foreground">{game.stadium || ""}</small></td>
                <td className="p-3"><div className="flex items-center gap-2"><input value={draft.score1} disabled={locked} onChange={(e) => updateDraft(game.id, "score1", e.target.value)} className="h-9 w-12 rounded-lg border text-center font-black" /><span>x</span><input value={draft.score2} disabled={locked} onChange={(e) => updateDraft(game.id, "score2", e.target.value)} className="h-9 w-12 rounded-lg border text-center font-black" /><button disabled={locked || saving === game.id} onClick={() => save(game.id)} className="rounded-lg bg-[#3157d5] px-3 py-2 text-xs font-black text-white shadow-sm shadow-indigo-950/20 disabled:opacity-40">{saving === game.id ? "..." : "Salvar"}</button></div></td>
                <td className="p-3 font-bold">{game.score1 === null || game.score2 === null ? "—" : `${game.score1} x ${game.score2}`}</td>
                <td className="p-3 font-black">{scoreGuess(game, guess)}</td>
              </tr>;
            })}
            {roundGames.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum jogo cadastrado nesta rodada.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
