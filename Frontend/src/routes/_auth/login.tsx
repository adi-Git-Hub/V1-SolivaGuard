import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Smartphone,
  RefreshCw,
  Sun,
  Feather,
  ShieldCheck,
  ThermometerSun,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  type InputHTMLAttributes,
  type ClipboardEvent,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  useRequestOtp,
  useVerifyOtp,
  useRequestPhoneLoginOtp,
  useVerifyPhoneLoginOtp,
  usePublicConfig,
} from "@/features/auth/api";
import { requestOtpSchema, type RequestOtpInput } from "@/features/auth/schema";
import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";
import { RestrictedModal, isRestrictedError } from "@/features/auth/components/RestrictedModal";
import { reportBrowserLocation } from "@/features/auth/location";
import { ParticleLogo } from "@/components/ParticleLogo";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/_auth/login")({
  validateSearch: (s) => searchSchema.parse(s),
  component: LoginRoute,
});

const RESEND_SECONDS = 30;

// Signature Soliva ease curve, typed as a cubic-bezier tuple so framer-motion's
// Variants type accepts it (a bare array widens to number[] and is rejected).
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: EASE },
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
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();
  const requestPhoneOtp = useRequestPhoneLoginOtp();
  const verifyPhoneOtp = useVerifyPhoneLoginOtp();
  // Phone sign-in is only offered once MSG91 is configured on the backend.
  const { data: publicConfig } = usePublicConfig();
  const phoneEnabled = !!publicConfig?.phoneOtpEnabled;

  // Two-step passwordless flow: "email" → "code".
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  // Sign-in method. "phone" is reachable only when phoneEnabled is true.
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [success, setSuccess] = useState(false);
  const [restricted, setRestricted] = useState(false);

  // 6-digit code state (only used on the "code" step).
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otp = otpDigits.join("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestOtpInput>({
    resolver: zodResolver(requestOtpSchema),
  });

  // Resend cooldown.
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // ── Step 1: send the code ──
  const sendCode = handleSubmit(async ({ email: enteredEmail }) => {
    try {
      await requestOtp.mutateAsync(enteredEmail);
      setEmail(enteredEmail);
      setStep("code");
      setOtpDigits(["", "", "", "", "", ""]);
      setTimer(RESEND_SECONDS);
      toast.success(`We sent a sign-in code to ${enteredEmail}`);
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the code");
    }
  });

  // ── Step 1 (phone): send the code to an existing account's mobile ──
  const sendPhoneCode = async (e: FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setPhoneError("Enter a valid 10-digit mobile number");
      return;
    }
    setPhoneError("");
    try {
      await requestPhoneOtp.mutateAsync(digits);
      setPhone(digits);
      setStep("code");
      setOtpDigits(["", "", "", "", "", ""]);
      setTimer(RESEND_SECONDS);
      toast.success("We sent a sign-in code to your mobile");
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send the code";
      setPhoneError(msg);
      toast.error(msg);
    }
  };

  const resendCode = async () => {
    const pending = requestOtp.isPending || requestPhoneOtp.isPending;
    if (timer > 0 || pending) return;
    try {
      if (method === "phone") await requestPhoneOtp.mutateAsync(phone);
      else await requestOtp.mutateAsync(email);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimer(RESEND_SECONDS);
      otpRefs.current[0]?.focus();
      toast.success("New code sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend the code");
    }
  };

  // ── Step 2: verify the code ──
  const runVerify = async (code: string) => {
    if (code.length !== 6 || verifyOtp.isPending || verifyPhoneOtp.isPending || success) return;
    try {
      if (method === "phone") await verifyPhoneOtp.mutateAsync({ phone, otp: code });
      else await verifyOtp.mutateAsync({ email, otp: code });
      setSuccess(true);
      reportBrowserLocation(); // opt-in precise location, best-effort
      toast.success("Welcome to Soliva");
      setTimeout(() => navigate({ to: redirect ?? "/" }), 650);
    } catch (err) {
      if (isRestrictedError(err)) {
        setRestricted(true);
        setOtpDigits(["", "", "", "", "", ""]);
        return;
      }
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      toast.error(err instanceof Error ? err.message : "Invalid or expired code");
    }
  };

  // Auto-verify the moment all 6 digits are present.
  useEffect(() => {
    if (step === "code" && !success && otp.length === 6) void runVerify(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step, success]);

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

  const backToEmail = () => {
    setStep("email");
    setOtpDigits(["", "", "", "", "", ""]);
    setTimer(0);
  };

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
            <AnimatePresence mode="wait" initial={false}>
              {step === "email" ? (
                /* ─────────── STEP 1 — EMAIL ─────────── */
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* title */}
                  <div className="mb-7">
                    <h2 className="font-display text-[2rem] leading-tight text-[#3a2a22] tracking-tight">Sign In</h2>
                    <p className="mt-1 text-ink-muted font-light text-[15px]">
                      {method === "phone"
                        ? "Enter your mobile number — we'll text you a sign-in code."
                        : "Enter your email — we'll send you a sign-in code."}
                    </p>
                  </div>

                  {/* google */}
                  <GoogleAuthButton redirectTo={redirect ?? "/"} onRestricted={() => setRestricted(true)} />

                  {/* divider */}
                  <div className="my-6 flex items-center gap-4">
                    <span className="h-px flex-1 bg-[#3a2a22]/10" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-muted/45 font-bold">{method === "phone" ? "Or continue with mobile" : "Or continue with email"}</span>
                    <span className="h-px flex-1 bg-[#3a2a22]/10" />
                  </div>

                  {method === "email" ? (
                    <form onSubmit={sendCode} className="space-y-5" noValidate>
                      <FloatingField
                        id="email"
                        label="Email Address"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        error={errors.email?.message}
                        {...register("email")}
                      />

                      <button
                        type="submit"
                        disabled={isSubmitting || requestOtp.isPending}
                        className="group h-13 w-full rounded-2xl bg-[#c76600] text-xs font-bold uppercase tracking-[0.15em] text-white shadow-xl shadow-[#c76600]/20 transition-all duration-300 hover:bg-[#a55500] hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
                      >
                        {isSubmitting || requestOtp.isPending ? (
                          <span className="flex items-center justify-center gap-3">
                            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Sending code…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Continue
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                          </span>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={sendPhoneCode} className="space-y-5" noValidate>
                      <FloatingField
                        id="phone"
                        label="Mobile Number"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        autoFocus
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        error={phoneError}
                      />

                      <button
                        type="submit"
                        disabled={requestPhoneOtp.isPending}
                        className="group h-13 w-full rounded-2xl bg-[#c76600] text-xs font-bold uppercase tracking-[0.15em] text-white shadow-xl shadow-[#c76600]/20 transition-all duration-300 hover:bg-[#a55500] hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
                      >
                        {requestPhoneOtp.isPending ? (
                          <span className="flex items-center justify-center gap-3">
                            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Sending code…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Continue
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                          </span>
                        )}
                      </button>
                    </form>
                  )}

                  {phoneEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setMethod((m) => (m === "email" ? "phone" : "email"));
                        setPhoneError("");
                      }}
                      className="mt-5 flex w-full items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-muted hover:text-[#c76600] transition-colors"
                    >
                      {method === "email" ? (
                        <>
                          <Smartphone size={13} /> Sign in with mobile number
                        </>
                      ) : (
                        <>
                          <Mail size={13} /> Sign in with email
                        </>
                      )}
                    </button>
                  )}

                  {method === "email" && (
                    <p className="mt-6 text-center text-xs text-ink-muted font-light leading-relaxed">
                      New to Soliva? Just enter your email —
                      <br className="hidden sm:block" /> we'll set up your account automatically.
                    </p>
                  )}
                </motion.div>
              ) : (
                /* ─────────── STEP 2 — CODE ─────────── */
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* back + title */}
                  <button
                    type="button"
                    onClick={backToEmail}
                    disabled={success}
                    className="mb-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-ink-muted/70 hover:text-[#c76600] transition-colors disabled:opacity-40"
                  >
                    <ArrowLeft size={13} /> {method === "phone" ? "Use a different number" : "Use a different email"}
                  </button>

                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c76600]/10 text-[#c76600]">
                      {method === "phone" ? <Smartphone size={18} /> : <Mail size={18} />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-[1.5rem] leading-tight text-[#3a2a22] tracking-tight">
                        {method === "phone" ? "Check your phone" : "Check your email"}
                      </h2>
                      <p className="text-ink-muted font-light text-[13px] truncate">
                        Code sent to{" "}
                        <span className="font-semibold text-[#3a2a22]">
                          {method === "phone" ? `+91 ${phone}` : email}
                        </span>
                      </p>
                    </div>
                  </div>

                  {success ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 24 }}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-green-500/10 border border-green-500/20 px-4 py-4 text-green-600"
                    >
                      <CheckCircle2 size={20} />
                      <span className="text-sm font-semibold">Signed in — taking you in…</span>
                    </motion.div>
                  ) : (
                    <>
                      <div className="flex justify-between gap-2" onPaste={onOtpPaste}>
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => {
                              otpRefs.current[i] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            disabled={verifyOtp.isPending || verifyPhoneOtp.isPending}
                            onChange={(e) => setDigit(i, e.target.value)}
                            onKeyDown={(e) => onOtpKeyDown(i, e)}
                            className="aspect-square w-full min-w-0 max-w-[60px] sm:h-14 rounded-2xl border border-black/10 bg-white text-center text-xl font-display text-[#3a2a22] shadow-sm outline-none transition-all focus:border-[#c76600] focus:ring-4 focus:ring-[#c76600]/12 disabled:opacity-60"
                          />
                        ))}
                      </div>

                      <div className="mt-5 flex items-center justify-between px-0.5">
                        <span className="text-[11px] text-ink-muted/60 font-medium">
                          {verifyOtp.isPending || verifyPhoneOtp.isPending ? "Verifying…" : "Verifies automatically"}
                        </span>
                        <button
                          type="button"
                          onClick={resendCode}
                          disabled={timer > 0 || requestOtp.isPending || requestPhoneOtp.isPending}
                          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-ink-muted hover:text-[#c76600] transition-colors disabled:opacity-40"
                        >
                          <RefreshCw size={11} className={requestOtp.isPending || requestPhoneOtp.isPending ? "animate-spin" : ""} />
                          {timer > 0 ? `Resend in ${timer}s` : "Resend code"}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>

      <RestrictedModal open={restricted} onClose={() => setRestricted(false)} />

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
