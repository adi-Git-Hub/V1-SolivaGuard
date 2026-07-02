const { z } = require('zod');

const authValidator = {
  register: z.object({
    body: z.object({
      name: z.string().min(1, 'Name is required').max(50, 'Name cannot exceed 50 characters'),
      email: z.string().email('Invalid email format'),
      password: z.string()
        .min(12, 'Password must be at least 12 characters')
        .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/, 'Password must contain letters, numbers, and special characters'),
      username: z.string().min(3, 'Username must be at least 3 characters').optional(),
      phoneNumber: z.string().optional(),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  verifyEmail: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      otp: z.string().length(6, 'OTP must be 6 digits'),
    }),
  }),

  forgotPassword: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
    }),
  }),

  resetPassword: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      otp: z.string().length(6, 'OTP must be 6 digits'),
      password: z.string()
        .min(12, 'Password must be at least 12 characters')
        .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/, 'Password must contain letters, numbers, and special characters'),
    }),
  }),
};

module.exports = authValidator;