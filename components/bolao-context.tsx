"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  scoreGuess,
  isGuessLocked,
  normalizePhone,
  type Participant,
  type Game,
  type Team,
  type Guess,
  type Payment,
  type Settings,
} from "@/lib/data";

type SaveResult = { success: boolean; error?: string };

interface BolaoContextType {
  participants: Participant[];
  games: Game[];
  teams: Team[];
  guesses: Guess[];
  payments: Payment[];
  settings: Settings | null;
  currentUser: Participant | null;
  selectedParticipantId: string | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isPasswordRecovery: boolean;
  loading: boolean;
  setSelectedParticipantId: (id: string | null) => void;
  login: (email: string, password: string) => Promise<SaveResult>;
  register: (name: string, email: string, password: string, phone: string) => Promise<SaveResult>;
  requestPasswordReset: (email: string) => Promise<SaveResult>;
  updatePassword: (password: string) => Promise<SaveResult>;
  cancelPasswordRecovery: () => void;
  logout: () => Promise<void>;
  renameParticipant: (id: string, newName: string) => Promise<boolean>;
  deleteParticipant: (id: string) => Promise<boolean>;
  saveGuess: (participantId: string, gameId: number, score1: string, score2: string) => Promise<SaveResult>;
  setGuess: (participantId: string, gameId: number, field: "score1" | "score2", value: string) => Promise<void>;
  setRealScore: (gameId: number, field: "score1" | "score2", value: string) => Promise<void>;
  updateGame: (gameId: number, changes: Partial<Pick<Game, "datetime" | "stadium" | "status">>) => Promise<SaveResult>;
  updateSettings: (changes: Partial<Pick<Settings, "entry_fee" | "donation_percent" | "guess_lock_hours" | "pix_key">>) => Promise<SaveResult>;
  getGuess: (participantId: string, gameId: number) => Guess | undefined;
  getRanking: () => { participant: Participant; points: number }[];
  getMetrics: () => { participantsCount: number; gamesCount: number; totalPot: number; donationAmount: number; completedGames: number };
  addPayment: (participantId: string, date: string, amount: number) => Promise<void>;
  removePayment: (paymentId: string) => Promise<void>;
  getParticipantPaymentStatus: (participantId: string) => { paid: number; pending: number };
  resetParticipantPassword: (participantId: string, newPassword: string) => Promise<SaveResult>;
  refreshData: () => Promise<void>;
}

const BolaoContext = createContext<BolaoContextType | null>(null);

function parseScore(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 30) return undefined;
  return parsed;
}

function authError(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (normalized.includes("already registered")) return "Este e-mail já está cadastrado.";
  if (normalized.includes("password")) return "A senha deve ter pelo menos 6 caracteres.";
  return message || "Não foi possível concluir a autenticação.";
}

export function useBolao() {
  const value = useContext(BolaoContext);
  if (!value) throw new Error("useBolao must be used within BolaoProvider");
  return value;
}

