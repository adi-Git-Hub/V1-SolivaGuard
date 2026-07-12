import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Paperclip, Plus, X, CheckCircle2, ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { env } from "@/config/env";
import { useSession } from "@/features/auth/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Order } from "../schema";

const inr = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

/**
 * Refund request popup for an order (opened from the cancelled/refund section).
 * Reuses the same intake pipeline as the /support form — POST /contact/feedback
 * (multipart, up to 5 image attachments) — but scoped to a refund: it captures
 * the transaction/payment ID and a payment screenshot alongside the reason.
 */
export function RefundRequestModal({
  order,
  open,
  onClose,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
}) {
  const session = useSession();
  const ref = `#${order.id.slice(-10).toUpperCase()}`;

  const [txnId, setTxnId] = useState(order.paymentInfo?.razorpay_payment_id ?? "");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";

  function reset() {
    setTxnId(order.paymentInfo?.razorpay_payment_id ?? "");
    setReason("");
    setFiles([]);
    setDone(false);
    setSubmitting(false);
  }

  function handleClose() {
    if (submitting) return;
    onClose();
    // Reset after the close animation so the form is fresh next time.
    setTimeout(reset, 250);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => /^image\//.test(f.type));
    if (imgs.length !== list.length) toast.error("Please upload image files only (screenshots).");
    setFiles((prev) => [...prev, ...imgs].slice(0, 5));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please tell us why you're requesting a refund.");
      return;
    }
    if (!txnId.trim()) {
      toast.error("Please enter the transaction / payment ID.");
      return;
    }
    if (files.length === 0) {
      toast.error("Please attach a screenshot of your payment / transaction.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("email", email);
      fd.append("category", "refund-request");
      fd.append("subject", `Refund Request — Order ${ref}`);
      fd.append(
        "message",
        [
          `Refund request for Order ${ref}`,
          `Order total: ${inr(order.totalPrice)}`,
          `Transaction / Payment ID: ${txnId.trim()}`,
          "",
          `Reason: ${reason.trim()}`,
        ].join("\n"),
      );
      files.forEach((f) => fd.append("attachments", f));

      const res = await fetch(`${env.VITE_API_URL}/contact/feedback`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not submit your refund request");
      }
      setDone(true);
      toast.success("Refund request submitted — our team will get back to you.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your refund request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-line-hairline bg-luxury-beige sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl text-brown-deep">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-glow/10 text-orange-glow">
              <RotateCcw className="h-4 w-4" />
            </span>
            Request a Refund
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            For order <span className="font-mono font-semibold text-brown-deep">{ref}</span>. Share your
            transaction details and a screenshot so we can process it faster.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <div>
                <h3 className="font-display text-lg text-brown-deep">Refund request submitted</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  We&apos;ve received your request for order {ref}. Our team will review it and get
                  back to you shortly.
                </p>
              </div>
              <Button
                onClick={handleClose}
                className="mt-1 rounded-full bg-brown-deep px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-brown"
              >
                Done
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Name & Email — from the account, read-only */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">Name</Label>
                  <Input
                    value={name}
                    readOnly
                    className="h-12 rounded-xl border-line-hairline bg-surface-muted text-[0.9rem]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">Email</Label>
                  <Input
                    value={email}
                    readOnly
                    className="h-12 rounded-xl border-line-hairline bg-surface-muted text-[0.9rem]"
                  />
                </div>
              </div>

              {/* Transaction / Payment ID */}
              <div className="space-y-1.5">
                <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">
                  Transaction / Payment ID
                </Label>
                <Input
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  placeholder="e.g. pay_XXXXXXXXXXXX"
                  className="h-12 rounded-xl border-line-hairline bg-transparent font-mono text-[0.85rem] placeholder:text-ink-disabled focus:ring-orange-glow/20"
                />
                <p className="text-[0.68rem] text-ink-muted/70">
                  Found on your payment receipt or bank/UPI statement.
                </p>
              </div>

              {/* Refund reason / details */}
              <div className="space-y-1.5">
                <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">
                  Refund details
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 500))}
                  maxLength={500}
                  placeholder="Tell us why you're requesting a refund…"
                  className="min-h-[110px] resize-none rounded-xl border-line-hairline bg-transparent p-4 text-[0.9rem] placeholder:text-ink-disabled focus:ring-orange-glow/20"
                />
                <p className="text-right font-mono text-[10px] text-ink-faint">{reason.length}/500</p>
              </div>

              {/* Payment screenshot upload */}
              <div className="space-y-2">
                <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">
                  Payment screenshot
                </Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line-hairline py-7 transition-colors hover:border-orange-glow/40 hover:bg-orange-glow/[0.02]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                    multiple
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted transition-transform group-hover:scale-110">
                    {files.length ? (
                      <ImageUp className="h-5 w-5 text-orange-glow" />
                    ) : (
                      <Plus className="h-5 w-5 text-ink-muted" />
                    )}
                  </div>
                  <p className="mt-2.5 text-[0.8rem] font-medium text-ink-muted group-hover:text-brown-deep">
                    Upload a screenshot of your transaction
                  </p>
                  <p className="mt-1 text-[0.62rem] text-ink-muted/60">PNG, JPG, or WebP · up to 5 images</p>
                </div>

                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {files.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-full bg-surface-muted px-3.5 py-1.5 text-[0.72rem] text-brown-deep"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFiles((prev) => prev.filter((_, idx) => idx !== i));
                          }}
                          className="ml-0.5 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong px-6 text-sm font-medium text-ink-default transition-colors hover:bg-cream active:scale-[0.98] disabled:opacity-50 md:h-10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brown-deep px-7 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brown active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 md:h-10"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    "Submit Refund Request"
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Drop-in "Request Refund" CTA that owns its own modal state. Add it anywhere an
 * order's cancellation/refund section is shown.
 */
export function RequestRefundButton({
  order,
  className,
}: {
  order: Order;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-orange-glow px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-orange-glow/90 hover:shadow-md active:scale-95"
        }
      >
        <RotateCcw className="h-3.5 w-3.5" /> Request Refund
      </button>
      <RefundRequestModal order={order} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
