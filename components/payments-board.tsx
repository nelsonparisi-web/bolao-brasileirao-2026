"use client";

import { useEffect, useMemo, useState } from "react";
import { currency } from "@/lib/data";
import { useBolao } from "./bolao-context";

function formatDateBR(date: string) {
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

export function PaymentsBoard() {
  const { participants, payments, settings, isAdmin, addPayment, removePayment, getParticipantPaymentStatus, loading } = useBolao();
  const financialParticipants = useMemo(() => participants.filter((participant) => !participant.is_test), [participants]);
  const entryFee = Number(settings?.entry_fee ?? 100);
  const donationPercent = Number(settings?.donation_percent ?? 20);
  const [participantId, setParticipantId] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentAmount, setPaymentAmount] = useState(String(entryFee));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!financialParticipants.some((participant) => participant.id === participantId)) setParticipantId(financialParticipants[0]?.id ?? "");
  }, [financialParticipants, participantId]);

  const selectedPayment = payments.find((payment) => payment.participant_id === participantId);

  useEffect(() => {
    if (selectedPayment) {
      setPaymentDate(selectedPayment.payment_date);
      setPaymentAmount(String(Number(selectedPayment.amount)));
    } else setPaymentAmount(String(entryFee));
  }, [entryFee, selectedPayment]);

  const rows = financialParticipants.map((participant) => ({
    participant,
    payment: payments.find((item) => item.participant_id === participant.id),
    ...getParticipantPaymentStatus(participant.id),
  }));
  const totalPaid = rows.reduce((sum, row) => sum + row.paid, 0);
  const totalPending = rows.reduce((sum, row) => sum + row.pending, 0);
  const paidCount = rows.filter((row) => row.pending === 0).length;
  const donation = totalPaid * donationPercent / 100;
  const prizePool = totalPaid - donation;

  if (!isAdmin) return null;
  if (loading) return <section className="h-48 animate-pulse rounded-2xl bg-white shadow-xl" />;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(paymentAmount.replace(",", "."));
    if (!participantId || !paymentDate || !Number.isFinite(amount) || amount <= 0) {
      setNotice({ type: "error", text: "Informe participante, data e valor válido." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await addPayment(participantId, paymentDate, amount);
      setNotice({ type: "success", text: selectedPayment ? "Pagamento atualizado." : "Pagamento registrado." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível salvar o pagamento." });
    } finally { setSaving(false); }
  };

  const remove = async (paymentId: string, name: string) => {
    if (!window.confirm(`Remover o pagamento de ${name}?`)) return;
    setSaving(true);
    setNotice(null);
    try {
      await removePayment(paymentId);
      setNotice({ type: "success", text: "Pagamento removido." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível remover o pagamento." });
    } finally { setSaving(false); }
  };

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-indigo-200 bg-white/95 shadow-xl">
      <header className="border-b bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3157d5]">Administração</p>
        <h2 className="text-xl font-black">Controle financeiro</h2>
        <p className="mt-1 text-xs text-muted-foreground">Pagamentos, pendências, doação e premiação do Brasileirão 2026.</p>
      </header>
      {notice && <p className={`mx-4 mt-3 rounded-xl px-3 py-2 text-xs font-bold ${notice.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{notice.text}</p>}

      <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3"><span className="text-[10px] font-black uppercase text-indigo-700">Previsto</span><strong className="mt-1 block text-lg">{currency.format(totalPaid + totalPending)}</strong><small className="text-muted-foreground">{financialParticipants.length} participantes</small></article>
        <article className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3"><span className="text-[10px] font-black uppercase text-cyan-800">Recebido</span><strong className="mt-1 block text-lg">{currency.format(totalPaid)}</strong><small className="text-muted-foreground">{paidCount} pagos</small></article>
        <article className="rounded-xl border border-rose-100 bg-rose-50/70 p-3"><span className="text-[10px] font-black uppercase text-rose-700">Pendente</span><strong className="mt-1 block text-lg">{currency.format(totalPending)}</strong><small className="text-muted-foreground">{rows.length - paidCount} pendentes</small></article>
        <article className="rounded-xl border border-violet-100 bg-violet-50/70 p-3"><span className="text-[10px] font-black uppercase text-violet-700">Recebido destinado</span><strong className="mt-1 block text-sm">{currency.format(prizePool)} para prêmios</strong><small className="block text-muted-foreground">{currency.format(donation)} para doação</small></article>
      </div>

      <form onSubmit={save} className="grid gap-2 border-y bg-secondary/60 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_150px_140px_150px]">
        <label className="grid gap-1 text-[10px] font-black uppercase text-muted-foreground">Participante<select value={participantId} onChange={(event) => setParticipantId(event.target.value)} disabled={saving} className="h-10 min-w-0 rounded-xl border bg-white px-3 text-sm font-bold normal-case text-foreground">{financialParticipants.length === 0 && <option value="">Nenhum participante</option>}{financialParticipants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}</select></label>
        <label className="grid gap-1 text-[10px] font-black uppercase text-muted-foreground">Data<input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} disabled={saving} className="h-10 min-w-0 rounded-xl border bg-white px-3 text-sm font-bold text-foreground" /></label>
        <label className="grid gap-1 text-[10px] font-black uppercase text-muted-foreground">Valor (R$)<input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} disabled={saving} className="h-10 min-w-0 rounded-xl border bg-white px-3 text-sm font-bold text-foreground" /></label>
        <label className="grid gap-1 text-[10px] font-black uppercase text-muted-foreground">Ação<button disabled={saving || !participantId} className="h-10 rounded-xl bg-[#3157d5] px-4 text-sm font-black normal-case text-white shadow-md disabled:opacity-50">{saving ? "Salvando..." : selectedPayment ? "Atualizar" : "Registrar"}</button></label>
        {selectedPayment && <p className="text-[10px] font-bold text-muted-foreground sm:col-span-2 lg:col-span-4">Este participante já possui pagamento. Ao salvar, o registro existente será atualizado.</p>}
      </form>

      <div className="divide-y lg:hidden">
        {rows.map(({ participant, payment, paid, pending }) => <article key={participant.id} className={`p-4 ${pending > 0 ? "bg-rose-50/40" : ""}`}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><strong className="block break-words">{participant.name}</strong><span className={`text-xs font-black ${pending > 0 ? "text-red-700" : "text-green-700"}`}>{pending > 0 ? "Pendente" : "Pago"}</span></div>{payment && <button type="button" disabled={saving} onClick={() => remove(payment.id, participant.name)} className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-50">Remover</button>}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span>Pago: <strong>{currency.format(paid)}</strong></span><span>Falta: <strong>{pending > 0 ? currency.format(pending) : "—"}</strong></span></div>
          {payment && <p className="mt-2 text-[11px] text-muted-foreground">Pagamento em {formatDateBR(payment.payment_date)}</p>}
        </article>)}
      </div>

      <div className="hidden max-h-[420px] overflow-auto lg:block"><table className="w-full text-sm"><thead><tr className="bg-[#f5f7ff] text-left text-[10px] uppercase text-muted-foreground"><th className="p-3">Participante</th><th className="p-3">Pago</th><th className="p-3">Pendente</th><th className="p-3">Pagamento</th><th className="p-3">Ação</th></tr></thead><tbody>{rows.map(({ participant, payment, paid, pending }) => <tr key={participant.id} className={`border-t ${pending > 0 ? "bg-rose-50/40" : ""}`}><td className="p-3 font-black">{participant.name}</td><td className="p-3 font-bold text-green-700">{currency.format(paid)}</td><td className="p-3 font-bold text-red-700">{pending > 0 ? currency.format(pending) : "—"}</td><td className="p-3 text-xs">{payment ? formatDateBR(payment.payment_date) : "—"}</td><td className="p-3">{payment && <button type="button" disabled={saving} onClick={() => remove(payment.id, participant.name)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-50">Remover</button>}</td></tr>)}</tbody></table></div>
    </section>
  );
}
