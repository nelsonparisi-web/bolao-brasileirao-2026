"use client";

import { useState } from "react";
import Link from "next/link";
import { useBolao } from "./bolao-context";
import { APP_VERSION } from "@/lib/data";

type AuthMode = "login" | "register" | "reset" | "new-password";

export function Header() {
  const {
    games, getGuess, login, register, requestPasswordReset, updatePassword,
    cancelPasswordRecovery, logout, currentUser, isLoggedIn,
    isPasswordRecovery, loading, settings,
    selectedParticipantId, setSelectedParticipantId, isAdmin,
  } = useBolao();

  const [showForm, setShowForm] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const closeForm = () => {
    setShowForm(false);
    setAuthMode("login");
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setPasswordConfirmation("");
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
    const activeMode: AuthMode = isPasswordRecovery ? "new-password" : authMode;
    if (activeMode === "new-password" && password !== passwordConfirmation) {
      setMessage({ type: "error", text: "As senhas não conferem." });
      return;
    }
    const result = activeMode === "login"
      ? await login(email, password)
      : activeMode === "register"
        ? await register(name, email, password, phone)
        : activeMode === "reset"
          ? await requestPasswordReset(email)
          : await updatePassword(password);

    if (!result.success) {
      setMessage({ type: "error", text: result.error || "Não foi possível continuar." });
      return;
    }
    if (activeMode === "reset") {
      setMessage({ type: "success", text: "Enviamos as instruções de redefinição para seu e-mail." });
      return;
    }
    if (activeMode === "new-password") {
      setMessage({ type: "success", text: "Senha alterada. Sua sessão está ativa." });
      setPassword("");
      setPasswordConfirmation("");
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

  const activeMode: AuthMode = isPasswordRecovery ? "new-password" : authMode;
  const submitLabel = activeMode === "login" ? "Entrar" : activeMode === "register" ? "Cadastrar" : activeMode === "reset" ? "Enviar e-mail" : "Salvar nova senha";
  const pixKey = settings?.pix_key?.trim();

  const copyPix = async () => {
    if (!pixKey) return;
    await navigator.clipboard.writeText(pixKey);
    setPixCopied(true);
    window.setTimeout(() => setPixCopied(false), 1800);
  };

  return (
    <header className="px-2 pt-2 sm:px-3 lg:px-4 xl:px-6">
      <div className="relative overflow-hidden rounded-[1.4rem] border border-indigo-300/20 bg-gradient-to-br from-[#080f20] via-[#172554] to-[#4338ca] p-4 text-white shadow-[0_24px_70px_rgba(15,23,42,0.28)] lg:p-6">
        <div className="absolute -right-14 -top-20 h-56 w-56 rounded-full bg-[#06b6d4]/35 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#ff6b6b]/25 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ring-1 ring-white/20">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#06b6d4] text-base text-[#082f49] shadow-lg shadow-cyan-950/20">🏆</span>
              Brasileirão {settings?.season ?? 2026}
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Bolão Beneficente</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-white/90 sm:text-base">
              Palpites das 38 rodadas, ranking em tempo real e premiação solidária.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-[#06b6d4] px-3 py-1 text-[#082f49] shadow-sm">
                R$ {Number(settings?.entry_fee ?? 100).toFixed(0)}/pessoa
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20">
                {Number(settings?.donation_percent ?? 20)}% para doação
              </span>
              {pixKey && (
                <button type="button" onClick={copyPix} title="Copiar chave PIX" className="rounded-full bg-[#ff6b6b] px-3 py-1 font-black text-[#3f1420] shadow-sm transition hover:bg-[#ff8585]">
                  {pixCopied ? "PIX copiado!" : `PIX: ${pixKey}`}
                </button>
              )}
              <span className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20">{APP_VERSION}</span>
              <Link href="/manual" className="rounded-full bg-white px-3 py-1 font-black text-[#3157d5] shadow-sm hover:bg-cyan-50">
                Ajuda
              </Link>
            </div>
            {isLoggedIn && currentUser && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={openGuesses} className="rounded-full bg-[#06b6d4] px-5 py-2 text-sm font-black text-[#082f49] shadow-md shadow-cyan-950/20">Fazer palpites</button>
                <button onClick={() => document.querySelector("#ranking-completo")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#3157d5]">Ranking</button>
                <button onClick={exportGuesses} className="rounded-full bg-white/15 px-4 py-2 text-sm font-black ring-1 ring-white/25">Exportar CSV</button>
                {isAdmin && <button onClick={() => document.querySelector("#administracao")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full bg-[#ff6b6b] px-4 py-2 text-sm font-black text-[#3f1420] shadow-md shadow-rose-950/20">Administrar</button>}
              </div>
            )}
          </div>

          <div className="relative flex max-w-full flex-wrap items-center gap-2 rounded-2xl bg-white/12 p-2 ring-1 ring-white/20 backdrop-blur-md">
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-white/20" />
            ) : isPasswordRecovery ? (
              <form onSubmit={handleSubmit} className="grid w-full min-w-[280px] gap-2 sm:w-[420px]">
                <strong className="text-sm">Defina sua nova senha</strong>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha (mínimo 6 caracteres)" required minLength={6} className="h-10 rounded-full bg-white px-4 text-sm text-foreground" />
                <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Confirme a nova senha" required minLength={6} className="h-10 rounded-full bg-white px-4 text-sm text-foreground" />
                {message && <p className={`rounded-xl px-3 py-2 text-xs font-bold ${message.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{message.text}</p>}
                <div className="flex gap-2">
                  <button type="submit" className="rounded-full bg-[#06b6d4] px-4 py-2 text-xs font-black text-[#082f49]">{submitLabel}</button>
                  <button type="button" onClick={cancelPasswordRecovery} className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold ring-1 ring-white/25">Cancelar</button>
                </div>
              </form>
            ) : isLoggedIn && currentUser ? (
              <>
                <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-[#3157d5]">
                  Olá, {currentUser.name}{currentUser.is_admin ? " · Admin" : ""}
                </span>
                <button onClick={() => logout()} className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold ring-1 ring-white/25">Sair</button>
              </>
            ) : showForm ? (
              <form onSubmit={handleSubmit} className="grid w-full min-w-[280px] gap-2 sm:w-[420px]">
                {activeMode === "register" && (
                  <>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="h-10 rounded-full bg-white px-4 text-sm text-foreground" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Celular com DDD" inputMode="tel" className="h-10 rounded-full bg-white px-4 text-sm text-foreground" />
                  </>
                )}
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required className="h-10 rounded-full bg-white px-4 text-sm text-foreground" />
                {activeMode !== "reset" && (
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required className="h-10 rounded-full bg-white px-4 text-sm text-foreground" />
                )}
                {message && <p className={`rounded-xl px-3 py-2 text-xs font-bold ${message.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{message.text}</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="rounded-full bg-[#06b6d4] px-4 py-2 text-xs font-black text-[#082f49]">{submitLabel}</button>
                  <button type="button" onClick={() => openForm(activeMode === "login" ? "register" : "login")} className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold ring-1 ring-white/25">{activeMode === "login" ? "Participar" : "Entrar"}</button>
                  {activeMode === "login" && <button type="button" onClick={() => openForm("reset")} className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold ring-1 ring-white/25">Esqueci a senha</button>}
                  <button type="button" onClick={closeForm} className="h-8 w-8 rounded-full bg-white/15 font-bold ring-1 ring-white/25">×</button>
                </div>
              </form>
            ) : (
              <>
                <button onClick={() => openForm("login")} className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#3157d5]">Entrar</button>
                <button onClick={() => openForm("register")} className="rounded-full bg-[#06b6d4] px-4 py-2 text-xs font-black text-[#082f49]">Participar</button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
