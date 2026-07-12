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

import { api, ApiError, assetUrl } from "./api";

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
    avatarUrl: assetUrl((r.avatarUrl as string | null | undefined) ?? null),
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
   * Passwordless sign-in — step 1. Sends a 6-digit code to the email. This is a
   * unified entry point: it works for existing accounts (Google OR email) and
   * for brand-new emails alike, so the response is intentionally identical
   * either way (no account enumeration). No session is created yet.
   */
  async requestOtp(email: string): Promise<{ email: string }> {
    await api.post<EnvelopedResponse<unknown>>("/auth/request-otp", { email });
    return { email };
  },

  /**
   * Passwordless sign-in — step 2. Verifies the code; the backend logs in the
   * existing user or auto-creates a passwordless account, then sets the JWT
   * cookie — same Session shape as every other auth path.
   */
  async verifyOtp(input: { email: string; otp: string }): Promise<Session> {
    const res = await api.post<EnvelopedResponse<{ user: unknown }>>("/auth/verify-otp", input);
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
    const res = await api.post<EnvelopedResponse<{ user: unknown }>>("/auth/confirm-email", input);
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

  /**
   * Silent existence check for the checkout Contact Information step. Reveals
   * whether the email has a real account (unlike requestOtp, which never
   * does) so the UI can offer Sign In / Use Another Email inline.
   */
  async checkEmail(email: string): Promise<{ exists: boolean; accountType: "guest" | "registered" | null }> {
    const res = await api.post<EnvelopedResponse<{ exists: boolean; accountType: "guest" | "registered" | null }>>(
      "/auth/check-email",
      { email },
    );
    return res.data;
  },

  async adminLogin(input: { email: string; password: string }): Promise<Session> {
    const res = await api.post<EnvelopedResponse<{ user: unknown }>>("/auth/admin-login", input);
    return { user: normalizeUser(res.data.user) };
  },

  async logout(): Promise<void> {
    await api.get<EnvelopedResponse<unknown>>("/auth/logout");
  },

  /**
   * Account deletion — step 1. Emails a 6-digit confirmation code to the
   * logged-in account's own address. No body needed; the backend reads the
   * user from the session cookie.
   */
  async requestAccountDeletionOtp(): Promise<void> {
    await api.post<EnvelopedResponse<unknown>>("/auth/delete-account/request-otp", {});
  },

  /**
   * Account deletion — step 2. Verifies the code, then the backend soft-deletes
   * + anonymizes the account and wipes every session (so the cookie is dead).
   */
  async deleteAccount(otp: string): Promise<void> {
    await api.post<EnvelopedResponse<unknown>>("/auth/delete-account", { otp });
  },

  // ── Phone OTP (MSG91) ──────────────────────────────────────────────────────

  /** Public runtime flags — `phoneOtpEnabled` gates every phone-OTP affordance. */
  async getPublicConfig(): Promise<{ phoneOtpEnabled: boolean }> {
    const res = await api.get<EnvelopedResponse<{ phoneOtpEnabled: boolean }>>("/system/config");
    return res.data;
  },

  /** Phone sign-in — step 1. Sends a code to an existing account's mobile. */
  async requestPhoneLoginOtp(phone: string): Promise<{ phone: string }> {
    const res = await api.post<EnvelopedResponse<{ phone: string }>>(
      "/auth/phone/login/request-otp",
      { phone },
    );
    return res.data;
  },

  /** Phone sign-in — step 2. Verifies the code → sets the JWT cookie. */
  async verifyPhoneLoginOtp(input: { phone: string; otp: string }): Promise<Session> {
    const res = await api.post<EnvelopedResponse<{ user: unknown }>>(
      "/auth/phone/login/verify-otp",
      input,
    );
    return { user: normalizeUser(res.data.user) };
  },

  /**
   * Ownership verification — step 1. Sends a code to any mobile (registration /
   * guest checkout / profile phone-change). No session is created.
   */
  async sendPhoneOtp(phone: string, purpose: "verify" | "update" = "verify"): Promise<{ phone: string }> {
    const res = await api.post<EnvelopedResponse<{ phone: string }>>("/auth/phone/send-otp", {
      phone,
      purpose,
    });
    return res.data;
  },

  /**
   * Ownership verification — step 2. Verifies the code → returns a short-lived
   * proof token a later write presents to prove the number was verified.
   */
  async verifyPhoneOtp(input: {
    phone: string;
    otp: string;
    purpose?: "verify" | "update";
  }): Promise<{ phone: string; phoneVerifyToken: string }> {
    const res = await api.post<EnvelopedResponse<{ phone: string; phoneVerifyToken: string }>>(
      "/auth/phone/verify",
      input,
    );
    return res.data;
  },

  /** Save a verified phone on the signed-in account (profile phone-change). */
  async updatePhone(input: { phone: string; phoneVerifyToken: string }): Promise<{ phoneNumber: string }> {
    const res = await api.patch<EnvelopedResponse<{ user: { phoneNumber: string } }>>(
      "/users/me/phone",
      input,
    );
    return res.data.user;
  },
};
