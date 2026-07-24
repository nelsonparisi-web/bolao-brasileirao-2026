"use client";

import { useEffect, useMemo, useState } from "react";
import { currency, formatPhone, normalizePhone, type Game } from "@/lib/data";
import { useBolao } from "./bolao-context";

type AdminTab = "participants" | "payments" | "messages" | "schedule" | "settings";
type MessageTemplate = "missing" | "leader" | "prize" | "invite";
type Notice = { type: "success" | "error"; text: string } | null;

function toLocalInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdminPanel() {
  const {
    isAdmin, currentUser, participants, payments, games, guesses, settings,
    renameParticipant, deleteParticipant, addPayment, removePayment,
    getParticipantPaymentStatus, getRanking, updateGame, updateSettings,
  } = useBolao();
  const [tab, setTab] = useState<AdminTab>("participants");
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [participantId, setParticipantId] = useState("");
  const [messageParticipantId, setMessageParticipantId] = useState("");
  const [messageTemplate, setMessageTemplate] = useState<MessageTemplate>("missing");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentAmount, setPaymentAmount] = useState(String(settings?.entry_fee ?? 100));
  const [round, setRound] = useState<number | "all">("all");
  const [fee, setFee] = useState(String(settings?.entry_fee ?? 100));
  const [donation, setDonation] = useState(String(settings?.donation_percent ?? 20));
  const [lockHours, setLockHours] = useState(String(settings?.guess_lock_hours ?? 1));
  const [pixKey, setPixKey] = useState(settings?.pix_key ?? "");

  useEffect(() => {
    if (!participantId && participants[0]) setParticipantId(participants[0].id);
    if (!messageParticipantId && participants[0]) setMessageParticipantId(participants[0].id);
  }, [messageParticipantId, participantId, participants]);

  useEffect(() => {
    setFee(String(settings?.entry_fee ?? 100));
    setDonation(String(settings?.donation_percent ?? 20));
    setLockHours(String(settings?.guess_lock_hours ?? 1));
    setPixKey(settings?.pix_key ?? "");
    setPaymentAmount(String(settings?.entry_fee ?? 100));
  }, [settings]);

  const rounds = useMemo(() => Array.from(new Set(games.map((game) => game.round))).sort((a, b) => a - b), [games]);
  const visibleGames = round === "all" ? games : games.filter((game) => game.round === round);
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const entryFee = Number(settings?.entry_fee ?? 100);
  const donationPercent = Number(settings?.donation_percent ?? 20);
  const totalExpected = participants.length * entryFee;
  const totalPending = Math.max(0, totalExpected - totalPaid);
  const projectedDonation = totalExpected * donationPercent / 100;
  const projectedPrizePool = totalExpected - projectedDonation;
  const paidCount = participants.filter((participant) => getParticipantPaymentStatus(participant.id).pending === 0).length;
  const ranking = getRanking();
  const messageParticipant = participants.find((participant) => participant.id === messageParticipantId) ?? null;
  const messageCompleted = messageParticipant
    ? guesses.filter((guess) => guess.participant_id === messageParticipant.id && guess.score1 !== null && guess.score2 !== null).length
    : 0;
  const messageMissing = Math.max(0, games.length - messageCompleted);
  const rankingIndex = messageParticipant ? ranking.findIndex((item) => item.participant.id === messageParticipant.id) : -1;
  const rankingItem = rankingIndex >= 0 ? ranking[rankingIndex] : null;
  const rankingPosition = rankingIndex + 1;
  const prizePercent = rankingPosition >= 1 && rankingPosition <= 3 ? Number(settings?.prize_split?.[rankingPosition - 1] ?? 0) : 0;
  const tiedCount = rankingItem ? ranking.filter((item) => item.points === rankingItem.points).length : 0;
  const estimatedPrize = tiedCount > 0 ? totalExpected * prizePercent / 100 / tiedCount : 0;
  const phoneDigits = normalizePhone(messageParticipant?.phone ?? "");
  const whatsappPhone = phoneDigits.length === 10 || phoneDigits.length === 11 ? `55${phoneDigits}` : "";
  const appUrl = typeof window === "undefined" ? "https://bolao-brasileirao-2026-five.vercel.app" : window.location.origin;
  const messageText = (() => {
    const name = messageParticipant?.name ?? "participante";
    if (messageTemplate === "leader") {
      return rankingPosition === 1
        ? `Parabéns, ${name}!\n\nVocê está em 1º lugar no Bolão Beneficente do Brasileirão 2026 com ${rankingItem?.points ?? 0} pontos.\n\nContinue acompanhando o ranking em:\n${appUrl}`
        : `Olá, ${name}!\n\nO ranking do Bolão Beneficente do Brasileirão 2026 foi atualizado. Sua posição atual é ${rankingPosition || "-"}º, com ${rankingItem?.points ?? 0} pontos.\n\nAcompanhe em:\n${appUrl}`;
    }
    if (messageTemplate === "prize") {
      return estimatedPrize > 0
        ? `Parabéns, ${name}!\n\nVocê está atualmente na faixa de premiação do Bolão Beneficente do Brasileirão 2026.\n\nColocação: ${rankingPosition}º lugar\nPontuação: ${rankingItem?.points ?? 0} pontos\nPrêmio estimado: ${currency.format(estimatedPrize)}\n\nEm caso de empate, o valor da colocação é dividido entre os participantes empatados.\n\nAcompanhe em:\n${appUrl}`
        : `Olá, ${name}!\n\nO ranking e a premiação estimada do Bolão Beneficente do Brasileirão 2026 foram atualizados.\n\nSua posição atual é ${rankingPosition || "-"}º, com ${rankingItem?.points ?? 0} pontos.\n\nAcompanhe em:\n${appUrl}`;
    }
    if (messageTemplate === "invite") {
      return `Olá!\n\nEstão abertas as inscrições para o Bolão Beneficente do Brasileirão 2026.\n\nValor: ${currency.format(entryFee)} por pessoa\nDoação: ${donationPercent}% do total arrecadado\nPIX: ${settings?.pix_key || "consulte o administrador"}\n\nCadastre-se e registre seus palpites em:\n${appUrl}`;
    }
    return `Olá, ${name}!\n\nVocê ainda possui ${messageMissing} palpites pendentes no Bolão Beneficente do Brasileirão 2026.\n\nAcesse o app e complete seus palpites antes do bloqueio de cada partida:\n${appUrl}`;
  })();
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(messageText)}` : "";

  if (!isAdmin) return null;

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice({ type: "success", text: success });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível concluir a operação." });
    } finally {
      setBusy(false);
    }
  };

  const editName = async (id: string, currentName: string) => {
    const name = window.prompt("Novo nome do participante:", currentName)?.trim();
    if (!name || name === currentName) return;
    await run(async () => {
      if (!await renameParticipant(id, name)) throw new Error("Não foi possível alterar o nome.");
    }, "Nome atualizado.");
  };

  const removeParticipant = async (id: string, name: string) => {
    if (id === currentUser?.id) return setNotice({ type: "error", text: "O administrador conectado não pode excluir a própria conta." });
    if (!window.confirm(`Excluir ${name}? Os palpites e pagamentos vinculados também serão removidos.`)) return;
    await run(async () => {
      if (!await deleteParticipant(id)) throw new Error("Não foi possível excluir o participante.");
    }, "Participante excluído.");
  };

  const savePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(paymentAmount.replace(",", "."));
    if (!participantId || !paymentDate || amount <= 0) return setNotice({ type: "error", text: "Informe participante, data e valor válido." });
    await run(() => addPayment(participantId, paymentDate, amount), "Pagamento registrado.");
  };

  const saveGame = async (game: Game, form: HTMLFormElement) => {
    const data = new FormData(form);
    const result = await updateGame(game.id, {
      datetime: new Date(String(data.get("datetime"))).toISOString(),
      stadium: String(data.get("stadium") || "").trim() || null,
      status: String(data.get("status")) as Game["status"],
    });
    if (!result.success) throw new Error(result.error);
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await updateSettings({
      entry_fee: Number(fee.replace(",", ".")),
      donation_percent: Number(donation.replace(",", ".")),
      guess_lock_hours: Number(lockHours),
      pix_key: pixKey.trim() || null,
    });
    if (!result.success) return setNotice({ type: "error", text: result.error || "Erro ao salvar configurações." });
    setNotice({ type: "success", text: "Configurações atualizadas." });
  };

  const tabs: Array<[AdminTab, string]> = [
    ["participants", "Participantes"], ["payments", "Financeiro"], ["messages", "WhatsApp"],
    ["schedule", "Jogos"], ["settings", "Configurações"],
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-xl">
      <header className="border-b bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#3157d5]">Administração</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">Painel do administrador</h2>
          <nav className="flex flex-wrap gap-1" aria-label="Áreas administrativas">
            {tabs.map(([value, label]) => <button key={value} onClick={() => { setTab(value); setNotice(null); }} className={`rounded-full px-3 py-2 text-xs font-black transition ${tab === value ? "bg-[#3157d5] text-white shadow-md shadow-indigo-950/20" : "border bg-white hover:border-indigo-300 hover:bg-indigo-50"}`}>{label}</button>)}
          </nav>
        </div>
        {notice && <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold ${notice.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{notice.text}</p>}
      </header>

      {tab === "participants" && <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm">
        <thead><tr className="bg-[#f5f7ff] text-left text-[10px] uppercase text-muted-foreground"><th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">Celular</th><th className="p-3">Tipo</th><th className="p-3">Pagamento</th><th className="p-3">Ações</th></tr></thead>
        <tbody>{participants.map((participant) => {
          const payment = getParticipantPaymentStatus(participant.id);
          return <tr key={participant.id} className="border-t"><td className="p-3 font-black">{participant.name}</td><td className="max-w-[230px] break-all p-3 text-xs">{participant.email || "—"}</td><td className="p-3">{formatPhone(participant.phone) || "—"}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${participant.is_admin ? "bg-violet-100 text-violet-900" : "bg-cyan-100 text-cyan-900"}`}>{participant.is_admin ? "Admin" : "Participante"}</span></td><td className="p-3 text-xs">{payment.pending ? `${currency.format(payment.pending)} pendente` : "Pago"}</td><td className="p-3"><div className="flex gap-2"><button disabled={busy} onClick={() => editName(participant.id, participant.name)} className="rounded-lg border px-3 py-2 text-xs font-black">Renomear</button><button disabled={busy || participant.id === currentUser?.id} onClick={() => removeParticipant(participant.id, participant.name)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-40">Excluir</button></div></td></tr>;
        })}</tbody>
      </table></div>}

      {tab === "payments" && <div className="p-4">
        <div className="mb-4"><h3 className="font-black">Controle financeiro</h3><p className="text-xs text-muted-foreground">Arrecadação, pendências, doação e premiação projetada.</p></div>
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3"><span className="text-[10px] font-black uppercase text-indigo-700">Previsto</span><strong className="mt-1 block text-lg">{currency.format(totalExpected)}</strong><small className="text-muted-foreground">{participants.length} participantes</small></article>
          <article className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3"><span className="text-[10px] font-black uppercase text-cyan-800">Recebido</span><strong className="mt-1 block text-lg">{currency.format(totalPaid)}</strong><small className="text-muted-foreground">{paidCount} pagos</small></article>
          <article className="rounded-xl border border-rose-100 bg-rose-50/70 p-3"><span className="text-[10px] font-black uppercase text-rose-700">Pendente</span><strong className="mt-1 block text-lg">{currency.format(totalPending)}</strong><small className="text-muted-foreground">{participants.length - paidCount} pendentes</small></article>
          <article className="rounded-xl border border-violet-100 bg-violet-50/70 p-3"><span className="text-[10px] font-black uppercase text-violet-700">Destinação</span><strong className="mt-1 block text-sm">{currency.format(projectedPrizePool)} prêmios</strong><small className="block text-muted-foreground">{currency.format(projectedDonation)} doação</small></article>
        </div>
        <form onSubmit={savePayment} className="grid gap-2 rounded-xl bg-secondary p-3 sm:grid-cols-4">
          <select value={participantId} onChange={(event) => setParticipantId(event.target.value)} className="h-10 rounded-lg border bg-white px-3 text-sm font-bold">{participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}</select>
          <input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className="h-10 rounded-lg border px-3" />
          <input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className="h-10 rounded-lg border px-3" />
          <button disabled={busy} className="h-10 rounded-lg bg-[#3157d5] px-4 text-sm font-black text-white shadow-sm shadow-indigo-950/20 disabled:opacity-50">Registrar/atualizar</button>
        </form>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{participants.map((participant) => {
          const payment = payments.find((item) => item.participant_id === participant.id);
          const status = getParticipantPaymentStatus(participant.id);
          return <article key={participant.id} className="rounded-xl border p-3"><div className="flex justify-between gap-2"><strong>{participant.name}</strong><span className={`text-xs font-black ${status.pending ? "text-red-700" : "text-green-700"}`}>{status.pending ? "Pendente" : "Pago"}</span></div><p className="mt-1 text-xs text-muted-foreground">Pago: {currency.format(status.paid)} · Falta: {currency.format(status.pending)}</p>{payment && <button disabled={busy} onClick={() => run(() => removePayment(payment.id), "Pagamento removido.")} className="mt-2 text-xs font-black text-red-700">Remover pagamento</button>}</article>;
        })}</div>
      </div>}

      {tab === "messages" && <div className="grid gap-4 p-4 lg:grid-cols-[320px_1fr]">
        <div className="grid content-start gap-3 rounded-2xl border bg-[#f5f7ff] p-4">
          <div><h3 className="font-black">Mensagens pelo WhatsApp Web</h3><p className="text-xs text-muted-foreground">Escolha o participante e um dos quatro modelos.</p></div>
          <label className="grid gap-1 text-xs font-black">Participante
            <select value={messageParticipantId} onChange={(event) => setMessageParticipantId(event.target.value)} className="h-10 rounded-lg border bg-white px-3 text-sm font-bold">{participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name} · {formatPhone(participant.phone) || "sem celular"}</option>)}</select>
          </label>
          <div className="grid gap-2">
            {([
              ["missing", "Palpites pendentes", "Lembra quantos palpites ainda faltam."],
              ["leader", "Líder do ranking", "Informa posição e pontuação atual."],
              ["prize", "Faixa de premiação", "Informa colocação e prêmio estimado."],
              ["invite", "Convite para participar", "Envia valor, doação, PIX e link."],
            ] as Array<[MessageTemplate, string, string]>).map(([value, label, description]) => <button key={value} type="button" onClick={() => setMessageTemplate(value)} className={`rounded-xl border p-3 text-left transition ${messageTemplate === value ? "border-[#3157d5] bg-white shadow-md shadow-indigo-950/10" : "bg-white/60 hover:bg-white"}`}><strong className="block text-sm">{label}</strong><span className="text-[11px] text-muted-foreground">{description}</span></button>)}
          </div>
        </div>
        <div className="grid content-start gap-3 rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><span className="text-[10px] font-black uppercase text-[#3157d5]">Prévia da mensagem</span><h3 className="font-black">{messageParticipant?.name ?? "Selecione um participante"}</h3></div>{messageParticipant && <span className={`rounded-full px-3 py-1 text-xs font-black ${whatsappPhone ? "bg-cyan-100 text-cyan-900" : "bg-red-100 text-red-800"}`}>{whatsappPhone ? formatPhone(messageParticipant.phone) : "Celular inválido"}</span>}</div>
          <textarea readOnly value={messageText} rows={13} className="w-full resize-none rounded-xl border bg-slate-50 p-3 text-sm leading-relaxed" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={async () => { await navigator.clipboard.writeText(messageText); setNotice({ type: "success", text: "Mensagem copiada." }); }} className="rounded-xl border px-4 py-3 text-sm font-black">Copiar mensagem</button>
            {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-[#25D366] px-5 py-3 text-sm font-black text-white shadow-md shadow-green-950/20">Abrir no WhatsApp Web</a> : <button type="button" disabled className="rounded-xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-500">Cadastre um celular válido</button>}
          </div>
        </div>
      </div>}

      {tab === "schedule" && <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4"><div><h3 className="font-black">Agenda e status dos jogos</h3><p className="text-xs text-muted-foreground">Partidas adiadas ficam bloqueadas até receberem nova data e status “Agendado”.</p></div><select value={round} onChange={(event) => setRound(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-10 rounded-lg border px-3 text-sm font-bold"><option value="all">Todas as rodadas</option>{rounds.map((item) => <option key={item} value={item}>Rodada {item}</option>)}</select></div>
        <div className="max-h-[620px] overflow-auto"><table className="w-full min-w-[860px] text-sm"><thead><tr className="sticky top-0 bg-[#f5f7ff] text-left text-[10px] uppercase text-muted-foreground"><th className="p-3">Rodada/jogo</th><th className="p-3">Data e hora</th><th className="p-3">Estádio</th><th className="p-3">Status</th><th className="p-3">Ação</th></tr></thead><tbody>{visibleGames.map((game) => <tr key={game.id} className="border-t"><td className="p-3 font-black">R{game.round} · {game.team1} x {game.team2}</td><td colSpan={4} className="p-2"><form onSubmit={(event) => { event.preventDefault(); run(() => saveGame(game, event.currentTarget), "Partida atualizada."); }} className="grid grid-cols-[180px_1fr_150px_90px] gap-2"><input name="datetime" type="datetime-local" defaultValue={toLocalInput(game.datetime)} required className="h-9 rounded-lg border px-2 text-xs" /><input name="stadium" defaultValue={game.stadium ?? ""} placeholder="Estádio" className="h-9 rounded-lg border px-2 text-xs" /><select name="status" defaultValue={game.status} className="h-9 rounded-lg border px-2 text-xs font-bold"><option value="scheduled">Agendado</option><option value="postponed">Adiado</option><option value="suspended">Suspenso</option><option value="cancelled">Cancelado</option><option value="live">Ao vivo</option><option value="finished">Encerrado</option></select><button disabled={busy} className="h-9 rounded-lg bg-[#3157d5] text-xs font-black text-white disabled:opacity-50">Salvar</button></form></td></tr>)}</tbody></table></div>
      </div>}

      {tab === "settings" && <form onSubmit={saveSettings} className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-xs font-black">Valor por pessoa (R$)<input type="number" min="0" step="0.01" value={fee} onChange={(event) => setFee(event.target.value)} className="h-10 rounded-lg border px-3 text-sm" /></label>
        <label className="grid gap-1 text-xs font-black">Doação (%)<input type="number" min="0" max="100" step="0.01" value={donation} onChange={(event) => setDonation(event.target.value)} className="h-10 rounded-lg border px-3 text-sm" /></label>
        <label className="grid gap-1 text-xs font-black">Bloqueio antes do jogo (horas)<input type="number" min="0" max="168" value={lockHours} onChange={(event) => setLockHours(event.target.value)} className="h-10 rounded-lg border px-3 text-sm" /></label>
        <label className="grid gap-1 text-xs font-black">Chave PIX<input value={pixKey} onChange={(event) => setPixKey(event.target.value)} className="h-10 rounded-lg border px-3 text-sm" /></label>
        <button className="h-10 rounded-lg bg-[#3157d5] px-4 text-sm font-black text-white shadow-sm shadow-indigo-950/20 sm:col-span-2 lg:col-span-4">Salvar configurações</button>
      </form>}
    </section>
  );
}
