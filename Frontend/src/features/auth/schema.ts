import { z } from "zod";

// Backend password rule (validators/authValidator.js):
//   /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/
// We keep the regex (letter + digit + special) but require 8 chars for UX.
const passwordRule = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-zA-Z]/, "Add at least one letter")
  .regex(/[0-9]/, "Add at least one number")
  .regex(/[@$!%*?&]/, "Add one special character (@ $ ! % * ? &)");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Passwordless sign-in (unified login + signup via email OTP).
// Step 1 collects the email; step 2 collects the 6-digit code.
export const requestOtpSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const otpCodeSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type OtpCodeInput = z.infer<typeof otpCodeSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Tell us your name"),
    email: z.string().email("Enter a valid email"),
    // Optional today (only collected). Will become required once we wire SMS OTP.
    phoneNumber: z
      .string()
      .trim()
      .regex(/^[+0-9\s\-()]{8,20}$/, "Enter a valid phone number")
      .or(z.literal(""))
      .optional(),
    password: passwordRule,
    confirm: z.string().min(1, "Re-enter your password"),
    // UI choice only — backend always emails for now (SMS provider not wired).
    otpChannel: z.enum(["email", "phone"]).default("email"),
    agreeToTerms: z.boolean().refine((v) => v === true, {
      message: "Please accept the Terms & Privacy Policy to continue",
    }),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Backend reset-password expects { email, otp, password }.
// The form carries email via URL search param; user types otp + new password.
export const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, "Enter the 6-digit code"),
    password: passwordRule,
    confirm: z.string().min(1, "Re-enter your password"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