export function BolaoProvider({ children }: { children: ReactNode }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [loading, setLoading] = useState(true);

  const getClient = useCallback(() => createClient(), []);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await getClient().from("participants").select("*").eq("id", userId).maybeSingle();
    const profile = (data as Participant | null) ?? null;
    setCurrentUser(profile);
    if (profile) setSelectedParticipantId((value) => value ?? profile.id);
    return profile;
  }, [getClient]);

  const refreshData = useCallback(async () => {
    const supabase = getClient();
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      const profile = userId ? await loadProfile(userId) : null;

      const [gamesRes, teamsRes, settingsRes] = await Promise.all([
        supabase.from("games").select("*").order("round").order("datetime"),
        supabase.from("teams").select("*").order("name"),
        supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
      ]);

      setGames((gamesRes.data ?? []) as Game[]);
      setTeams((teamsRes.data ?? []) as Team[]);
      setSettings((settingsRes.data as Settings | null) ?? null);

      if (!profile) {
        setParticipants([]);
        setGuesses([]);
        setPayments([]);
        return;
      }

      const [participantsRes, guessesRes, paymentsRes] = await Promise.all([
        supabase.from("participants").select("*").order("name"),
        supabase.from("guesses").select("*").order("game_id"),
        supabase.from("payments").select("*"),
      ]);

      setParticipants((participantsRes.data ?? [profile]) as Participant[]);
      setGuesses((guessesRes.data ?? []) as Guess[]);
      setPayments((paymentsRes.data ?? []) as Payment[]);
    } finally {
      setLoading(false);
    }
  }, [getClient, loadProfile]);

  useEffect(() => {
    const supabase = getClient();
    refreshData();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setIsPasswordRecovery(true);
      if (!session?.user) {
        setCurrentUser(null);
        setSelectedParticipantId(null);
        setParticipants([]);
        setGuesses([]);
        setPayments([]);
      }
      window.setTimeout(() => refreshData(), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [getClient, refreshData]);

  const login = useCallback(async (email: string, password: string): Promise<SaveResult> => {
    const { error } = await getClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { success: false, error: authError(error.message) };
    await refreshData();
    return { success: true };
  }, [getClient, refreshData]);

  const register = useCallback(async (name: string, email: string, password: string, phone: string): Promise<SaveResult> => {
    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanPhone = normalizePhone(phone);
    if (cleanName.length < 2) return { success: false, error: "Informe seu nome." };
    if (!/^\d{10,11}$/.test(cleanPhone)) return { success: false, error: "Informe um celular com DDD." };
    if (password.length < 6) return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };

    const supabase = getClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: cleanName, phone: cleanPhone } },
    });
    if (error || !data.user) return { success: false, error: authError(error?.message) };

    const { error: profileError } = await supabase.from("participants").insert({
      id: data.user.id,
      name: cleanName,
      phone: cleanPhone,
      is_admin: false,
      is_test: false,
    });
    if (profileError) return { success: false, error: profileError.message };
    await refreshData();
    return { success: true };
  }, [getClient, refreshData]);

  const requestPasswordReset = useCallback(async (email: string): Promise<SaveResult> => {
    const redirectTo = typeof window === "undefined" ? undefined : `${window.location.origin}/`;
    const { error } = await getClient().auth.resetPasswordForEmail(email.trim(), { redirectTo });
    return error ? { success: false, error: authError(error.message) } : { success: true };
  }, [getClient]);

  const updatePassword = useCallback(async (password: string): Promise<SaveResult> => {
    if (password.length < 6) {
      return { success: false, error: "A nova senha deve ter pelo menos 6 caracteres." };
    }
    const { error } = await getClient().auth.updateUser({ password });
    if (error) return { success: false, error: authError(error.message) };
    setIsPasswordRecovery(false);
    await refreshData();
    return { success: true };
  }, [getClient, refreshData]);

  const cancelPasswordRecovery = useCallback(() => setIsPasswordRecovery(false), []);

  const logout = useCallback(async () => {
    await getClient().auth.signOut();
    setCurrentUser(null);
    setSelectedParticipantId(null);
  }, [getClient]);

  const renameParticipant = useCallback(async (id: string, newName: string) => {
    const name = newName.trim().replace(/\s+/g, " ");
    if (name.length < 2) return false;
    const { error } = await getClient().from("participants").update({ name }).eq("id", id);
    if (!error) await refreshData();
    return !error;
  }, [getClient, refreshData]);

  const deleteParticipant = useCallback(async (id: string) => {
    const { error } = await getClient().from("participants").delete().eq("id", id);
    if (!error) await refreshData();
    return !error;
  }, [getClient, refreshData]);

  const getGuess = useCallback((participantId: string, gameId: number) =>
    guesses.find((guess) => guess.participant_id === participantId && Number(guess.game_id) === Number(gameId)),
  [guesses]);

  const saveGuess = useCallback(async (participantId: string, gameId: number, score1Text: string, score2Text: string): Promise<SaveResult> => {
    if (!currentUser || participantId !== currentUser.id) {
      return { success: false, error: "Você só pode alterar seus próprios palpites." };
    }
    const score1 = parseScore(score1Text);
    const score2 = parseScore(score2Text);
    if (score1 === undefined || score2 === undefined || score1 === null || score2 === null) {
      return { success: false, error: "Informe os dois placares entre 0 e 30." };
    }
    const game = games.find((item) => Number(item.id) === Number(gameId));
    if (!game) return { success: false, error: "Jogo não encontrado." };
    if (isGuessLocked(game, 1)) {
      return { success: false, error: "Os palpites desta partida já foram encerrados." };
    }

    const { error } = await getClient().from("guesses").upsert(
      { participant_id: participantId, game_id: gameId, score1, score2 },
      { onConflict: "participant_id,game_id" }
    );
    if (error) {
      const normalized = error.message.toLowerCase();
      if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
        return { success: false, error: "O banco recusou a permissão para salvar este palpite." };
      }
      if (normalized.includes("encerrados") || normalized.includes("status")) {
        return { success: false, error: "Este jogo não está liberado para receber palpites." };
      }
      return { success: false, error: error.message };
    }
    await refreshData();
    return { success: true };
  }, [currentUser, games, getClient, refreshData]);

  const setGuess = useCallback(async (participantId: string, gameId: number, field: "score1" | "score2", value: string) => {
    const existing = getGuess(participantId, gameId);
    const result = await saveGuess(
      participantId,
      gameId,
      field === "score1" ? value : String(existing?.score1 ?? ""),
      field === "score2" ? value : String(existing?.score2 ?? "")
    );
    if (!result.success) window.alert(result.error);
  }, [getGuess, saveGuess]);

  const setRealScore = useCallback(async (gameId: number, field: "score1" | "score2", value: string) => {
    if (!currentUser?.is_admin) throw new Error("Apenas o administrador pode registrar resultados.");
    const score = parseScore(value);
    if (score === undefined) throw new Error("Placar inválido.");
    const payload: Record<string, unknown> = { [field]: score };
    const game = games.find((item) => Number(item.id) === Number(gameId));
    const otherScore = field === "score1" ? game?.score2 : game?.score1;
    if (score !== null && otherScore !== null && otherScore !== undefined) payload.status = "finished";
    const { error } = await getClient().from("games").update(payload).eq("id", gameId);
    if (error) throw error;
    await refreshData();
  }, [currentUser?.is_admin, games, getClient, refreshData]);

  const updateGame = useCallback(async (
    gameId: number,
    changes: Partial<Pick<Game, "datetime" | "stadium" | "status">>
  ): Promise<SaveResult> => {
    if (!currentUser?.is_admin) return { success: false, error: "Apenas o administrador pode alterar partidas." };
    const { error } = await getClient().from("games").update(changes).eq("id", gameId);
    if (error) return { success: false, error: error.message };
    await refreshData();
    return { success: true };
  }, [currentUser?.is_admin, getClient, refreshData]);

  const updateSettings = useCallback(async (
    changes: Partial<Pick<Settings, "entry_fee" | "donation_percent" | "guess_lock_hours" | "pix_key">>
  ): Promise<SaveResult> => {
    if (!currentUser?.is_admin) return { success: false, error: "Apenas o administrador pode alterar as configurações." };
    const { error } = await getClient().from("settings").update(changes).eq("id", 1);
    if (error) return { success: false, error: error.message };
    await refreshData();
    return { success: true };
  }, [currentUser?.is_admin, getClient, refreshData]);

  const getRanking = useCallback(() =>
    participants.map((participant) => ({
      participant,
      points: games.reduce((sum, game) => sum + scoreGuess(game, getGuess(participant.id, game.id)), 0),
    })).sort((a, b) => b.points - a.points || a.participant.name.localeCompare(b.participant.name, "pt-BR")),
  [participants, games, getGuess]);

  const getMetrics = useCallback(() => {
    const entryFee = settings?.entry_fee ?? 100;
    const donationPercent = settings?.donation_percent ?? 20;
    const totalPot = participants.length * entryFee;
    return {
      participantsCount: participants.length,
      gamesCount: games.length,
      totalPot,
      donationAmount: totalPot * donationPercent / 100,
      completedGames: games.filter((game) => game.status === "finished" || (game.score1 !== null && game.score2 !== null)).length,
    };
  }, [participants.length, games, settings]);

  const addPayment = useCallback(async (participantId: string, date: string, amount: number) => {
    if (!currentUser?.is_admin) throw new Error("Apenas o administrador pode registrar pagamentos.");
    const { error } = await getClient().from("payments").upsert(
      { participant_id: participantId, payment_date: date, amount },
      { onConflict: "participant_id" }
    );
    if (error) throw error;
    await refreshData();
  }, [currentUser?.is_admin, getClient, refreshData]);

  const removePayment = useCallback(async (paymentId: string) => {
    if (!currentUser?.is_admin) throw new Error("Apenas o administrador pode remover pagamentos.");
    const { error } = await getClient().from("payments").delete().eq("id", paymentId);
    if (error) throw error;
    await refreshData();
  }, [currentUser?.is_admin, getClient, refreshData]);

  const getParticipantPaymentStatus = useCallback((participantId: string) => {
    const paid = payments.filter((item) => item.participant_id === participantId).reduce((sum, item) => sum + Number(item.amount), 0);
    return { paid, pending: Math.max(0, Number(settings?.entry_fee ?? 100) - paid) };
  }, [payments, settings?.entry_fee]);

  const resetParticipantPassword = useCallback(async (): Promise<SaveResult> => ({
    success: false,
    error: "A redefinição segura é enviada ao e-mail do participante.",
  }), []);

  return (
    <BolaoContext.Provider value={{
      participants, games, teams, guesses, payments, settings, currentUser,
      selectedParticipantId, isAdmin: Boolean(currentUser?.is_admin),
      isLoggedIn: Boolean(currentUser), isPasswordRecovery, loading, setSelectedParticipantId,
      login, register, requestPasswordReset, updatePassword, cancelPasswordRecovery,
      logout, renameParticipant,
      deleteParticipant, setGuess, saveGuess, setRealScore, updateGame, updateSettings, getGuess,
      getRanking, getMetrics, addPayment, removePayment,
      getParticipantPaymentStatus, resetParticipantPassword, refreshData,
    }}>
      {children}
    </BolaoContext.Provider>
  );
}
