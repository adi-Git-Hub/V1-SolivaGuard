import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Package, CreditCard,
  FileText, Truck, CheckCircle2, Clock,
  XCircle, RotateCcw, CircleDot,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAdminOrders, type AdminOrder } from "@/features/admin/api";
import { useUpdateOrderStatus, documentUrl } from "@/features/orders/api";

export const Route = createFileRoute("/admin/orders/$orderId")({
  component: OrderDetailRoute,
});

/* ─── Status config ─────────────────────────────────────────────── */
const TRANSITIONS: Record<string, string[]> = {
  pending:          ["paid", "cancelled"],
  paid:             ["confirmed", "packed", "cancelled", "refunded"],
  confirmed:        ["packed", "shipped", "cancelled", "refunded"],
  packed:           ["shipped", "cancelled", "refunded"],
  shipped:          ["out_for_delivery", "cancelled", "refunded"],
  out_for_delivery: ["delivered", "cancelled", "refunded"],
  delivered:        ["refunded"],
  cancelled:        [],
  refunded:         [],
};

const STATUS_BADGE: Record<string, string> = {
  pending:          "bg-amber-50 text-amber-700 border-amber-200",
  paid:             "bg-blue-50 text-blue-700 border-blue-200",
  confirmed:        "bg-sky-50 text-sky-700 border-sky-200",
  packed:           "bg-indigo-50 text-indigo-700 border-indigo-200",
  shipped:          "bg-purple-50 text-purple-700 border-purple-200",
  out_for_delivery: "bg-orange-50 text-orange-700 border-orange-200",
  delivered:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled:        "bg-red-50 text-red-600 border-red-200",
  refunded:         "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  pending:          Clock,
  paid:             CreditCard,
  confirmed:        CheckCircle2,
  packed:           Package,
  shipped:          Truck,
  out_for_delivery: Truck,
  delivered:        CheckCircle2,
  cancelled:        XCircle,
  refunded:         RotateCcw,
};

/* ─── Ordered timeline steps ────────────────────────────────────── */
const TIMELINE_STEPS = [
  "pending", "paid", "confirmed", "packed", "shipped", "out_for_delivery", "delivered",
];

