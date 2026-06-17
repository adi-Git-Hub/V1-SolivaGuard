import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Check,
  Mail,
  RefreshCw,
  Sun,
  Feather,
  ShieldCheck,
  ThermometerSun,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState, useEffect, type ClipboardEvent, type KeyboardEvent, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRegister, useVerifyEmail, useResendOtp } from "@/features/auth/api";
import { registerSchema, type RegisterInput } from "@/features/auth/schema";
import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";

export const Route = createFileRoute("/_auth/register")({
  component: RegisterRoute,
});

const RESEND_SECONDS = 30;
const PRODUCT_RENDER = "/new_brown-removebg-preview.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const TRUST = [
  { icon: Sun, title: "Advanced UV Defense", copy: "Engineered for long commutes and daily exposure." },
  { icon: Feather, title: "Breathable Comfort", copy: "Lightweight construction designed for everyday wear." },
  { icon: ShieldCheck, title: "Thoughtful Coverage", copy: "Protection without compromising movement." },
  { icon: ThermometerSun, title: "Built for Indian Summers", copy: "Designed for heat, dust and sunlight." },
];

function RegisterRoute() {
  const navigate = useNavigate();
  const reg = useRegister();
  const verify = useVerifyEmail();
  const resend = useResendOtp();

  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(0);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otp = otpDigits.join("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm: "",
      phoneNumber: "",
      otpChannel: "email",
      agreeToTerms: false,
    },
  });

  const email = watch("email");
  const agreed = watch("agreeToTerms");
  // Guard against losing typed details before the account is created.
  const formDirty =
    !verified && [watch("name"), email, watch("password"), watch("confirm")].some((v) => (v ?? "").trim() !== "");

  const step: "details" | "verify" | "complete" = verified
    ? "complete"
    : otpSent
      ? "verify"
      : "details";

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleSendOTP = async () => {
    const isValid = await trigger();
    if (!isValid) return;
    try {
      await reg.mutateAsync(watch());
      setOtpSent(true);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimer(RESEND_SECONDS);
      toast.success("Verification code sent to " + email);
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send verification code");
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    try {
      await resend.mutateAsync(email);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimer(RESEND_SECONDS);
      otpRefs.current[0]?.focus();
      toast.success("New code sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend code");
    }
  };

  const runVerify = async (code: string) => {
    if (code.length !== 6 || verify.isPending || verified) return;
    try {
      // Verifying the OTP both creates the account and issues the session cookie.
      await verify.mutateAsync({ email, otp: code });
      setVerified(true);
    } catch (err) {
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      toast.error(err instanceof Error ? err.message : "Invalid or expired code");
    }
  };

  // Auto-verify the moment all 6 digits are present.
  useEffect(() => {
    if (otpSent && !verified && otp.length === 6) void runVerify(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, otpSent, verified]);

  const setDigit = (i: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[i] = char;
      return next;
    });
    if (char && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const onOtpKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const onOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((d, idx) => (next[idx] = d));
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const onComplete = () => navigate({ to: "/" });

  return (
    <div className="lg:fixed lg:inset-0 min-h-screen lg:h-screen flex flex-col lg:flex-row bg-[#FAF7F3] lg:overflow-hidden">

      {/* ════════════ LEFT — BRAND EXPERIENCE (desktop only) ════════════ */}
      <aside className="relative hidden lg:flex lg:w-[48%] h-full flex-col justify-between bg-[#3a2a22] px-12 xl:px-16 py-12 overflow-hidden">
        {/* ambient glow */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-8%] w-[55%] h-[55%] rounded-full bg-[#c76600]/15 blur-[120px]" />
          <div className="absolute bottom-[-6%] left-[-6%] w-[40%] h-[40%] rounded-full bg-[#FAF7F3]/[0.05] blur-[100px]" />
        </div>

        {/* TOP — logo, top-left */}
        {/* CENTER — hero headline + copy + floating product render */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-6">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[#FAF7F3] tracking-tight leading-[0.98] text-[clamp(3.25rem,5vw,5.25rem)]"
          >
            Protection.<br />
            <span className="italic font-light text-[#c76600]">Designed for movement.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-md text-[#FAF7F3]/70 font-light leading-relaxed text-[15px]"
          >
            Built for commuters, travelers and everyday movement. Thoughtful protection
            engineered for heat, dust, UV exposure and long hours outdoors.
          </motion.p>

          {/* floating SunWrap render with soft spotlight */}
          <div className="relative mt-2 flex-1 min-h-[16vh] flex items-center justify-center">
            <div className="absolute w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(199,102,0,0.35)_0%,transparent_70%)] blur-2xl" />
            <motion.img
              src={PRODUCT_RENDER}
              alt="Soliva SunWrap"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
              transition={{
                opacity: { duration: 1, delay: 0.4 },
                scale: { duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              }}
              className="relative z-10 max-h-[30vh] w-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
            />
          </div>
        </div>

        {/* BOTTOM — trust grid + footnote */}
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
          <div className="flex items-center gap-2 pt-1">
            <span className="h-px w-7 bg-[#FAF7F3]/30" />
            <span className="text-[10px] uppercase tracking-[0.32em] text-[#FAF7F3]/60 font-bold">
              Editorial No. 01 — The Collective
            </span>
          </div>
        </div>
      </aside>

      {/* ════════════ RIGHT — ACCOUNT CREATION ════════════ */}
      <main className="w-full lg:w-[52%] lg:h-screen lg:overflow-y-auto custom-scrollbar flex flex-col justify-center bg-[#FAF7F3] px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-[440px] mx-auto">

          {/* header */}
          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeInUp} className="mb-6">
            <h2 className="font-display text-[2rem] leading-tight text-[#3a2a22] tracking-tight">Create Account</h2>
            <p className="mt-1 text-ink-muted font-light text-[15px]">Start your collection. Just a few details.</p>
          </motion.div>

          {/* step indicator */}
          <motion.div custom={1} initial="hidden" animate="visible" variants={fadeInUp} className="mb-8 flex items-center">
            <StepDot label="Account Details" state={step === "details" ? "active" : "done"} />
            <StepLine done={step !== "details"} />
            <StepDot label="Email Verification" state={step === "verify" ? "active" : step === "complete" ? "done" : "todo"} />
            <StepLine done={step === "complete"} />
            <StepDot label="Complete" state={step === "complete" ? "active" : "todo"} />
          </motion.div>

          {/* google */}
          <motion.div custom={2} initial="hidden" animate="visible" variants={fadeInUp}>
            <GoogleAuthButton />
          </motion.div>

          {/* divider */}
          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeInUp} className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-[#3a2a22]/10" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-muted/45 font-bold">Or create with email</span>
            <span className="h-px flex-1 bg-[#3a2a22]/10" />
          </motion.div>

          <form onSubmit={handleSubmit(handleSendOTP)} className="space-y-5" noValidate>
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" error={errors.name?.message}>
                <Input
                  id="name"
                  autoComplete="name"
                  disabled={otpSent}
                  placeholder="Aditya Sharma"
                  className="bg-white border-black/5 rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-[#c76600]/10 disabled:opacity-60"
                  {...register("name")}
                />
              </Field>
              <Field
                label="Email Address"
                error={errors.email?.message}
                badge={verified ? <VerifiedBadge /> : undefined}
              >
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={otpSent}
                  placeholder="aditya@example.com"
                  className={`bg-white border-black/5 rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-[#c76600]/10 disabled:opacity-70 ${verified ? "!border-green-500/40" : ""}`}
                  {...register("email")}
                />
              </Field>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Password" error={errors.password?.message}>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  disabled={otpSent}
                  className="bg-white border-black/5 rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-[#c76600]/10 disabled:opacity-60"
                  {...register("password")}
                />
              </Field>
              <Field label="Confirm Password" error={errors.confirm?.message}>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  disabled={otpSent}
                  className="bg-white border-black/5 rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-[#c76600]/10 disabled:opacity-60"
                  {...register("confirm")}
                />
              </Field>
            </div>

            {/* agreement (details step only) */}
            {!otpSent && (
              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={!!agreed}
                    onCheckedChange={(v) => setValue("agreeToTerms", v === true, { shouldValidate: true })}
                    className="mt-0.5 rounded-md border-black/15 data-[state=checked]:bg-[#c76600] data-[state=checked]:border-[#c76600]"
                  />
                  <Label htmlFor="agreeToTerms" className="text-xs font-light text-ink-muted leading-relaxed">
                    I agree to the{" "}
                    <Link to="/terms" target="_blank" className="text-[#3a2a22] font-semibold underline underline-offset-4 decoration-black/10 hover:decoration-[#c76600] transition-colors">
                      Terms &amp; Privacy Policy
                    </Link>
                    .
                  </Label>
                </div>
                {errors.agreeToTerms && <p className="text-[10px] text-red-500 font-medium pl-7">{errors.agreeToTerms.message}</p>}
              </div>
            )}

            {/* ── OTP SECTION ── */}
            <AnimatePresence>
              {otpSent && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-[#c76600]/20 bg-white p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c76600]/10 text-[#c76600]">
                        <Mail size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-muted/60">Email Verification</p>
                        <p className="text-xs text-brown-deep truncate">
                          Enter the 6-digit code sent to <span className="font-semibold">{email}</span>
                        </p>
                      </div>
                    </div>

                    {!verified ? (
                      <>
                        <div className="flex justify-between gap-2" onPaste={onOtpPaste}>
                          {otpDigits.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => (otpRefs.current[i] = el)}
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={1}
                              value={digit}
                              disabled={verify.isPending}
                              onChange={(e) => setDigit(i, e.target.value)}
                              onKeyDown={(e) => onOtpKeyDown(i, e)}
                              className="h-13 w-full aspect-square max-w-[52px] rounded-xl border border-black/10 bg-[#FAF7F3] text-center text-xl font-display text-brown-deep focus:border-[#c76600] focus:ring-2 focus:ring-[#c76600]/15 outline-none transition-all disabled:opacity-60"
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[11px] text-ink-muted/60 font-medium">
                            {verify.isPending ? "Verifying…" : "Verifies automatically"}
                          </span>
                          <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={timer > 0 || resend.isPending}
                            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-ink-muted hover:text-[#c76600] transition-colors disabled:opacity-40"
                          >
                            <RefreshCw size={11} className={resend.isPending ? "animate-spin" : ""} />
                            {timer > 0 ? `Available in ${timer}s` : "Resend OTP"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 420, damping: 24 }}
                        className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-600"
                      >
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-semibold">Email Verified</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── PRIMARY CTA ── */}
            {!otpSent && (
              <button
                type="submit"
                disabled={reg.isPending}
                className="group h-13 w-full rounded-xl bg-[#c76600] text-white text-xs font-bold uppercase tracking-[0.15em] shadow-xl shadow-[#c76600]/20 transition-all duration-300 hover:bg-[#a55500] hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
              >
                {reg.isPending ? (
                  <Spinner label="Sending Code…" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Send Verification Code
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            )}

            {otpSent && !verified && (
              <button
                type="button"
                disabled
                className="h-13 w-full rounded-xl bg-[#3a2a22]/10 text-[#3a2a22]/60 text-xs font-bold uppercase tracking-[0.15em] cursor-default"
              >
                <span className="flex items-center justify-center gap-2">
                  <Check size={15} /> Verification Code Sent
                </span>
              </button>
            )}

            {verified && (
              <motion.button
                type="button"
                onClick={onComplete}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group h-13 w-full rounded-xl bg-[#3a2a22] text-white text-xs font-bold uppercase tracking-[0.15em] shadow-xl shadow-[#3a2a22]/20 transition-all duration-300 hover:bg-black hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center gap-2">
                  Create Account
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </motion.button>
            )}

            {!otpSent && (
              <div className="flex items-center justify-center gap-3 text-xs pt-1">
                <span className="text-ink-muted font-light">Already have an account?</span>
                <Link to="/login" className="text-[#3a2a22] font-bold uppercase tracking-widest hover:text-[#c76600] transition-colors">
                  Sign In
                </Link>
              </div>
            )}
          </form>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3a2a2218; border-radius: 10px; }
        .h-13 { height: 3.25rem; }
      `}</style>
    </div>
  );
}

/* ── small presentational helpers ── */

function Field({
  label,
  error,
  badge,
  children,
}: {
  label: string;
  error?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-0.5">
        <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-ink-muted/60">{label}</span>
        {badge}
      </div>
      {children}
      {error && <p className="text-[10px] text-red-500 font-medium px-0.5">{error}</p>}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-green-600"
    >
      <CheckCircle2 size={10} /> Verified
    </motion.span>
  );
}

function StepDot({ label, state }: { label: string; state: "active" | "done" | "todo" }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
          state === "done"
            ? "bg-green-500 text-white"
            : state === "active"
              ? "bg-[#c76600] text-white"
              : "border border-black/15 bg-transparent text-ink-muted/40"
        }`}
      >
        {state === "done" ? <Check size={11} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      <span
        className={`text-[10px] font-bold uppercase tracking-[0.1em] whitespace-nowrap transition-colors ${
          state === "todo" ? "text-ink-muted/40" : "text-[#3a2a22]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StepLine({ done }: { done: boolean }) {
  return <span className={`mx-2 h-px flex-1 ${done ? "bg-green-500/50" : "bg-black/10"}`} />;
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center gap-3">
      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      {label}
    </span>
  );
}
