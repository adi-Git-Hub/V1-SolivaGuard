import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { XCircle, Info, Loader2, RotateCcw, Eye, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import { useCancelOrder } from "../api";
import type { Order, RefundStatus } from "../schema";
import { isCancellable } from "./OrderStatusBadge";
import { RequestRefundButton } from "./RefundRequestModal";

const CANCELLATION_REASONS = [
  "Ordered by mistake",
  "Changed my mind",
  "Delivery is taking longer than expected",
  "Found a better price elsewhere",
  "Want to change the colour",
  "Want to change the delivery address",
  "Ordered the wrong product",
  "Payment-related issue",
  "Other",
] as const;

const DETAIL_MAX = 250;

const REFUND_LABEL: Record<RefundStatus, string> = {
  not_applicable: "Not Applicable",
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

function safeDate(iso?: string | null, pattern = "dd MMM yyyy, h:mm a") {
  if (!iso) return "—";
  try {
    return format(new Date(iso), pattern);
  } catch {
    return "—";
  }
}

/**
 * Renders the correct bottom-of-card affordance for an order:
 *  - cancelled          → the cancelled summary (date, reason, refund, actions)
 *  - still cancellable   → the red "Cancel Order" CTA + modal flow
 *  - anything else       → nothing (the status badge already tells the story)
 */
export function OrderCancellation({ order }: { order: Order }) {
  if (order.orderStatus === "cancelled") return <CancelledSummary order={order} />;
  if (isCancellable(order.orderStatus)) return <CancelOrderButton order={order} />;
  return null;
}

// ── Post-cancellation summary ──────────────────────────────────────────────
function CancelledSummary({ order }: { order: Order }) {
  const reason = order.cancellation?.detail
    ? `${order.cancellation.reason} — ${order.cancellation.detail}`
    : order.cancellation?.reason || "Not specified";
  const refundStatus = order.refund?.status ?? "not_applicable";
  const refundLabel = REFUND_LABEL[refundStatus];

  return (
    <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-500/10 text-red-600">
          <XCircle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-red-600">
              Cancelled
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Cancelled on {safeDate(order.cancellation?.cancelledAt)}
            </p>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-faint">
                Reason
              </dt>
              <dd className="mt-0.5 text-brown-deep">{reason}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-faint">
                Refund Status
              </dt>
              <dd
                className={cn(
                  "mt-0.5 font-medium",
                  refundStatus === "completed" && "text-emerald-700",
                  (refundStatus === "processing" || refundStatus === "pending") &&
                    "text-yellow-700",
                  refundStatus === "failed" && "text-red-600",
                  refundStatus === "not_applicable" && "text-ink-muted",
                )}
              >
                {refundLabel}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap">
            <RequestRefundButton order={order} />
            <Link
              to="/profile/orders/$id"
              params={{ id: order.id }}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-line-strong px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted transition-colors hover:text-brown-deep active:scale-95"
            >
              <Eye className="h-3.5 w-3.5" /> View Details
            </Link>
            <Link
              to="/collection"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brown-deep px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-brown active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Buy Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cancel CTA + reason modal + confirm dialog ─────────────────────────────
function CancelOrderButton({ order }: { order: Order }) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");

  const cancelOrder = useCancelOrder();
  const isPending = cancelOrder.isPending;

  function resetAndClose() {
    setConfirmOpen(false);
    setReasonOpen(false);
    setReason("");
    setDetail("");
  }

  function handleContinue() {
    if (!reason) {
      toast.error("Please select a reason for cancelling.");
      return;
    }
    if (reason === "Other" && !detail.trim()) {
      toast.error("Please tell us your reason.");
      return;
    }
    setReasonOpen(false);
    setConfirmOpen(true);
  }

  async function handleConfirmCancel() {
    if (isPending) return; // guard against duplicate submits
    try {
      await cancelOrder.mutateAsync({
        orderId: order.id,
        reason,
        detail: reason === "Other" ? detail.trim() : undefined,
      });
      toast.success("Your order has been cancelled successfully.");
      resetAndClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not cancel your order. Please try again.",
      );
      // Leave the confirm dialog open so the user can retry or keep the order.
    }
  }

  const canContinue = Boolean(reason) && (reason !== "Other" || detail.trim().length > 0);

  return (
    <>
      <div className="mt-3 flex justify-stretch border-t border-line-soft pt-3 sm:justify-end">
        <button
          type="button"
          onClick={() => setReasonOpen(true)}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-red-600 px-5 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-all duration-200 hover:bg-red-700 hover:shadow-md active:scale-[0.98] sm:w-auto"
        >
          <XCircle className="h-3.5 w-3.5" /> Cancel Order
        </button>
      </div>

      {/* ── Reason modal ── */}
      <Dialog
        open={reasonOpen}
        onOpenChange={(o) => {
          if (isPending) return;
          setReasonOpen(o);
          if (!o) {
            setReason("");
            setDetail("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-luxury-beige border-line-hairline sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-brown-deep">Cancel Order</DialogTitle>
            <DialogDescription className="text-ink-muted">
              We&apos;re sorry your order didn&apos;t work out. Please let us know why you&apos;re
              cancelling.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <RadioGroup value={reason} onValueChange={setReason} className="gap-1.5">
              {CANCELLATION_REASONS.map((r) => {
                const id = `cancel-reason-${r.replace(/\s+/g, "-").toLowerCase()}`;
                const selected = reason === r;
                return (
                  <label
                    key={r}
                    htmlFor={id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors",
                      selected
                        ? "border-orange-glow/50 bg-orange-glow/[0.06] text-brown-deep"
                        : "border-line-hairline bg-surface-panel text-ink-default hover:border-line-strong",
                    )}
                  >
                    <RadioGroupItem value={r} id={id} />
                    <span>{r}</span>
                  </label>
                );
              })}
            </RadioGroup>

            {reason === "Other" && (
              <div className="space-y-1.5">
                <Textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value.slice(0, DETAIL_MAX))}
                  maxLength={DETAIL_MAX}
                  placeholder="Please tell us your reason..."
                  rows={3}
                  className="resize-none border-line-strong bg-surface-panel text-brown-deep placeholder:text-ink-faint focus-visible:ring-orange-glow/40"
                  aria-label="Cancellation reason details"
                />
                <p className="text-right font-mono text-[10px] text-ink-faint">
                  {detail.length}/{DETAIL_MAX}
                </p>
              </div>
            )}

            {/* Cancellation policy */}
            <div className="rounded-xl border border-line-hairline bg-cream/60 p-4">
              <p className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-brown">
                <Info className="h-3.5 w-3.5 text-orange-glow" /> Cancellation Policy
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-ink-muted">
                <li className="flex gap-2">
                  <span className="text-orange-glow">•</span> Cancelled orders cannot be restored.
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-glow">•</span> If payment has already been completed,
                  your refund will be initiated automatically.
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-glow">•</span> Refunds are generally processed within
                  5–7 business days.
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-glow">•</span> Refund timelines may vary depending on
                  your payment method.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setReasonOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong px-6 text-sm font-medium text-ink-default transition-colors hover:bg-cream active:scale-[0.98] md:h-10"
            >
              Keep My Order
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 md:h-10"
            >
              Continue
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation dialog ── */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(o) => {
          if (isPending) return;
          setConfirmOpen(o);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-red-500/10 text-red-600">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="rounded-full">
              Keep Order
            </AlertDialogCancel>
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 md:h-10"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Cancelling…
                </>
              ) : (
                "Yes, Cancel Order"
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
