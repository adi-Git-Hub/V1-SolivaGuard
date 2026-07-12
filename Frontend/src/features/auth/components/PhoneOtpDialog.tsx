import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, RefreshCw, CheckCircle2, X, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useSendPhoneOtp, useVerifyPhoneOtp } from "@/features/auth/api";

const RESEND_SECONDS = 30;

/**
 * Reusable Phone-OTP verification dialog.
 *
 * Two modes:
 *  - default: a number is passed in, the dialog sends a code on open and
 *    collects the 6 digits (checkout, profile phone-change).
 *  - collectPhone: the dialog first asks for the mobile number, then sends the
 *    code (profile "add phone", security-score CTA).
 *
 * On success it hands the short-lived proof token + verified number back via
 * `onVerified`. Purely additive — it overlays the host screen.
 */
export function PhoneOtpDialog({
  open,
  phone = "",
  purpose = "verify",
  title = "Verify your mobile",
  description,
  collectPhone = false,
  onClose,
  onVerified,
}: {
  open: boolean;
  phone?: string;
  purpose?: "verify" | "update";
  title?: string;
  description?: string;
  collectPhone?: boolean;
  onClose: () => void;
  onVerified: (phoneVerifyToken: string, phone: string) => void;
}) {
  const sendOtp = useSendPhoneOtp();
  const verifyOtp = useVerifyPhoneOtp();

  const initialNational = phone.replace(/\D/g, "").slice(-10);
  const [phase, setPhase] = useState<"enter" | "code">(collectPhone ? "enter" : "code");
  const [entry, setEntry] = useState("");
  const [entryError, setEntryError] = useState("");
  const [activeNational, setActiveNational] = useState(initialNational);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const sentForRef = useRef<string | null>(null);
  const code = digits.join("");

  // Actually dispatch a code to a number and move to the code step.
  const sendTo = (national: string) => {
    setActiveNational(national);
    setPhase("code");
    setDigits(["", "", "", "", "", ""]);
    setError("");
    setDone(false);
    setTimer(RESEND_SECONDS);
    sentForRef.current = national;
    sendOtp.mutate(
      { phone: national, purpose },
      { onError: (err) => setError(err instanceof Error ? err.message : "Could not send the code") },
    );
    setTimeout(() => refs.current[0]?.focus(), 140);
  };

  // On open: reset. Non-collect mode auto-sends to the passed number.
  useEffect(() => {
    if (!open) {
      sentForRef.current = null;
      return;
    }
    setEntry("");
    setEntryError("");
    setDigits(["", "", "", "", "", ""]);
    setError("");
    setDone(false);
    if (collectPhone) {
      setPhase("enter");
      setActiveNational("");
      setTimeout(() => refs.current[0]?.focus(), 140);
    } else if (sentForRef.current !== initialNational) {
      sendTo(initialNational);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialNational, collectPhone]);

  // Resend cooldown.
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const submitEntry = (e: FormEvent) => {
    e.preventDefault();
    const national = entry.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(national)) {
      setEntryError("Enter a valid 10-digit mobile number");
      return;
    }
    setEntryError("");
    sendTo(national);
  };

  const runVerify = async (value: string) => {
    if (value.length !== 6 || verifyOtp.isPending || done) return;
    try {
      const { phoneVerifyToken } = await verifyOtp.mutateAsync({
        phone: activeNational,
        otp: value,
        purpose,
      });
      setDone(true);
      onVerified(phoneVerifyToken, activeNational);
    } catch (err) {
      setDigits(["", "", "", "", "", ""]);
      setError(err instanceof Error ? err.message : "Invalid or expired code");
      refs.current[0]?.focus();
    }
  };

  // Auto-verify once all six digits are present.
  useEffect(() => {
    if (open && phase === "code" && !done && code.length === 6) void runVerify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, open, phase, done]);

  const resend = async () => {
    if (timer > 0 || sendOtp.isPending) return;
    try {
      await sendOtp.mutateAsync({ phone: activeNational, purpose });
      setDigits(["", "", "", "", "", ""]);
      setError("");
      setTimer(RESEND_SECONDS);
      refs.current[0]?.focus();
      toast.success("New code sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the code");
    }
  };

  const setDigit = (i: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = char;
      return next;
    });
    if (char && i < 5) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((d, idx) => (next[idx] = d));
    setDigits(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[#3a2a22]/50 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[420px] rounded-[24px] border border-white/70 bg-white p-7 shadow-[0_24px_70px_-20px_rgba(58,42,34,0.35)]"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted/60 transition-colors hover:bg-black/5 hover:text-[#3a2a22]"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c76600]/10 text-[#c76600]">
                <Smartphone size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-[1.4rem] leading-tight text-[#3a2a22] tracking-tight">
                  {title}
                </h2>
                <p className="text-ink-muted font-light text-[13px] truncate">
                  {phase === "enter"
                    ? "We'll text you a 6-digit code to confirm it's you."
                    : description ?? (
                        <>
                          Code sent to{" "}
                          <span className="font-semibold text-[#3a2a22]">+91 {activeNational}</span>
                        </>
                      )}
                </p>
              </div>
            </div>

            {phase === "enter" ? (
              /* ── Step 1: collect the mobile number ── */
              <form onSubmit={submitEntry} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <div className="flex items-center rounded-2xl border border-black/10 bg-white px-3.5 shadow-sm focus-within:border-[#c76600] focus-within:ring-4 focus-within:ring-[#c76600]/12 transition-all">
                    <span className="text-sm font-medium text-ink-muted/70 pr-2 border-r border-black/10">+91</span>
                    <input
                      ref={(el) => {
                        refs.current[0] = el;
                      }}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      value={entry}
                      onChange={(e) => setEntry(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      className="h-13 w-full bg-transparent pl-3 text-[#3a2a22] outline-none placeholder:text-ink-muted/40"
                    />
                  </div>
                  {entryError && <p className="text-[12px] font-medium text-red-500 px-1">{entryError}</p>}
                </div>
                <button
                  type="submit"
                  disabled={sendOtp.isPending}
                  className="group h-13 w-full rounded-2xl bg-[#c76600] text-xs font-bold uppercase tracking-[0.15em] text-white shadow-xl shadow-[#c76600]/20 transition-all duration-300 hover:bg-[#a55500] hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
                >
                  {sendOtp.isPending ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Sending code…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Send Code
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </button>
              </form>
            ) : done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                className="flex items-center justify-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-4 text-green-600"
              >
                <CheckCircle2 size={20} />
                <span className="text-sm font-semibold">Mobile number verified</span>
              </motion.div>
            ) : (
              /* ── Step 2: enter the 6-digit code ── */
              <>
                {collectPhone && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("enter");
                      sentForRef.current = null;
                      setTimeout(() => refs.current[0]?.focus(), 60);
                    }}
                    className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-ink-muted/70 hover:text-[#c76600] transition-colors"
                  >
                    <ArrowLeft size={12} /> Change number
                  </button>
                )}
                <div className="flex justify-between gap-2" onPaste={onPaste}>
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        refs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      disabled={verifyOtp.isPending}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => onKeyDown(i, e)}
                      className="aspect-square w-full min-w-0 max-w-[54px] sm:h-14 rounded-2xl border border-black/10 bg-white text-center text-xl font-display text-[#3a2a22] shadow-sm outline-none transition-all focus:border-[#c76600] focus:ring-4 focus:ring-[#c76600]/12 disabled:opacity-60"
                    />
                  ))}
                </div>

                {error && <p className="mt-3 text-[12px] font-medium text-red-500">{error}</p>}

                <div className="mt-5 flex items-center justify-between px-0.5">
                  <span className="text-[11px] text-ink-muted/60 font-medium">
                    {verifyOtp.isPending ? "Verifying…" : "Verifies automatically"}
                  </span>
                  <button
                    type="button"
                    onClick={resend}
                    disabled={timer > 0 || sendOtp.isPending}
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-ink-muted hover:text-[#c76600] transition-colors disabled:opacity-40"
                  >
                    <RefreshCw size={11} className={sendOtp.isPending ? "animate-spin" : ""} />
                    {timer > 0 ? `Resend in ${timer}s` : "Resend code"}
                  </button>
                </div>
              </>
            )}

            <style>{`.h-13 { height: 3.25rem; }`}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
