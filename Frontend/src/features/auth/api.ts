import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { cartKeys, mergeGuestCartIntoServer } from "@/features/cart/api";
import { sessionQueryKey } from "./hooks/useSession";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./schema";

// Best-effort: merge the guest cart into the server cart after a successful
// auth event. Never throws — if the merge fails the user just keeps their
// guest cart as-is and can manually re-add items.
async function mergeGuestCartSafely(qc: ReturnType<typeof useQueryClient>) {
  try {
    await mergeGuestCartIntoServer();
  } catch (err) {
    // Surfaced in dev console; intentional silent fail for prod.
    if (import.meta.env.DEV) {
      console.warn("[cart] guest→server merge failed", err);
    }
  } finally {
    qc.invalidateQueries({ queryKey: cartKeys.current() });
  }
}

// All mutations that may change the session invalidate the session cache so
// useSession() instantly re-reads from /auth/me. Mutations that only kick off
// a server-side email (forgotPassword, resendOtp) do not invalidate.

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authClient.login(input),
    onSuccess: async (session) => {
      qc.setQueryData(sessionQueryKey, session);
      qc.invalidateQueries({ queryKey: sessionQueryKey });
      await mergeGuestCartSafely(qc);
    },
  });
}

// ── Passwordless sign-in (unified login + signup via email OTP) ──

export function useRequestOtp() {
  // Step 1: only sends the code email; no session change, so nothing to
  // invalidate. The component moves to the code-entry step on success.
  return useMutation({
    mutationFn: (email: string) => authClient.requestOtp(email),
  });
}

export function useVerifyOtp() {
  const qc = useQueryClient();
  return useMutation({
    // Step 2: creates/refreshes the session cookie (existing user OR brand-new
    // auto-created account) → refresh session + merge guest cart, like useLogin.
    mutationFn: (input: { email: string; otp: string }) => authClient.verifyOtp(input),
    onSuccess: async (session) => {
      qc.setQueryData(sessionQueryKey, session);
      qc.invalidateQueries({ queryKey: sessionQueryKey });
      await mergeGuestCartSafely(qc);
    },
  });
}

export function useCheckEmail() {
  // Silent lookup only — never changes the session, so nothing to invalidate.
  return useMutation({
    mutationFn: (email: string) => authClient.checkEmail(email),
  });
}

export function useAdminLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => authClient.adminLogin(input),
    onSuccess: (session) => {
      qc.setQueryData(sessionQueryKey, session);
      qc.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
}

export function useRegister() {
  // Register itself does NOT create a session — backend sends an OTP email.
  // The component handles OTP verification on the same page after success.
  return useMutation({
    mutationFn: (input: RegisterInput) => authClient.register(input),
  });
}

export function useGoogleAuth() {
  const qc = useQueryClient();
  return useMutation({
    // Takes the Firebase ID token from the Google popup and trades it for a
    // Soliva session. Mirrors useLogin: refresh the session, merge guest cart.
    mutationFn: (idToken: string) => authClient.googleSignIn(idToken),
    onSuccess: async (session) => {
      qc.setQueryData(sessionQueryKey, session);
      qc.invalidateQueries({ queryKey: sessionQueryKey });
      await mergeGuestCartSafely(qc);
    },
  });
}

export function useVerifyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VerifyEmailInput & { email: string }) =>
      authClient.verifyEmail({ email: input.email, otp: input.otp }),
    onSuccess: async (session) => {
      qc.setQueryData(sessionQueryKey, session);
      qc.invalidateQueries({ queryKey: sessionQueryKey });
      await mergeGuestCartSafely(qc);
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (email: string) => authClient.resendOtp(email),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    // Clear the backend session AND the Firebase client session so a Google
    // user is fully signed out (no lingering Firebase auth state).
    mutationFn: async () => {
      await authClient.logout();
      // Isolate Firebase from initial bundle via dynamic import
      const { signOutFirebase } = await import("@/lib/firebase");
      await signOutFirebase();
    },
    onSuccess: () => {
      // Clear the session immediately; do not refetch — the cookie is gone.
      qc.setQueryData(sessionQueryKey, null);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => authClient.forgotPassword(input.email),
  });
}

// ── Account deletion (soft-delete + anonymize, OTP-gated) ──

export function useRequestAccountDeletionOtp() {
  // Only emails the confirmation code; no session change to invalidate.
  return useMutation({
    mutationFn: () => authClient.requestAccountDeletionOtp(),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (otp: string) => {
      await authClient.deleteAccount(otp);
      // Clear the Firebase client session too (Google accounts) so no auth
      // state lingers — mirrors useLogout.
      try {
        const { signOutFirebase } = await import("@/lib/firebase");
        await signOutFirebase();
      } catch {
        /* backend session is already gone; ignore */
      }
    },
    onSuccess: () => {
      // The backend wiped every session — drop the local session immediately.
      qc.setQueryData(sessionQueryKey, null);
    },
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ResetPasswordInput & { email: string }) =>
      authClient.resetPassword({
        email: input.email,
        otp: input.otp,
        password: input.password,
      }),
    onSuccess: async (session) => {
      qc.setQueryData(sessionQueryKey, session);
      qc.invalidateQueries({ queryKey: sessionQueryKey });
      await mergeGuestCartSafely(qc);
    },
  });
}

// ── Phone OTP (MSG91) ────────────────────────────────────────────────────────

// Public runtime flags. `phoneOtpEnabled` is false until MSG91 credentials are
// set on the backend, so every phone-OTP UI affordance stays hidden until then.
export function usePublicConfig() {
  return useQuery({
    queryKey: ["system", "config"],
    queryFn: () => authClient.getPublicConfig(),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

// Phone sign-in (existing accounts). Step 1 sends the code; step 2 verifies and
// creates the session (same onSuccess as email OTP — refresh session, merge cart).
export function useRequestPhoneLoginOtp() {
  return useMutation({
    mutationFn: (phone: string) => authClient.requestPhoneLoginOtp(phone),
  });
}

export function useVerifyPhoneLoginOtp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { phone: string; otp: string }) => authClient.verifyPhoneLoginOtp(input),
    onSuccess: async (session) => {
      qc.setQueryData(sessionQueryKey, session);
      qc.invalidateQueries({ queryKey: sessionQueryKey });
      await mergeGuestCartSafely(qc);
    },
  });
}

// Ownership verification (registration / guest checkout / profile phone-change).
// Step 1 sends the code; step 2 returns a proof token — neither touches session.
export function useSendPhoneOtp() {
  return useMutation({
    mutationFn: (input: { phone: string; purpose?: "verify" | "update" }) =>
      authClient.sendPhoneOtp(input.phone, input.purpose ?? "verify"),
  });
}

export function useVerifyPhoneOtp() {
  return useMutation({
    mutationFn: (input: { phone: string; otp: string; purpose?: "verify" | "update" }) =>
      authClient.verifyPhoneOtp(input),
  });
}

// Save a verified phone on the signed-in account → refresh the session so the
// new number shows immediately.
export function useUpdatePhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { phone: string; phoneVerifyToken: string }) =>
      authClient.updatePhone(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
}
