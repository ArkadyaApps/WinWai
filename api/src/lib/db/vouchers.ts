import { and, eq, gt, lt, or } from "drizzle-orm";
import { vouchers } from "../../db/schema";
import type { Database } from "./client";

type VoucherRow = typeof vouchers.$inferSelect;

/** Finds a voucher by the code the winner presents: its verification code or its full reference. */
export async function findVoucherByCode(db: Database, code: string): Promise<VoucherRow | undefined> {
  const normalized = code.trim().toUpperCase();
  return db.query.vouchers.findFirst({
    where: or(eq(vouchers.verificationCode, normalized), eq(vouchers.voucherRef, normalized)),
  });
}

/** What an admin sees at the counter. Never includes the verification or secret code. */
export function toAdminVoucherView(v: VoucherRow, now: Date = new Date()) {
  // Vouchers past their date are flipped to "expired" by the cron, but between
  // runs report the truth rather than "active".
  const status = v.status === "active" && v.validUntil.getTime() <= now.getTime() ? "expired" : v.status;
  return {
    id: v.id,
    voucherRef: v.voucherRef,
    raffleTitle: v.raffleTitle,
    partnerName: v.partnerName,
    prizeValue: v.prizeValue,
    currency: v.currency,
    isDigitalPrize: v.isDigitalPrize,
    winnerName: v.userName,
    status,
    validUntil: v.validUntil,
    redeemedAt: v.redeemedAt,
    createdAt: v.createdAt,
  };
}

export type RedeemResult =
  | { ok: true; voucher: VoucherRow }
  | { ok: false; reason: "not_found" | "already_redeemed" | "expired" | "cancelled" };

/**
 * Marks a voucher redeemed in one conditional UPDATE (still active and not
 * past its date), so two admins scanning the same code can't both succeed.
 */
export async function redeemVoucher(db: Database, voucherId: string, now: Date = new Date()): Promise<RedeemResult> {
  const updated = await db
    .update(vouchers)
    .set({ status: "redeemed", redeemedAt: now })
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.status, "active"), gt(vouchers.validUntil, now)))
    .returning();
  if (updated.length > 0) return { ok: true, voucher: updated[0] };

  const existing = await db.query.vouchers.findFirst({ where: eq(vouchers.id, voucherId) });
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.status === "redeemed") return { ok: false, reason: "already_redeemed" };
  if (existing.status === "cancelled") return { ok: false, reason: "cancelled" };
  return { ok: false, reason: "expired" };
}

/** Flips active vouchers past their date to "expired". Run by the cron Worker. */
export async function expireVouchers(db: Database, now: Date = new Date()): Promise<number> {
  const expired = await db
    .update(vouchers)
    .set({ status: "expired" })
    .where(and(eq(vouchers.status, "active"), lt(vouchers.validUntil, now)))
    .returning({ id: vouchers.id });
  return expired.length;
}
