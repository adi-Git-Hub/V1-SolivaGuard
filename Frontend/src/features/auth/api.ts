import { useMutation, useQueryClient } from "@tanstack/react-query";

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
