import { createFileRoute, redirect } from "@tanstack/react-router";

// Passwordless migration: there is no separate "create account" step anymore.
// Signing in with an email that has no account auto-creates one, so /register
// simply funnels users to the unified email-OTP screen at /login.
export const Route = createFileRoute("/_auth/register")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/login", search: search as { redirect?: string } });
  },
  component: () => null,
});
