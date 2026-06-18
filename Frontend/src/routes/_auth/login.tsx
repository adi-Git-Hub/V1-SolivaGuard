import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Sun,
  Feather,
  ShieldCheck,
  ThermometerSun,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, forwardRef, type InputHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useLogin } from "@/features/auth/api";
import { loginSchema, type LoginInput } from "@/features/auth/schema";
import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";
import { ParticleLogo } from "@/components/ParticleLogo";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/_auth/login")({
  validateSearch: (s) => searchSchema.parse(s),
  component: LoginRoute,
});

const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const TRUST = [
  { icon: Sun, title: "Advanced UV Defense", copy: "Designed for long outdoor exposure." },
  { icon: Feather, title: "Breathable Comfort", copy: "Built for everyday movement." },
  { icon: ShieldCheck, title: "Thoughtful Coverage", copy: "Protection without compromise." },
  { icon: ThermometerSun, title: "Built for Indian Summers", copy: "Engineered for real conditions." },
];

function LoginRoute() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const login = useLogin();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      setSuccess(true);
      toast.success("Welcome back");
      // brief success transition before leaving the page
      setTimeout(() => navigate({ to: redirect ?? "/" }), 650);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
    }
  });

  return (
    <div className="fixed inset-0 z-20 flex flex-col lg:flex-row bg-[#FAF7F3] overflow-y-auto lg:overflow-hidden">

      {/* ════════════ LEFT — BRAND EXPERIENCE (desktop only) ════════════ */}
      <aside className="relative hidden lg:flex lg:w-[48%] h-full flex-col justify-between bg-[#3a2a22] px-12 xl:px-16 py-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-8%] w-[55%] h-[55%] rounded-full bg-[#c76600]/15 blur-[120px]" />
          <div className="absolute bottom-[-6%] left-[-6%] w-[40%] h-[40%] rounded-full bg-[#FAF7F3]/[0.05] blur-[100px]" />
        </div>

        {/* hero */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-6">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[#FAF7F3] tracking-tight leading-[1.08] text-[clamp(1.75rem,2.6vw,2.4rem)]"
          >
            Welcome Back.{" "}
            <span className="italic font-light text-[#c76600]">Continue your movement.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-md text-[#FAF7F3]/70 font-light leading-relaxed text-[15px]"
          >
            Your collection. Your protection. Your journey continues here.
          </motion.p>

          {/* 3D mouse-reactive Soliva logo */}
          <div className="relative mt-4 flex-1 min-h-[30vh] flex items-center justify-center">
            <div className="absolute w-[55%] h-[55%] rounded-full bg-[radial-gradient(circle,rgba(199,102,0,0.30)_0%,transparent_70%)] blur-2xl" />
            <ParticleLogo color="#e3c187" className="relative z-10 h-full w-full" />
          </div>
        </div>

        {/* trust grid + footnote */}
        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {TRUST.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c76600]/15 border border-[#c76600]/25 text-[#c76600]">
                  <Icon size={15} strokeWidth={2} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[13px] font-semibold text-[#FAF7F3] leading-tight">{title}</p>
                  <p className="text-[11px] text-[#FAF7F3]/55 font-light leading-snug">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ════════════ RIGHT — SIGN-IN CARD ════════════ */}
      <main className="relative w-full lg:w-[52%] min-h-screen lg:min-h-0 lg:h-screen flex flex-col justify-center bg-[#FAF7F3] px-6 py-12 sm:px-10 lg:px-16 lg:overflow-hidden">
        {/* background system — soft mesh, glow, grain, depth */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(60% 50% at 80% 10%, rgba(199,102,0,0.10) 0%, transparent 60%)," +
                "radial-gradient(50% 50% at 10% 90%, rgba(216,180,150,0.18) 0%, transparent 60%)," +
                "radial-gradient(40% 40% at 50% 50%, rgba(255,255,255,0.35) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          className="relative z-10 w-full max-w-[480px] mx-auto"
        >
          {/* glass card */}
          <motion.div
            custom={1}
            variants={fadeInUp}
            className="rounded-[28px] border border-white/70 bg-white/70 p-7 sm:p-9 shadow-[0_24px_70px_-20px_rgba(58,42,34,0.28)] backdrop-blur-xl"
          >
            {/* title */}
            <div className="mb-7">
              <h2 className="font-display text-[2rem] leading-tight text-[#3a2a22] tracking-tight">Sign In</h2>
              <p className="mt-1 text-ink-muted font-light text-[15px]">Welcome back. Continue your ritual.</p>
            </div>

            {/* google */}
            <GoogleAuthButton redirectTo={redirect ?? "/"} />

            {/* divider */}
            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#3a2a22]/10" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-muted/45 font-bold">Or continue with email</span>
              <span className="h-px flex-1 bg-[#3a2a22]/10" />
            </div>

            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <FloatingField
                id="email"
                label="Email Address"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />

              <FloatingField
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                topRight={
                  <Link
                    to="/forgot-password"
                    className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted/60 hover:text-[#c76600] transition-colors"
                  >
                    Forgot?
                  </Link>
                }
                {...register("password")}
              />

              <button
                type="submit"
                disabled={isSubmitting || success}
                className={`group h-13 w-full rounded-2xl text-xs font-bold uppercase tracking-[0.15em] text-white shadow-xl transition-all duration-300 disabled:translate-y-0 ${
                  success
                    ? "bg-green-600 shadow-green-600/20"
                    : "bg-[#c76600] shadow-[#c76600]/20 hover:bg-[#a55500] hover:-translate-y-0.5 disabled:opacity-70"
                }`}
              >
                {success ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={15} /> Signed In
                  </span>
                ) : isSubmitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            </form>
          </motion.div>

          {/* secondary link */}
          <motion.div custom={2} variants={fadeInUp} className="mt-6 flex items-center justify-center gap-3 text-xs">
            <span className="text-ink-muted font-light">New to Soliva?</span>
            <Link to="/register" className="text-[#3a2a22] font-bold uppercase tracking-widest hover:text-[#c76600] transition-colors">
              Create Account
            </Link>
          </motion.div>
        </motion.div>
      </main>

      <style>{`.h-13 { height: 3.25rem; }`}</style>
    </div>
  );
}

/* ── floating-label input ── */

type FloatingFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  topRight?: React.ReactNode;
};

const FloatingField = forwardRef<HTMLInputElement, FloatingFieldProps>(
  ({ id, label, error, topRight, className, ...props }, ref) => (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          id={id}
          ref={ref}
          placeholder=" "
          className="peer h-14 w-full rounded-2xl border border-[#3a2a22]/10 bg-white/80 px-4 pt-4 text-sm text-[#3a2a22] shadow-sm outline-none transition-all duration-200 placeholder-transparent focus:border-[#c76600]/40 focus:bg-white focus:ring-4 focus:ring-[#c76600]/10 focus:shadow-md"
          {...props}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-light text-ink-muted/60 transition-all duration-200 peer-focus:top-3.5 peer-focus:translate-y-0 peer-focus:text-[9px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-[0.18em] peer-focus:text-[#c76600] peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[9px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.18em]"
        >
          {label}
        </label>
        {topRight && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{topRight}</div>}
      </div>
      {error && <p className="text-[11px] font-medium text-red-500 px-1">{error}</p>}
    </div>
  ),
);
FloatingField.displayName = "FloatingField";
