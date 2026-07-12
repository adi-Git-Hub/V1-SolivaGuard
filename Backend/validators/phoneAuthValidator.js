const { z } = require('zod');

// Loose phone shape — server-side normalizePhone() does the real validation and
// canonicalization. We only reject obviously malformed input here.
const phone = z
  .string()
  .trim()
  .regex(/^[+0-9\s\-()]{8,20}$/, 'Enter a valid mobile number');

const otp = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code');

const phoneAuthValidator = {
  // Phone login (existing users).
  loginRequest: z.object({
    body: z.object({ phone }),
  }),
  loginVerify: z.object({
    body: z.object({ phone, otp }),
  }),

  // Generic ownership verification (registration / checkout / profile).
  sendOtp: z.object({
    body: z.object({
      phone,
      purpose: z.enum(['login', 'verify', 'update']).optional(),
    }),
  }),
  verify: z.object({
    body: z.object({
      phone,
      otp,
      purpose: z.enum(['login', 'verify', 'update']).optional(),
    }),
  }),

  // Authenticated phone change (profile) — carries the proof token.
  updatePhone: z.object({
    body: z.object({
      phone,
      phoneVerifyToken: z.string().min(10, 'Please verify your mobile number first'),
    }),
  }),
};

module.exports = phoneAuthValidator;
