import { z } from "zod";

export const LookupVoucherQuerySchema = z.object({
  code: z.string().trim().min(4).max(32),
});

export const RedeemVoucherSchema = z.object({
  voucherId: z.string().min(1),
});
