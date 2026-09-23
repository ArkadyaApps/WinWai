import { z } from "zod";

export const EmailSignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  referralCode: z.string().optional(),
});
export type EmailSignUpInput = z.infer<typeof EmailSignUpSchema>;

export const EmailSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type EmailSignInInput = z.infer<typeof EmailSignInSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  resetToken: z.string().min(1),
  newPassword: z.string().min(6),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const GoogleSignInSchema = z.object({
  id_token: z.string().min(1),
});
export type GoogleSignInInput = z.infer<typeof GoogleSignInSchema>;