/* ─── Page ─────────────────────────────────────────────────────── */
function OrderDetailRoute() {
  const { orderId }    = Route.useParams();
  const navigate       = useNavigate();
  const { data: ordersData, isLoading } = useAdminOrders();
  const updateStatus   = useUpdateOrderStatus();
  const [newStatus, setNewStatus]       = useState("");
  const [confirmStatus, setConfirmStatus] = useState(false);

  // Find the order by ID from the all-orders cache
  const order: AdminOrder | undefined = ordersData?.orders.find(o => o._id === orderId);

  function onUpdateStatus() {
    if (!newStatus || newStatus === order?.orderStatus) return;
    setConfirmStatus(true); // intercept — show confirm first
  }

  function onStatusConfirmed() {
    updateStatus.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Status updated → ${newStatus.replace(/_/g," ")}`);
          setConfirmStatus(false);
          setNewStatus("");
        },
        onError: (e: any) => {
          toast.error(e?.message ?? "Invalid transition");
          setConfirmStatus(false);
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-[1rem] font-medium text-[#3a2a22]/50">Order not found</p>
        <Link to="/admin/orders"
          className="font-mono text-[0.5rem] tracking-[0.22em] uppercase font-bold text-[#B88445] hover:underline"
        >
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const transitions = TRANSITIONS[order.orderStatus] ?? [];
  const s = order.shippingInfo;
  const addrLine = [s?.houseNo, s?.buildingName, s?.street, s?.landmark, s?.address]
    .filter(Boolean).join(", ");
  const cityLine  = [s?.city, s?.state, s?.pincode ?? s?.pinCode].filter(Boolean).join(", ");

  const isCancelled = ["cancelled","refunded"].includes(order.orderStatus);

  // Events/audit trail sorted newest-first
  const events = [...(order.events ?? [])].reverse();

  /* ── timeline ── */
  const currentIdx = TIMELINE_STEPS.indexOf(order.orderStatus);

  return (
    <div className="space-y-6">
      {/* ── Back + header ── */}
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div>
          <Link
            to="/admin/orders"
            className="mb-3 flex items-center gap-1.5 font-mono text-[0.5rem] tracking-[0.22em] uppercase font-bold text-[#3a2a22]/40 hover:text-[#B88445] transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[1.5rem] leading-tight tracking-tight text-[#2D241E]">
              #{orderId.slice(-8).toUpperCase()}
            </h1>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[0.5rem] tracking-[0.14em] uppercase font-bold ${STATUS_BADGE[order.orderStatus] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
              {order.orderStatus.replace(/_/g," ")}
            </span>
          </div>
          {order.invoiceNumber && (
            <p className="mt-1 font-mono text-[0.5625rem] text-[#3a2a22]/35">
              Invoice {order.invoiceNumber}
              {order.receiptNumber && <> · Receipt {order.receiptNumber}</>}
            </p>
          )}
        </div>

        {/* Status update action */}
        {transitions.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={newStatus || order.orderStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="rounded-xl border border-[#3a2a22]/12 bg-[#FDFAF6] px-3 py-2 font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[#2D241E] outline-none focus:border-[#B88445]/40 cursor-pointer"
            >
              <option value={order.orderStatus}>{order.orderStatus.replace(/_/g," ")}</option>
              {transitions.map(t => (
                <option key={t} value={t}>{t.replace(/_/g," ")}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={onUpdateStatus}
              disabled={!newStatus || newStatus === order.orderStatus || updateStatus.isPending}
              className="rounded-xl bg-[#B88445] px-4 py-2 font-mono text-[0.5rem] tracking-[0.18em] uppercase font-bold text-white transition-all hover:bg-[#D4A05C] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {updateStatus.isPending ? "Updating…" : "Update"}
            </button>
          </div>
        )}
      </div>

      {/* ── Shipping timeline ── */}
      {!isCancelled && (
        <div className="rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]">
          <p className="mb-4 font-mono text-[0.5rem] tracking-[0.28em] uppercase font-bold text-[#3a2a22]/35">
            Shipping Timeline
          </p>
          <div className="relative flex items-start gap-0 overflow-x-auto pb-2">
            {TIMELINE_STEPS.map((step, idx) => {
              const isDone    = currentIdx >= idx;
              const isCurrent = currentIdx === idx;
              const StepIcon  = STATUS_ICON[step] ?? CircleDot;
              return (
                <div key={step} className="flex flex-1 min-w-[80px] flex-col items-center gap-2">
                  {/* Connector line */}
                  {idx > 0 && (
                    <div className="absolute" style={{ left: `calc(${(idx / TIMELINE_STEPS.length) * 100}% - 50%)` }}>
                    </div>
                  )}
                  {/* Icon */}
                  <div className="relative flex flex-col items-center">
                    {idx > 0 && (
                      <div
                        className={`absolute top-4 right-full w-full h-0.5 -translate-y-1/2 ${isDone ? "bg-[#B88445]" : "bg-[#3a2a22]/10"}`}
                        style={{ width: "100%" }}
                      />
                    )}
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.15 : 1,
                        backgroundColor: isDone ? "#B88445" : "#F7F3EC",
                        borderColor: isDone ? "#B88445" : "#3a2a2220",
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2"
                    >
                      <StepIcon className={`h-3.5 w-3.5 ${isDone ? "text-white" : "text-[#3a2a22]/25"}`} />
                    </motion.div>
                  </div>
                  {/* Label */}
                  <p className={`text-center font-mono text-[0.45rem] tracking-[0.1em] uppercase font-bold px-1 ${
                    isCurrent ? "text-[#B88445]" : isDone ? "text-[#2D241E]" : "text-[#3a2a22]/25"
                  }`}>
                    {step.replace(/_/g," ")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="font-medium text-red-700 text-[0.875rem]">
              Order {order.orderStatus}
            </p>
            <p className="text-[0.75rem] text-red-500/70">Stock has been automatically restored.</p>
          </div>
        </div>
      )}

      {/* ── Main grid: left (customer + payment) + right (items + docs) ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Left column ── */}
        <div className="space-y-4 lg:col-span-1">
          {/* Customer info */}
          <Section icon={MapPin} title="Customer & Shipping">
            {s?.fullName && (
              <Row label="Name">{s.fullName}</Row>
            )}
            {(s?.phone ?? s?.phoneNo) && (
              <Row label="Phone">{s?.phone ?? String(s?.phoneNo)}</Row>
            )}
            {order.user && typeof order.user === "object" && order.user.email && (
              <Row label="Email">{order.user.email}</Row>
            )}
            {addrLine && <Row label="Address">{addrLine}</Row>}
            {cityLine  && <Row label="City">{cityLine}</Row>}
            {s?.country && <Row label="Country">{s.country}</Row>}
            {s?.addressType && <Row label="Type">{s.addressType}</Row>}
          </Section>

          {/* Payment info */}
          <Section icon={CreditCard} title="Payment">
            <Row label="Status">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.48rem] tracking-[0.12em] uppercase font-bold ${
                order.paymentInfo?.status === "paid"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {order.paymentInfo?.status ?? "pending"}
              </span>
            </Row>
            {order.paymentInfo?.razorpay_order_id && (
              <Row label="Razorpay Order">{order.paymentInfo.razorpay_order_id}</Row>
            )}
            {order.paymentInfo?.razorpay_payment_id && (
              <Row label="Payment ID">{order.paymentInfo.razorpay_payment_id}</Row>
            )}
          </Section>
        </div>

        {/* ── Right column (span 2) ── */}
        <div className="space-y-4 lg:col-span-2">
          {/* Order items */}
          <Section icon={Package} title="Order Items">
            <div className="space-y-3">
              {order.orderItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 rounded-xl object-cover border border-[#3a2a22]/08 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[0.8125rem] font-medium text-[#2D241E]">{item.name}</p>
                    <p className="font-mono text-[0.58rem] text-[#3a2a22]/40">
                      Qty {item.quantity} · {formatMoney(Math.round(item.price * 100), "INR")} each
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-[0.875rem] text-[#2D241E]">
                    {formatMoney(Math.round(item.price * item.quantity * 100), "INR")}
                  </p>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="mt-4 border-t border-[#3a2a22]/06 pt-4 space-y-1.5">
              <PriceRow label="Subtotal" value={formatMoney(Math.round(order.itemsPrice * 100), "INR")} />
              {order.taxPrice > 0 && (
                <PriceRow label="Tax (GST)" value={formatMoney(Math.round(order.taxPrice * 100), "INR")} />
              )}
              {order.shippingPrice > 0 && (
                <PriceRow label="Shipping" value={formatMoney(Math.round(order.shippingPrice * 100), "INR")} />
              )}
              {order.shippingPrice === 0 && (
                <PriceRow label="Shipping" value="Free" />
              )}
              <div className="border-t border-[#3a2a22]/06 pt-1.5">
                <PriceRow
                  label="Total"
                  value={formatMoney(Math.round(order.totalPrice * 100), "INR")}
                  bold
                />
              </div>
            </div>
          </Section>

          {/* Documents */}
          {(documentUrl(order.invoiceUrl) || documentUrl(order.receiptUrl)) && (
            <Section icon={FileText} title="Documents">
              <div className="flex flex-wrap gap-2">
                {documentUrl(order.invoiceUrl) && (
                  <a
                    href={documentUrl(order.invoiceUrl)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[#B88445]/20 bg-[#B88445]/06 px-4 py-2.5 font-mono text-[0.5rem] tracking-[0.18em] uppercase font-bold text-[#B88445] transition-all hover:bg-[#B88445]/12"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Download Invoice
                    {order.invoiceNumber && <span className="text-[#B88445]/60">· {order.invoiceNumber}</span>}
                  </a>
                )}
                {documentUrl(order.receiptUrl) && (
                  <a
                    href={documentUrl(order.receiptUrl)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[#3a2a22]/12 bg-[#3a2a22]/03 px-4 py-2.5 font-mono text-[0.5rem] tracking-[0.18em] uppercase font-bold text-[#3a2a22]/60 transition-all hover:bg-[#3a2a22]/06"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Download Receipt
                    {order.receiptNumber && <span className="opacity-60">· {order.receiptNumber}</span>}
                  </a>
                )}
              </div>
            </Section>
          )}

          {/* Audit events */}
          {events.length > 0 && (
            <Section icon={Clock} title="Order Events">
              <div className="space-y-2">
                {events.map((ev, i) => {
                  const EvIcon = STATUS_ICON[ev.status] ?? CircleDot;
                  const isFirst = i === 0;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isFirst
                          ? "bg-[#B88445] text-white"
                          : "bg-[#3a2a22]/06 text-[#3a2a22]/40"
                      }`}>
                        <EvIcon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className={`text-[0.75rem] font-medium ${isFirst ? "text-[#2D241E]" : "text-[#3a2a22]/60"}`}>
                          {ev.status.replace(/_/g," ")}
                        </p>
                        {ev.message && (
                          <p className="text-[0.6875rem] text-[#3a2a22]/40">{ev.message}</p>
                        )}
                        {ev.timestamp && (
                          <p className="font-mono text-[0.52rem] text-[#3a2a22]/30">
                            {new Date(ev.timestamp).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Order status confirmation */}
      <ConfirmDialog
        open={confirmStatus}
        title="Update order status?"
        description={`Order #${order?.invoiceNumber ?? orderId.slice(-8).toUpperCase()} status will be changed.`}
        detail={`Status: ${order?.orderStatus?.replace(/_/g, " ")} → ${newStatus.replace(/_/g, " ")}`}
        confirmLabel="Yes, Update"
        cancelLabel="Cancel"
        isLoading={updateStatus.isPending}
        onConfirm={onStatusConfirmed}
        onCancel={() => setConfirmStatus(false)}
      />
    </div>
  );
}

/* ─── Section card ───────────────────────────────────────────────── */
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#B88445]/10">
          <Icon className="h-3.5 w-3.5 text-[#B88445]" />
        </div>
        <p className="font-mono text-[0.5rem] tracking-[0.24em] uppercase font-bold text-[#3a2a22]/45">
          {title}
        </p>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Label-value row ────────────────────────────────────────────── */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-[#3a2a22]/04 last:border-0">
      <p className="w-24 shrink-0 font-mono text-[0.5rem] tracking-[0.16em] uppercase font-bold text-[#3a2a22]/30 pt-0.5">
        {label}
      </p>
      <p className="flex-1 text-[0.8125rem] text-[#2D241E] break-all">{children}</p>
    </div>
  );
}

/* ─── Price row ─────────────────────────────────────────────────── */
function PriceRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <p className={`text-[0.8rem] ${bold ? "font-semibold text-[#2D241E]" : "text-[#3a2a22]/50"}`}>
        {label}
      </p>
      <p className={`text-[0.8rem] tabular-nums ${bold ? "font-bold text-[#2D241E]" : "text-[#3a2a22]/60"}`}>
        {value}
      </p>
    </div>
  );
}
