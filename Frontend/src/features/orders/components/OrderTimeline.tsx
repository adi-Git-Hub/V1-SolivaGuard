import { Check, Package, Truck, Home, ClipboardList, BadgeCheck, XCircle } from "lucide-react";
import type { Order, OrderStatus } from "@/features/orders/schema";

/* Canonical 6-step fulfilment timeline. The backend orderStatus maps onto it. */
const STEPS = [
  { key: "confirmed", label: "Order Confirmed", icon: BadgeCheck },
  { key: "processing", label: "Processing", icon: ClipboardList },
  { key: "packed", label: "Packed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
] as const;

// orderStatus → index of the CURRENT (active) step.
const STATUS_TO_STEP: Record<string, number> = {
  paid: 0,
  confirmed: 1,
  packed: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
};

export function trackingLabel(status: OrderStatus): string {
  if (status === "out_for_delivery") return "Out for Delivery";
  if (status === "paid" || status === "confirmed") return "Order Confirmed";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function statusTone(status: OrderStatus): string {
  if (status === "delivered") return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (status === "cancelled" || status === "refunded")
    return "text-red-500 bg-red-50 border-red-200";
  return "text-orange-glow bg-orange-glow/10 border-orange-glow/20";
}

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function OrderTimeline({ order }: { order: Order }) {
  const cancelled = order.orderStatus === "cancelled" || order.orderStatus === "refunded";

  if (cancelled) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
        <XCircle className="h-6 w-6 text-red-500" />
        <div>
          <p className="font-display text-base text-red-600 capitalize">{order.orderStatus}</p>
          <p className="text-sm text-red-500/70">
            This order was {order.orderStatus}. Any payment is refunded per our policy.
          </p>
        </div>
      </div>
    );
  }

  const current = STATUS_TO_STEP[order.orderStatus] ?? 0;
  const isDelivered = order.orderStatus === "delivered";

  // Pull a timestamp for a step from the events log, if present.
  const tsFor = (key: string) =>
    fmt(order.events?.find((e) => e.status === key || (key === "confirmed" && e.status === "paid"))?.timestamp);

  return (
    <ol className="relative">
      {STEPS.map((step, i) => {
        const complete = i < current || (i === current && isDelivered);
        const active = i === current && !isDelivered;
        const Icon = step.icon;
        const last = i === STEPS.length - 1;
        return (
          <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
            {/* connector line */}
            {!last && (
              <span
                className={`absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 ${
                  complete ? "bg-orange-glow" : "bg-line-soft"
                }`}
              />
            )}
            {/* node */}
            <span
              className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                complete
                  ? "border-orange-glow bg-orange-glow text-white"
                  : active
                    ? "border-orange-glow bg-white text-orange-glow"
                    : "border-line-soft bg-white text-ink-muted/40"
              }`}
            >
              {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              {active && (
                <span className="absolute inset-0 animate-ping rounded-full border-2 border-orange-glow/50" />
              )}
            </span>
            {/* label */}
            <div className="pt-1">
              <p
                className={`font-mono text-[12px] uppercase tracking-[0.12em] font-bold ${
                  complete || active ? "text-brown-deep" : "text-ink-muted/50"
                }`}
              >
                {step.label}
              </p>
              {(complete || active) && tsFor(step.key) && (
                <p className="mt-0.5 text-[11px] text-ink-muted">{tsFor(step.key)}</p>
              )}
              {active && !tsFor(step.key) && (
                <p className="mt-0.5 text-[11px] text-orange-glow">In progress…</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
