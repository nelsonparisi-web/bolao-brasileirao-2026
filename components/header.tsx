"use client";

import { useState } from "react";
import { useBolao } from "./bolao-context";
import { APP_VERSION } from "@/lib/data";

type AuthMode = "login" | "register" | "reset";

export function Header() {
  const {
    games, getGuess, login, register, requestPasswordReset, logout,
    currentUser, isLoggedIn, loading, settings,
    selectedParticipantId, setSelectedParticipantId,
  } = useBolao();

  const [showForm, setShowForm] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const closeForm = () => {
    setShowForm(false);
    setAuthMode("login");
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setMessage(null);
  };

  const openForm = (mode: AuthMode) => {
    setShowForm(true);
    setAuthMode(mode);
    setMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const result = authMode === "login"
      ? await login(email, password)
      : authMode === "register"
        ? await register(name, email, password, phone)
        : await requestPasswordReset(email);

    if (!result.success) {
      setMessage({ type: "error", text: result.error || "Não foi possível continuar." });
      return;
    }
    if (authMode === "reset") {
      setMessage({ type: "success", text: "Enviamos as instruções de redefinição para seu e-mail." });
      return;
    }
    closeForm();
  };

  const openGuesses = () => {
    if (currentUser && selectedParticipantId !== currentUser.id) setSelectedParticipantId(currentUser.id);
    document.querySelector("#palpites")?.scrollIntoView({ behavior: "smooth" });
  };

  const exportGuesses = () => {
    if (!currentUser) return;
    const rows = [
      ["Rodada", "Data", "Mandante", "Visitante", "Palpite mandante", "Palpite visitante", "Resultado"],
      ...games.map((game) => {
        const guess = getGuess(currentUser.id, game.id);
        return [
          game.round, game.datetime, game.team1, game.team2,
          guess?.score1 ?? "", guess?.score2 ?? "",
          game.score1 === null || game.score2 === null ? "" : `${game.score1}x${game.score2}`,
        ];
      }),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `palpites-brasileirao-${currentUser.name.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const submitLabel = authMode === "login" ? "Entrar" : authMode === "register" ? "Cadastrar" : "Enviar e-mail";

  return (
    <header className="px-2 pt-2 sm:px-3 lg:px-4 xl:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-green-700/15 bg-gradient-to-br from-[#006b3f] via-[#009b5a] to-[#0a7f52] p-4 text-white shadow-2xl lg:p-5">
        <div className="absolute -right-14 -top-20 h-52 w-52 rounded-full bg-[#f6c343]/40 blur-2xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ring-1 ring-white/20">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f6c343] text-base text-[#14321f]">🏆</span>
              Brasileirão {settings?.season ?? 2026}
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Bolão Beneficente</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-white/90 sm:text-base">
              Palpites das 38 rodadas, ranking em tempo real e premiação solidária.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-[#f6c343] px-3 py-1 text-[#14321f]">
                R$ {Number(settings?.entry_fee ?? 100).toFixed(0)}/pessoa
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20">
                {Number(settings?.donation_percent ?? 20)}% para doação
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20">{APP_VERSION}</span>
            </div>
            {isLoggedIn && currentUser && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={openGuesses} className="rounded-full bg-[#f6c343] px-5 py-2 text-sm font-black text-[#14321f] shadow-md">Fazer palpites</button>
                <button onClick={() => document.querySelector("#ranking-completo")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#006b3f]">Ranking</button>
                <button onClick={exportGuesses} className="rounded-full bg-white/15 px-4 py-2 text-sm font-black ring-1 ring-white/25">Exportar CSV</button>
              </div>
            )}
          </div>

          <div className="relative flex max-w-full flex-wrap items-center gap-2 rounded-2xl bg-white/12 p-2 ring-1 ring-white/20 backdrop-blur-md">
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-white/20" />
            ) : isLoggedIn && currentUser ? (
              <>
                <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-[#006b3f]">
                  Olá, {currentUser.name}{currentUser.is_admin ? " · Admin" : ""}
                </span>
                <button onClick={() => logout()} className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold ring-1 ring-white/25">Sair</button>
              </>
            ) : showForm ? (
              <form onSubmit={handleSubmit} className="grid w-full min-w-[280px] gap-2 sm:w-[420px]">
                {authMode === "register" && (
                  <>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="h-10 rounded-full bg-white px-4 text-sm text-foreground" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Celular com DDD" inputMode="tel" className="h-10 rounded-full bg-white px-4 text-sm text-foreground" />
                  </>
                )}
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required className="h-10 rounded-full bg-white px-4 text-sm text-foreground" />
                {authMode !== "reset" && (
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required className="h-10 rounded-full bg-white px-4 text-sm text-foreground" />
                )}
                {message && <p className={`rounded-xl px-3 py-2 text-xs font-bold ${message.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{message.text}</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="rounded-full bg-[#f6c343] px-4 py-2 text-xs font-black text-[#14321f]">{submitLabel}</button>
                  <button type="button" onClick={() => openForm(authMode === "login" ? "register" : "login")} className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold ring-1 ring-white/25">{authMode === "login" ? "Participar" : "Entrar"}</button>
                  {authMode === "login" && <button type="button" onClick={() => openForm("reset")} className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold ring-1 ring-white/25">Esqueci a senha</button>}
                  <button type="button" onClick={closeForm} className="h-8 w-8 rounded-full bg-white/15 font-bold ring-1 ring-white/25">×</button>
                </div>
              </form>
            ) : (
              <>
                <button onClick={() => openForm("login")} className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#006b3f]">Entrar</button>
                <button onClick={() => openForm("register")} className="rounded-full bg-[#f6c343] px-4 py-2 text-xs font-black text-[#14321f]">Participar</button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
