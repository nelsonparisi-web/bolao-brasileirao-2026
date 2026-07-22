"use client";

import { currency } from "@/lib/data";
import { useBolao } from "./bolao-context";

const podiumStyle = [
  { medal: "🥇", label: "1º lugar", tone: "from-[#fff1cf] to-[#fffaf0]", border: "border-amber-200", accent: "text-amber-700" },
  { medal: "🥈", label: "2º lugar", tone: "from-slate-100 to-white", border: "border-slate-200", accent: "text-slate-600" },
  { medal: "🥉", label: "3º lugar", tone: "from-orange-50 to-white", border: "border-orange-200", accent: "text-orange-700" },
];

export function DashboardOverview() {
  const { currentUser, participants, payments, settings, getRanking, loading } = useBolao();
  const ranking = getRanking().filter((item) => !item.participant.is_test).slice(0, 3);
  const entryFee = Number(settings?.entry_fee ?? 100);
  const donationPercent = Number(settings?.donation_percent ?? 20);
  const prizeSplit = settings?.prize_split ?? [50, 20, 10];
  const expected = participants.filter((participant) => !participant.is_test).length * entryFee;
  const received = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pending = Math.max(0, expected - received);
  const donation = expected * donationPercent / 100;
  const prizes = expected - donation;

  if (loading) return <section className="grid gap-3 lg:grid-cols-[1.45fr_1fr]"><div className="h-48 animate-pulse rounded-2xl bg-white/80" /><div className="h-48 animate-pulse rounded-2xl bg-white/80" /></section>;
  if (!currentUser) return null;

  return (
    <section className="grid gap-3 lg:grid-cols-[1.45fr_1fr]" aria-label="Pódio e resumo financeiro">
      <article className="overflow-hidden rounded-2xl border border-indigo-100 bg-white/90 shadow-[0_14px_42px_rgba(30,41,59,0.08)] backdrop-blur-md">
        <header className="flex items-end justify-between gap-3 border-b bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3157d5]">Classificação atual</p><h2 className="text-xl font-black">Pódio do Brasileirão</h2></div>
          <span className="rounded-full bg-[#3157d5] px-3 py-1 text-[10px] font-black text-white">TOP 3</span>
        </header>
        <div className="grid gap-2 p-3 sm:grid-cols-3">
          {podiumStyle.map((style, index) => {
            const item = ranking[index];
            const prize = expected * Number(prizeSplit[index] ?? 0) / 100;
            return <div key={style.label} className={`relative overflow-hidden rounded-2xl border ${style.border} bg-gradient-to-br ${style.tone} p-3`}>
              <div className="flex items-center justify-between gap-2"><span className="text-2xl" aria-hidden>{style.medal}</span><span className={`text-[10px] font-black uppercase ${style.accent}`}>{style.label}</span></div>
              <strong className="mt-3 block truncate text-base">{item?.participant.name ?? "A definir"}</strong>
              <div className="mt-2 flex items-end justify-between gap-2"><span className="text-sm font-black text-[#3157d5]">{item?.points ?? 0} pts</span><span className="text-right text-[10px] font-bold text-muted-foreground">Prêmio<br/><b className="text-foreground">{currency.format(prize)}</b></span></div>
            </div>;
          })}
        </div>
      </article>

      <article className="overflow-hidden rounded-2xl border border-indigo-100 bg-[#0b1220] text-white shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
        <header className="border-b border-white/10 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Transparência</p><h2 className="text-xl font-black">Resumo financeiro</h2></header>
        <div className="grid grid-cols-2 gap-px bg-white/10">
          <div className="bg-[#0b1220] p-3"><span className="text-[10px] font-bold uppercase text-slate-400">Previsto</span><strong className="mt-1 block text-lg">{currency.format(expected)}</strong></div>
          <div className="bg-[#0b1220] p-3"><span className="text-[10px] font-bold uppercase text-slate-400">Recebido</span><strong className="mt-1 block text-lg text-cyan-300">{currency.format(received)}</strong></div>
          <div className="bg-[#0b1220] p-3"><span className="text-[10px] font-bold uppercase text-slate-400">Pendente</span><strong className="mt-1 block text-lg text-[#ff8b8b]">{currency.format(pending)}</strong></div>
          <div className="bg-[#0b1220] p-3"><span className="text-[10px] font-bold uppercase text-slate-400">Participantes</span><strong className="mt-1 block text-lg">{participants.filter((participant) => !participant.is_test).length}</strong></div>
        </div>
        <footer className="grid grid-cols-2 gap-2 bg-gradient-to-r from-indigo-950 to-[#172554] p-3 text-xs"><span><b className="block text-violet-300">Premiação</b>{currency.format(prizes)}</span><span><b className="block text-cyan-300">Doação ({donationPercent}%)</b>{currency.format(donation)}</span></footer>
      </article>
    </section>
  );
}
