import { z } from "zod";

export const PartnerInquirySchema = z.object({
  brand: z.string().trim().min(1),
  product: z.string().trim().min(1),
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
});
export type PartnerInquiryInput = z.infer<typeof PartnerInquirySchema>;
