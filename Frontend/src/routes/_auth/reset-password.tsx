import { createFileRoute, redirect } from "@tanstack/react-router";

// Passwordless migration: there are no passwords to reset. Sign-in is a
// one-time email code, so /reset-password redirects to the unified /login.
export const Route = createFileRoute("/_auth/reset-password")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
