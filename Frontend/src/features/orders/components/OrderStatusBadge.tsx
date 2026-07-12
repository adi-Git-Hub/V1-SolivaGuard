import { cn } from "@/lib/utils";
import type { OrderStatus, Refund, RefundStatus } from "../schema";

// Statuses a customer may still cancel from — mirrors the backend rule
// (OrderService.CUSTOMER_CANCELLABLE_STATES). Cancellation is allowed ONLY
// before the order is packed.
const CANCELLABLE: ReadonlySet<string> = new Set(["pending", "paid", "confirmed"]);

export function isCancellable(status: OrderStatus | string): boolean {
  return CANCELLABLE.has(status);
}

type BadgeTone = { label: string; className: string; dot: string };

// Premium status badges. Colours follow the Soliva spec:
// Pending→Amber · Confirmed→Blue · Processing→Purple · Packed→Indigo ·
// Shipped→Cyan · Out for Delivery→Orange · Delivered→Green ·
// Cancelled→Red · Refunded→Emerald.
const STATUS_TONE: Record<string, BadgeTone> = {
  pending: {
    label: "Pending",
    className: "text-amber-700 bg-amber-500/10 border-amber-500/25",
    dot: "bg-amber-500",
  },
  paid: {
    label: "Processing",
    className: "text-purple-700 bg-purple-500/10 border-purple-500/25",
    dot: "bg-purple-500",
  },
  confirmed: {
    label: "Confirmed",
    className: "text-blue-700 bg-blue-500/10 border-blue-500/25",
    dot: "bg-blue-500",
  },
  packed: {
    label: "Packed",
    className: "text-indigo-700 bg-indigo-500/10 border-indigo-500/25",
    dot: "bg-indigo-500",
  },
  shipped: {
    label: "Shipped",
    className: "text-cyan-700 bg-cyan-500/10 border-cyan-500/25",
    dot: "bg-cyan-500",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    className: "text-orange-700 bg-orange-500/10 border-orange-500/25",
    dot: "bg-orange-500",
  },
  delivered: {
    label: "Delivered",
    className: "text-emerald-700 bg-emerald-500/10 border-emerald-500/25",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "text-red-600 bg-red-500/10 border-red-500/25",
    dot: "bg-red-500",
  },
  refunded: {
    label: "Refunded",
    className: "text-emerald-700 bg-emerald-500/12 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
};

// Refund badge — shown alongside a Cancelled badge while money is in flight.
// Refund Processing → Yellow, Refunded → Emerald (per spec).
const REFUND_TONE: Partial<Record<RefundStatus, BadgeTone>> = {
  processing: {
    label: "Refund Processing",
    className: "text-yellow-700 bg-yellow-400/15 border-yellow-500/30",
    dot: "bg-yellow-500",
  },
  pending: {
    label: "Refund Pending",
    className: "text-yellow-700 bg-yellow-400/15 border-yellow-500/30",
    dot: "bg-yellow-500",
  },
  completed: {
    label: "Refunded",
    className: "text-emerald-700 bg-emerald-500/12 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  failed: {
    label: "Refund Failed",
    className: "text-red-600 bg-red-500/10 border-red-500/25",
    dot: "bg-red-500",
  },
};

function Pill({ tone }: { tone: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest",
        tone.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} aria-hidden />
      {tone.label}
    </span>
  );
}

export function OrderStatusBadge({
  status,
  refund,
  className,
}: {
  status: OrderStatus | string;
  refund?: Refund;
  className?: string;
}) {
  const tone = STATUS_TONE[status] ?? STATUS_TONE.pending;
  const refundTone =
    status === "cancelled" && refund?.status && refund.status !== "not_applicable"
      ? REFUND_TONE[refund.status]
      : undefined;

  return (
    <span className={cn("inline-flex flex-wrap items-center justify-end gap-1.5", className)}>
      <Pill tone={tone} />
      {refundTone ? <Pill tone={refundTone} /> : null}
    </span>
  );
}
