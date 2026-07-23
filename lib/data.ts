export interface Participant {
  id: string;
  name: string;
  phone: string | null;
  is_admin: boolean;
  is_test: boolean;
  created_at: string;
}

export interface Game {
  id: number;
  season: number;
  round: number;
  team1: string;
  team2: string;
  group_name: string;
  datetime: string;
  stadium: string | null;
  status: "scheduled" | "postponed" | "suspended" | "cancelled" | "live" | "finished";
  score1: number | string | null;
  score2: number | string | null;
  created_at: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  short_name?: string | null;
  abbreviation?: string | null;
  crest_url?: string | null;
  city?: string | null;
  state?: string | null;
  active?: boolean;
  fifa_rank?: number | null;
  fifa_points?: number | null;
  ranking_reference?: string | null;
  updated_at: string;
}

export interface Guess {
  id: string;
  participant_id: string;
  game_id: number;
  score1: number | string | null;
  score2: number | string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  participant_id: string;
  amount: number;
  payment_date: string;
  created_at: string;
  updated_at?: string;
}

export interface Settings {
  id: number;
  competition_name?: string;
  season?: number;
  entry_fee: number;
  donation_percent: number;
  prize_split: number[];
  guess_lock_hours?: number;
  pix_key?: string | null;
}

export const APP_VERSION = "v0.1.1";
export const APP_VERSION_DATE = "21/07/2026";
export const APP_VERSION_TIME = "21:55";
export const APP_COMMIT = "base segura do Brasileirão";
export const GUESS_LOCK_WINDOW_MS = 60 * 60 * 1000;

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function normalizeTeamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function formatPhone(phone: string | null | undefined): string {
  const digits = normalizePhone(phone ?? "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone ?? "";
}

function parseGameDate(date: string): Date {
  const raw = String(date || "").trim();
  const parsed = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (parsed) {
    return new Date(
      Number(parsed[1]),
      Number(parsed[2]) - 1,
      Number(parsed[3]),
      Number(parsed[4]),
      Number(parsed[5]),
      Number(parsed[6] || 0)
    );
  }
  return new Date(raw);
}

function normalizeScoreValue(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatDate(date: string): string {
  const parsed = parseGameDate(date);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function isGuessLocked(game: Game, lockHours = 1): boolean {
  if (!["scheduled", "postponed"].includes(game.status)) return true;
  return Date.now() >= parseGameDate(game.datetime).getTime() - lockHours * 60 * 60 * 1000;
}

export function scoreGuess(
  game: Game,
  guess: { score1: number | string | null; score2: number | string | null } | null | undefined
): number {
  if (!guess) return 0;
  const real1 = normalizeScoreValue(game.score1);
  const real2 = normalizeScoreValue(game.score2);
  const guess1 = normalizeScoreValue(guess.score1);
  const guess2 = normalizeScoreValue(guess.score2);
  if (real1 === null || real2 === null || guess1 === null || guess2 === null) return 0;
  if (guess1 === real1 && guess2 === real2) return 5;
  return Math.sign(guess1 - guess2) === Math.sign(real1 - real2) ? 2 : 0;
}
