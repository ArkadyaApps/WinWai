import { z } from "zod";

export const RaffleEntrySchema = z.object({
  raffleId: z.string().min(1),
  ticketsToUse: z.number().int().positive().default(10),
});
export type RaffleEntryInput = z.infer<typeof RaffleEntrySchema>;

export const DrawWinnerSchema = z.object({
  raffleId: z.string().min(1),
});
export type DrawWinnerInput = z.infer<typeof DrawWinnerSchema>;
