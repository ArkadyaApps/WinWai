function secureRandomInt(maxExclusive: number): number {
  return Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * maxExclusive);
}

const drawRandom = {
  choice<T>(arr: T[]): T {
    return arr[secureRandomInt(arr.length)];
  },
  /** Sample `count` distinct items without replacement (Fisher-Yates partial shuffle). */
  sample<T>(arr: T[], count: number): T[] {
    const pool = [...arr];
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i++) {
      const j = i + secureRandomInt(pool.length - i);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, n);
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Delay between a round's ticket goal being reached and its draw, by prize USD value. */
export function getDrawDelayMs(prizeValueUsd: number): number {
  if (prizeValueUsd <= 15) return 1 * DAY_MS;
  if (prizeValueUsd <= 25) return 3 * DAY_MS;
  return 7 * DAY_MS;
}

/** When the current round is due to be drawn, or null while its goal is still unmet. */
export function getScheduledDrawAt(thresholdReachedAt: Date | null | undefined, prizeValueUsd: number): Date | null {
  if (!thresholdReachedAt) return null;
  return new Date(thresholdReachedAt.getTime() + getDrawDelayMs(prizeValueUsd));
}

export function isRoundDue(thresholdReachedAt: Date | null | undefined, prizeValueUsd: number, now: Date): boolean {
  const scheduled = getScheduledDrawAt(thresholdReachedAt, prizeValueUsd);
  return scheduled !== null && now.getTime() >= scheduled.getTime();
}

/** Tickets collected in the current round (surplus from earlier rounds already excluded). */
export function getRoundTickets(totalTicketsCollected: number, roundStartTickets: number): number {
  return Math.max(0, totalTicketsCollected - roundStartTickets);
}

export function hasReachedGoal(totalTicketsCollected: number, roundStartTickets: number, goal: number): boolean {
  return totalTicketsCollected - roundStartTickets >= goal;
}

/** 1-based round number: each round awards one prize. */
export function getCurrentRound(prizesAvailable: number, prizesRemaining: number): number {
  return Math.min(Math.max(prizesAvailable, 1), Math.max(prizesAvailable - prizesRemaining + 1, 1));
}

/**
 * Where the next round's ticket count starts after a draw: the goal is
 * consumed and any surplus carries over. Capped at the total so a draw forced
 * before the goal was met can't leave a negative round.
 */
export function nextRoundStartTickets(roundStartTickets: number, goal: number, totalTicketsCollected: number): number {
  return Math.min(roundStartTickets + goal, totalTicketsCollected);
}

/** A raffle whose start date is still in the future: visible, but not playable yet. */
export function isComingSoon(startsAt: Date | null | undefined, now: Date = new Date()): boolean {
  return !!startsAt && startsAt.getTime() > now.getTime();
}

interface RaffleRoundFields {
  prizesAvailable: number;
  prizesRemaining: number;
  prizeValueUsd: number;
  totalTicketsCollected: number;
  roundStartTickets: number;
  thresholdReachedAt: Date | null;
  startsAt?: Date | null;
}

/** Derived, API-facing round info so clients never re-implement the tier rules. */
export function withRoundInfo<T extends RaffleRoundFields>(raffle: T) {
  return {
    ...raffle,
    currentRound: getCurrentRound(raffle.prizesAvailable, raffle.prizesRemaining),
    roundTickets: getRoundTickets(raffle.totalTicketsCollected, raffle.roundStartTickets),
    scheduledDrawAt: getScheduledDrawAt(raffle.thresholdReachedAt, raffle.prizeValueUsd),
    drawDelayMs: getDrawDelayMs(raffle.prizeValueUsd),
    isComingSoon: isComingSoon(raffle.startsAt),
  };
}

/**
 * Partial email for the public winners banner: "somchai@gmail.com" ->
 * "so***@g***.com". Masked on the server so a full address never leaves the API.
 */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  const host = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : "";
  return `${local.slice(0, local.length > 3 ? 2 : 1)}***@${host.slice(0, 1)}***${tld}`;
}

/**
 * Stable, non-reversible label for a public winners list. Derived from the
 * voucher reference (random, never shown publicly alongside a name) so it
 * can't be traced back to a user, but is consistent between requests.
 */
export async function anonymousWinnerId(voucherRef: string, raffleId: string): Promise<string> {
  const data = new TextEncoder().encode(`${raffleId}:${voucherRef}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .slice(0, 3)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// Approximate conversion rates to USD, matching the original backend.
const CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
  THB: 0.028,
  EUR: 1.09,
  GBP: 1.27,
  MAD: 0.1,
  JPY: 0.0067,
  CNY: 0.14,
  INR: 0.012,
  SGD: 0.74,
  MYR: 0.22,
  VND: 0.000039,
};

export function convertToUsd(amount: number, fromCurrency: string): number {
  const rate = CURRENCY_RATES[fromCurrency] ?? CURRENCY_RATES.THB;
  return amount * rate;
}

export function generateVoucherReference(): string {
  const year = new Date().getFullYear();
  const randomNum = 10000 + Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * 90000);
  return `WW-${year}-${randomNum}`;
}

export function generateVerificationCode(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((b) => chars[b % chars.length]).join("");
}

export { drawRandom };
