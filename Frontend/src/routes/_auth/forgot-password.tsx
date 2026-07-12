import { createFileRoute, redirect } from "@tanstack/react-router";

// Passwordless migration: there are no passwords to recover. Sign-in is a
// one-time email code, so /forgot-password redirects to the unified /login.
export const Route = createFileRoute("/_auth/forgot-password")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
