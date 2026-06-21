import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAdminLogin } from "@/features/auth/api";
import { useSession } from "@/features/auth/hooks/useSession";

export const Route = createFileRoute("/soliva-admin")({
  component: SolivaAdminLogin,
});

function SolivaAdminLogin() {
  const session    = useSession();
  const navigate   = useNavigate();
  const adminLogin = useAdminLogin();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  // Already signed in as admin → go straight to dashboard
  useEffect(() => {
    if (session?.user.role === "admin") {
      navigate({ to: "/admin/dashboard" });
    }
  }, [session, navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    adminLogin.mutate(
      { email: email.trim().toLowerCase(), password },
      { onSuccess: () => navigate({ to: "/admin/dashboard" }) },
    );
  }

  const err = adminLogin.error as any;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#100C09]">
      {/* ambient warm glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(184,132,69,0.10), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[22rem] px-4"
      >
        {/* Brand lockup */}
        <div className="mb-10 text-center">
          <p className="font-display text-[2rem] leading-none tracking-tight text-[#F7F3EC]">
            Soliva
          </p>
          <p className="mt-1.5 font-mono text-[0.5rem] tracking-[0.38em] uppercase text-[#B88445] font-bold">
            Operations Center
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-7 backdrop-blur-sm">
          <p className="mb-6 font-mono text-[0.5625rem] tracking-[0.26em] uppercase text-[#F7F3EC]/50 font-bold">
            Administrator Access
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[0.5rem] tracking-[0.22em] uppercase text-[#F7F3EC]/40 font-bold">
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-2.5 text-[0.875rem] text-[#F7F3EC] placeholder-white/20 outline-none transition-colors focus:border-[#B88445]/40 focus:bg-white/[0.07]"
                placeholder="admin@solivaguard.com"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[0.5rem] tracking-[0.22em] uppercase text-[#F7F3EC]/40 font-bold">
                Password
              </span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-2.5 text-[0.875rem] text-[#F7F3EC] placeholder-white/20 outline-none transition-colors focus:border-[#B88445]/40 focus:bg-white/[0.07]"
                placeholder="••••••••••"
              />
            </label>

            {err && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[0.75rem] text-red-400">
                {err?.message ?? "Invalid admin credentials"}
              </p>
            )}

            <button
              type="submit"
              disabled={adminLogin.isPending}
              className="mt-2 rounded-xl bg-[#B88445] px-6 py-2.5 font-mono text-[0.5625rem] tracking-[0.26em] uppercase font-bold text-[#100C09] transition-all hover:bg-[#D4A05C] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adminLogin.isPending ? "Verifying…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-[0.45rem] tracking-[0.22em] uppercase text-[#F7F3EC]/20">
          Authorised personnel only
        </p>
      </motion.div>
    </div>
  );
}
