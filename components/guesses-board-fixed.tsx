"use client";

import { useEffect, useMemo, useState } from "react";
import { useBolao } from "./bolao-context";
import { formatDate, isGuessLocked, scoreGuess } from "@/lib/data";

export function GuessesBoard() {
  const { games, participants, currentUser, getGuess, saveGuess, loading } = useBolao();
  const [round, setRound] = useState<number | null>(null);
  const [viewedParticipantId, setViewedParticipantId] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, { score1: string; score2: string }>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const rounds = useMemo(() => Array.from(new Set(games.map((game) => game.round))).sort((a, b) => a - b), [games]);
  const firstOpenRound = useMemo(() => {
    const openGame = games.find((game) => !isGuessLocked(game, 1));
    return openGame?.round ?? rounds[0] ?? 1;
  }, [games, rounds]);
  const selectedRound = round && rounds.includes(round) ? round : firstOpenRound;
  const selectedParticipantId = viewedParticipantId || currentUser?.id || "";
  const selectedParticipant = participants.find((participant) => participant.id === selectedParticipantId) ?? currentUser;
  const canEdit = selectedParticipantId === currentUser?.id;
  const roundGames = useMemo(() => games.filter((game) => game.round === selectedRound), [games, selectedRound]);

  useEffect(() => {
    setViewedParticipantId(currentUser?.id ?? "");
    setDrafts({});
    setMessage("");
  }, [currentUser?.id]);

  if (loading) return <section className="h-48 animate-pulse rounded-2xl bg-white shadow-lg" />;
  if (!currentUser) return <section className="rounded-2xl bg-white p-5 shadow-lg"><h2 className="text-xl font-black">Palpites</h2><p className="mt-2 text-sm text-muted-foreground">Entre para registrar seus palpites.</p></section>;

  const draftFor = (gameId: number) => {
    const key = `${selectedParticipantId}:${gameId}`;
    const guess = getGuess(selectedParticipantId, gameId);
    return drafts[key] ?? { score1: String(guess?.score1 ?? ""), score2: String(guess?.score2 ?? "") };
  };

  const updateDraft = (gameId: number, field: "score1" | "score2", value: string) => {
    if (!canEdit) return;
    const key = `${selectedParticipantId}:${gameId}`;
    const current = draftFor(gameId);
    setDrafts((items) => ({ ...items, [key]: { ...current, [field]: value.replace(/\D/g, "").slice(0, 2) } }));
  };

  const save = async (gameId: number) => {
    if (!canEdit || !currentUser) return;
    const draft = draftFor(gameId);
    setSaving(gameId);
    const result = await saveGuess(currentUser.id, gameId, draft.score1, draft.score2);
    setSaving(null);
    setMessage(result.success ? "Palpite salvo." : result.error || "Erro ao salvar.");
  };

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-xl">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b p-4">
        <div><p className="text-[10px] font-black uppercase tracking-widest text-[#3157d5]">{canEdit ? "Seus palpites" : `Palpites de ${selectedParticipant?.name ?? "participante"}`}</p><h2 className="text-xl font-black">Rodada {selectedRound}</h2><p className="text-xs text-muted-foreground">{canEdit ? "Palpites liberados até 1 hora antes de cada jogo." : "Palpites de outros participantes: visualização somente leitura."}</p></div>
        <div className="flex flex-wrap gap-2">
          <label className="grid gap-1 text-[10px] font-black uppercase text-muted-foreground">Participante
            <select value={selectedParticipantId} onChange={(e) => { setViewedParticipantId(e.target.value); setMessage(""); }} className="h-10 min-w-48 rounded-xl border bg-white px-3 text-sm font-bold normal-case text-foreground">
              {participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}{participant.id === currentUser.id ? " (você)" : ""}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-[10px] font-black uppercase text-muted-foreground">Rodada
            <select value={selectedRound} onChange={(e) => setRound(Number(e.target.value))} className="h-10 rounded-xl border bg-white px-3 text-sm font-bold normal-case text-foreground">
              {(rounds.length ? rounds : [1]).map((item) => <option key={item} value={item}>Rodada {item}</option>)}
            </select>
          </label>
        </div>
      </header>
      {message && <p className="mx-4 mt-3 rounded-xl bg-secondary px-3 py-2 text-xs font-bold">{message}</p>}
      <div className="w-full overflow-visible sm:overflow-x-auto">
        <table className="w-full border-collapse text-sm sm:min-w-[620px]">
          <thead className="hidden sm:table-header-group"><tr className="bg-[#f5f7ff] text-left text-[10px] uppercase text-muted-foreground"><th className="p-3">Data</th><th className="p-3">Partida</th><th className="p-3">Palpite</th><th className="p-3">Resultado</th><th className="p-3">Pts</th></tr></thead>
          <tbody className="block sm:table-row-group">
            {roundGames.map((game) => {
              const draft = draftFor(game.id);
              const guess = getGuess(selectedParticipantId, game.id);
              const locked = isGuessLocked(game, 1);
              const saved = Boolean(
                guess
                && guess.score1 !== null
                && guess.score2 !== null
                && String(guess.score1) === draft.score1
                && String(guess.score2) === draft.score2
              );
              return <tr key={game.id} className="grid grid-cols-2 gap-x-3 gap-y-2 border-t p-3 sm:table-row sm:p-0">
                <td className="col-start-2 row-start-1 z-10 justify-self-end p-0 text-xs text-muted-foreground sm:table-cell sm:p-3 sm:text-foreground">{formatDate(game.datetime)}</td>
                <td className="col-span-2 row-start-1 p-0 pr-24 font-black sm:table-cell sm:p-3">{game.team1} <span className="font-normal text-muted-foreground">x</span> {game.team2}<small className="block font-normal text-muted-foreground">{game.stadium || ""}</small></td>
                <td className="col-span-2 p-0 sm:table-cell sm:p-3"><div className="flex w-full flex-wrap items-center gap-2"><span className="mr-auto text-[10px] font-black uppercase text-muted-foreground sm:hidden">Palpite</span><input value={draft.score1} disabled={locked || !canEdit} onChange={(e) => updateDraft(game.id, "score1", e.target.value)} className="h-9 w-11 rounded-lg border text-center font-black disabled:bg-slate-100" /><span>x</span><input value={draft.score2} disabled={locked || !canEdit} onChange={(e) => updateDraft(game.id, "score2", e.target.value)} className="h-9 w-11 rounded-lg border text-center font-black disabled:bg-slate-100" />{canEdit && <button disabled={locked || saving === game.id || saved} onClick={() => save(game.id)} className={`rounded-lg px-3 py-2 text-xs font-black text-white shadow-sm disabled:opacity-100 ${saved ? "bg-emerald-600 shadow-emerald-950/20" : "bg-[#3157d5] shadow-indigo-950/20 disabled:opacity-40"}`}>{saving === game.id ? "..." : saved ? "Salvo" : "Salvar"}</button>}</div></td>
                <td className="flex items-center gap-2 p-0 text-xs sm:table-cell sm:p-3 sm:text-sm"><span className="font-bold text-muted-foreground sm:hidden">Resultado:</span><strong>{game.score1 === null || game.score2 === null ? "—" : `${game.score1} x ${game.score2}`}</strong></td>
                <td className="flex items-center justify-end gap-2 p-0 text-xs sm:table-cell sm:p-3 sm:text-sm"><span className="font-bold text-muted-foreground sm:hidden">Pontos:</span><strong>{scoreGuess(game, guess)}</strong></td>
              </tr>;
            })}
            {roundGames.length === 0 && <tr className="block"><td colSpan={5} className="block p-8 text-center text-muted-foreground">Nenhum jogo cadastrado nesta rodada.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
