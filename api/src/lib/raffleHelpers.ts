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

export function getExtensionPeriodMs(prizeValueUsd: number): number {
  const DAY_MS = 24 * 60 * 60 * 1000;
  if (prizeValueUsd <= 15) return 1 * DAY_MS;
  if (prizeValueUsd <= 25) return 3 * DAY_MS;
  return 7 * DAY_MS;
}

export function calculateMinimumDrawDate(prizeValueUsd: number, createdAt: Date): Date {
  return new Date(createdAt.getTime() + getExtensionPeriodMs(prizeValueUsd));
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
