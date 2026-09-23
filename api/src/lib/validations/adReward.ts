import { z } from "zod";

export const AdRewardSchema = z.object({
  transactionId: z.string().min(1),
  timestamp: z.number(),
  // rewardType/rewardAmount/userId (if sent) are accepted but ignored server-side -
  // the actual award amount and recipient are never trusted from the client.
});
export type AdRewardInput = z.infer<typeof AdRewardSchema>;
