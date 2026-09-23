import { z } from "zod";

// See the identical helper/comment in lib/validations/admin.ts - forms send
// "" for a blank optional email field, which z.string().email() rejects.
const optionalEmail = z.preprocess((val) => (val === "" ? undefined : val), z.string().email().optional());

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: optionalEmail,
  phone: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const RedeemReferralSchema = z.object({
  code: z.string().min(1),
});
export type RedeemReferralInput = z.infer<typeof RedeemReferralSchema>;
