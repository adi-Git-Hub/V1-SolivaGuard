// Real auth client backed by the Soliva backend.
// Backend issues an httpOnly JWT cookie; lib/api.ts already sends
// `credentials: "include"` so every call carries the cookie automatically.
//
// Backend uses a uniform enveloped response for auth endpoints:
//   sendResponse → { success, message, data: { user } }
// (login, verify-email, reset-password, admin-login, /auth/me all return the
// user at res.data.user). The JWT is delivered as an httpOnly cookie, not in
// the body. We unwrap res.data.user per-endpoint so callers see a clean Session.

import { z } from "zod";

import { api, ApiError } from "./api";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["user", "admin"]),
  isVerified: z.boolean().optional(),
  username: z.string().optional(),
  // Account phone number (E.164-ish string as stored on the backend user doc),
  // or null when the user never provided one. Used to prefill checkout.
  phoneNumber: z.string().nullable().optional(),
  // Public URL of the uploaded avatar, or null when the user hasn't uploaded
  // one. The frontend Avatar component shows an initials fallback in that case.
  avatarUrl: z.string().nullable().optional(),
  // Account creation timestamp (ISO) — drives "Member Since" on the profile hub.
  createdAt: z.string().nullable().optional(),
  // Number of active login sessions on the backend user doc (security widget).
  sessionsCount: z.number().optional(),
});
export type User = z.infer<typeof userSchema>;

// We keep the `Session` type for backwards compatibility with components that
// read `session.user.name`. The cookie holds the actual session — the client
// never sees a token string.
export const sessionSchema = z.object({
  user: userSchema,
});
export type Session = z.infer<typeof sessionSchema>;

// Backend returns Mongo `_id`; map to a stable string `id` and validate shape.
function normalizeUser(raw: unknown): User {
  const r = raw as Record<string, unknown>;
  return userSchema.parse({
    id: String(r._id ?? r.id ?? ""),
    email: r.email,
    name: r.name,
    role: r.role,
    isVerified: r.isVerified,
    username: r.username,
    phoneNumber: (r.phoneNumber as string | null | undefined) ?? null,
    avatarUrl: ((r.avatarUrl as string | null | undefined) ?? null)
      ?.replace(/^http:\/\//, 'https://') ?? null,
    createdAt: (r.createdAt as string | null | undefined) ?? null,
    sessionsCount: Array.isArray(r.loginSessions) ? r.loginSessions.length : undefined,
  });
}

type EnvelopedResponse<T> = { success: boolean; message?: string; data: T };

export const authClient = {
  /** Returns the current session, or null if not signed in / cookie expired. */
  async me(): Promise<Session | null> {
    try {
      const res = await api.get<EnvelopedResponse<{ user: unknown }>>("/auth/me");
      return { user: normalizeUser(res.data.user) };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },

  async login(input: { email: string; password: string }): Promise<Session> {
    const res = await api.post<EnvelopedResponse<{ user: unknown }>>("/auth/login", input);
    return { user: normalizeUser(res.data.user) };
  },

  /**
   * Exchange a Firebase Google ID token for a Soliva session. The backend
   * verifies the token, creates the user on first login or signs in an existing
   * one, and sets the JWT cookie — same session shape as email/password login.
   */
  async googleSignIn(idToken: string): Promise<Session> {
    const res = await api.post<EnvelopedResponse<{ user: unknown }>>("/auth/google", {
      idToken,
    });
    return { user: normalizeUser(res.data.user) };
  },

  /** Returns the email the OTP was sent to. No session is created yet. */
  async register(input: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }): Promise<{ email: string }> {
    // Strip empty-string phone (backend treats undefined / absent as "no phone")
    const payload: Record<string, unknown> = {
      name: input.name,
      email: input.email,
      password: input.password,
    };
    if (input.phoneNumber && input.phoneNumber.trim()) {
      payload.phoneNumber = input.phoneNumber.trim();
    }
    await api.post<EnvelopedResponse<unknown>>("/auth/register", payload);
    return { email: input.email };
  },

  /** Verifies the registration OTP; backend issues the JWT cookie on success. */
  async verifyEmail(input: { email: string; otp: string }): Promise<Session> {
    const res = await api.post<EnvelopedResponse<{ user: unknown }>>("/auth/verify-email", input);
    return { user: normalizeUser(res.data.user) };
  },

  async resendOtp(email: string): Promise<void> {
    await api.post<EnvelopedResponse<unknown>>("/auth/resend-otp", { email });
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post<EnvelopedResponse<unknown>>("/auth/forgot-password", { email });
  },

  async verifyForgotOtp(input: { email: string; otp: string }): Promise<void> {
    await api.post<EnvelopedResponse<unknown>>("/auth/verify-forgot-otp", input);
  },

  /** Resets password and signs the user in (backend issues JWT cookie). */
  async resetPassword(input: { email: string; otp: string; password: string }): Promise<Session> {
    const res = await api.post<EnvelopedResponse<{ user: unknown }>>("/auth/reset-password", input);
    return { user: normalizeUser(res.data.user) };
  },

  async adminLogin(input: { email: string; password: string }): Promise<Session> {
    const res = await api.post<EnvelopedResponse<{ user: unknown }>>("/auth/admin-login", input);
    return { user: normalizeUser(res.data.user) };
  },

  async logout(): Promise<void> {
    await api.get<EnvelopedResponse<unknown>>("/auth/logout");
  },
};
