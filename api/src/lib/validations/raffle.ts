import { z } from "zod";

export const RaffleEntrySchema = z.object({
  raffleId: z.string().min(1),
  // No amount here on purpose: the server charges the raffle's own ticketCost
  // (any client-sent ticketsToUse is stripped by the parser and ignored).
});
export type RaffleEntryInput = z.infer<typeof RaffleEntrySchema>;

export const DrawWinnerSchema = z.object({
  raffleId: z.string().min(1),
});
export type DrawWinnerInput = z.infer<typeof DrawWinnerSchema>;
