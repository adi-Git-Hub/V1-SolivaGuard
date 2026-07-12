import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Trash2, ShieldAlert, Loader2, ArrowLeft, MailCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRequestAccountDeletionOtp, useDeleteAccount } from "@/features/auth/api";

/**
 * Settings "Danger Zone": permanently delete the account, gated by an email
 * OTP. Soft-delete on the backend — personal data is anonymized and every
 * session wiped, but order history is preserved. Two steps, one dialog:
 *   warn → "Send Confirmation Code" → otp → "Delete My Account".
 */
export function DeleteAccountSection() {
  const navigate = useNavigate();
  const requestOtp = useRequestAccountDeletionOtp();
  const deleteAccount = useDeleteAccount();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"warn" | "otp">("warn");
  const [otp, setOtp] = useState("");

  const sending = requestOtp.isPending;
  const deleting = deleteAccount.isPending;
  const busy = sending || deleting;

  function reset() {
    setStep("warn");
    setOtp("");
  }

  async function handleSendCode() {
    try {
      await requestOtp.mutateAsync();
      setStep("otp");
      toast.success("We've emailed you a 6-digit confirmation code.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the code");
    }
  }

  async function handleDelete() {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    try {
      await deleteAccount.mutateAsync(otp);
      setOpen(false);
      toast.success("Your account has been deleted.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete your account");
    }
  }

  return (
    <>
      {/* Danger Zone card */}
      <section className="rounded-2xl border border-red-500/25 bg-red-500/[0.04] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-600">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-mono text-[11px] font-black uppercase tracking-widest text-red-600">
                Delete Account
              </h3>
              <p className="mt-1 max-w-md text-[13px] font-light leading-relaxed text-ink-muted">
                Permanently deactivates your account and removes your personal details. Your order
                history is kept for billing records. This can&apos;t be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              reset();
              setOpen(true);
            }}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-red-600 px-5 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-all duration-200 hover:bg-red-700 hover:shadow-md active:scale-[0.98] sm:h-10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Account
          </button>
        </div>
      </section>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (busy) return;
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="bg-luxury-beige border-line-hairline sm:rounded-2xl">
          {step === "warn" ? (
            <>
              <DialogHeader>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-red-500/10 text-red-600">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <DialogTitle className="font-display text-xl text-brown-deep">
                  Delete your account?
                </DialogTitle>
                <DialogDescription className="text-ink-muted">
                  We&apos;ll email a 6-digit code to confirm it&apos;s really you. Deleting your
                  account will:
                </DialogDescription>
              </DialogHeader>

              <ul className="space-y-2 text-[13px] text-ink-muted">
                <li className="flex gap-2">
                  <span className="text-red-500">•</span> Sign you out on every device.
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">•</span> Remove your name, email and phone from your
                  profile.
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">•</span> Keep your past orders for billing &amp;
                  refunds.
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">•</span> Free your email so you can sign up again
                  later.
                </li>
              </ul>

              <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong px-6 text-sm font-medium text-ink-default transition-colors hover:bg-cream active:scale-[0.98] md:h-10"
                >
                  Keep My Account
                </button>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:h-10"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending Code…
                    </>
                  ) : (
                    "Send Confirmation Code"
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <button
                  type="button"
                  onClick={() => setStep("warn")}
                  className="mb-1 inline-flex w-fit items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted transition-colors hover:text-brown-deep"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-orange-glow/10 text-orange-glow">
                  <MailCheck className="h-5 w-5" />
                </span>
                <DialogTitle className="font-display text-xl text-brown-deep">
                  Enter confirmation code
                </DialogTitle>
                <DialogDescription className="text-ink-muted">
                  Enter the 6-digit code we emailed you. This permanently deletes your account.
                </DialogDescription>
              </DialogHeader>

              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleDelete();
                  }
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                placeholder="••••••"
                aria-label="6-digit confirmation code"
                className="w-full rounded-2xl border border-line-strong bg-surface-panel py-4 text-center font-mono text-2xl tracking-[0.5em] text-brown-deep placeholder:tracking-[0.3em] placeholder:text-ink-faint focus:border-orange-glow/50 focus:outline-none focus:ring-4 focus:ring-orange-glow/10"
              />

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sending}
                  className="font-mono text-[11px] font-bold uppercase tracking-widest text-orange-glow transition-colors disabled:text-ink-muted/40"
                >
                  {sending ? "Resending…" : "Resend Code"}
                </button>
              </div>

              <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={deleting}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong px-6 text-sm font-medium text-ink-default transition-colors hover:bg-cream active:scale-[0.98] disabled:opacity-60 md:h-10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || otp.length !== 6}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 md:h-10"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                    </>
                  ) : (
                    "Delete My Account"
                  )}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
