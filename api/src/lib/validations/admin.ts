import { z } from "zod";

// Images are stored inline as base64 data URIs and returned in list responses,
// so keep them small (the admin app resizes/compresses before upload; ~0.4M
// characters is roughly 300 KB of image).
const MAX_IMAGE_CHARS = 400_000;

// Admin forms send "" for an empty optional email field rather than omitting
// it - z.string().email() rejects "" (it's not a valid email), so without
// this every create/update with a blank email field fails validation.
const optionalEmail = z.preprocess((val) => (val === "" ? undefined : val), z.string().email().optional().nullable());

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
  email: optionalEmail,
  phone: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
  tickets: z.number().int().optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// Admin forms send "" for a cleared date; omitted (undefined) must stay
// untouched on partial updates, null clears it.
const optionalDate = z.preprocess((val) => (val === "" ? null : val), z.coerce.date().nullable().optional());

const PartnerBaseSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  logo: z.string().max(MAX_IMAGE_CHARS, "Image is too large - please choose a smaller one").optional().nullable(),
  photo: z.string().max(MAX_IMAGE_CHARS, "Image is too large - please choose a smaller one").optional().nullable(),
  category: z.string().min(1),
  sponsored: z.boolean().default(false),
  contactInfo: z.string().optional().nullable(),
  email: optionalEmail,
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
  image: z.string().max(MAX_IMAGE_CHARS, "Image is too large - please choose a smaller one").optional().nullable(),
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
  // Tickets that must be collected in a round before its draw is scheduled.
  gamePrice: z.number().int().min(1),
  validityMonths: z.number().int().positive().default(3),
  active: z.boolean().default(true),
  // Coming soon until this date/time (ISO string); empty = playable right away.
  startsAt: optionalDate,
  drawStatus: z.enum(["pending", "eligible", "drawn", "cancelled"]).default("pending"),
  isDigitalPrize: z.boolean().default(false),
  secretCodes: z.array(z.string()).default([]),
  language: z.enum(["en", "th", "fr", "ar"]).default("en"),
  allowedCountries: z.array(z.string()).default(["TH"]),
});
export const CreateRaffleSchema = RaffleBaseSchema;
// prizesRemaining and drawStatus are system-managed (draws change them); the
// admin route derives prizesRemaining from prizesAvailable instead.
export const UpdateRaffleSchema = RaffleBaseSchema.omit({ prizesRemaining: true, drawStatus: true }).partial();
export type CreateRaffleInput = z.infer<typeof CreateRaffleSchema>;
export type UpdateRaffleInput = z.infer<typeof UpdateRaffleSchema>;

export const UploadSecretCodesSchema = z.object({
  raffleId: z.string().min(1),
  secretCodes: z.array(z.string()).min(1),
});
export type UploadSecretCodesInput = z.infer<typeof UploadSecretCodesSchema>;
