import { z } from "zod";

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const RedeemReferralSchema = z.object({
  code: z.string().min(1),
});
export type RedeemReferralInput = z.infer<typeof RedeemReferralSchema>;
