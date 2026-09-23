import { z } from "zod";

export const ClaimRewardSchema = z.object({
  rewardId: z.string().min(1),
  contactInfo: z.string().min(1),
});
export type ClaimRewardInput = z.infer<typeof ClaimRewardSchema>;
