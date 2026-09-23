import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]).default("user"),
  tickets: z.number().int().default(0),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
  tickets: z.number().int().optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

const PartnerBaseSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  logo: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  category: z.string().min(1),
  sponsored: z.boolean().default(false),
  contactInfo: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  line: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});
export const CreatePartnerSchema = PartnerBaseSchema;
export const UpdatePartnerSchema = PartnerBaseSchema.partial();
export type CreatePartnerInput = z.infer<typeof CreatePartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof UpdatePartnerSchema>;

const RaffleBaseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  image: z.string().optional().nullable(),
  category: z.string().min(1),
  partnerId: z.string().min(1),
  partnerName: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  prizesAvailable: z.number().int().nonnegative(),
  prizesRemaining: z.number().int().nonnegative(),
  ticketCost: z.number().int().positive().default(10),
  prizeValue: z.number().nonnegative().default(0),
  prizeValueUsd: z.number().nonnegative().default(0),
  currency: z.string().default("THB"),
  gamePrice: z.number().nonnegative().default(0),
  drawDate: z.coerce.date(),
  minimumDrawDate: z.coerce.date().optional().nullable(),
  validityMonths: z.number().int().positive().default(3),
  active: z.boolean().default(true),
  drawStatus: z.enum(["pending", "eligible", "drawn", "cancelled", "extended"]).default("pending"),
  isDigitalPrize: z.boolean().default(false),
  secretCodes: z.array(z.string()).default([]),
  language: z.enum(["en", "th", "fr", "ar"]).default("en"),
  allowedCountries: z.array(z.string()).default(["TH"]),
});
export const CreateRaffleSchema = RaffleBaseSchema;
export const UpdateRaffleSchema = RaffleBaseSchema.partial();
export type CreateRaffleInput = z.infer<typeof CreateRaffleSchema>;
export type UpdateRaffleInput = z.infer<typeof UpdateRaffleSchema>;

export const UploadSecretCodesSchema = z.object({
  raffleId: z.string().min(1),
  secretCodes: z.array(z.string()).min(1),
});
export type UploadSecretCodesInput = z.infer<typeof UploadSecretCodesSchema>;
