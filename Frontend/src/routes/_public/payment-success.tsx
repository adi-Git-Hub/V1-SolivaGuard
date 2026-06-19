import { useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, FileText, Receipt, Package, MapPin, CreditCard, Truck, ArrowRight } from "lucide-react";

import { useCheckoutStore } from "@/features/checkout/store";
import { useOrder, documentUrl } from "@/features/orders/api";
import { OrderTimeline } from "@/features/orders/components/OrderTimeline";
import { ease } from "@/design-system";

export const Route = createFileRoute("/_public/payment-success")({
  component: PaymentSuccessRoute,
  head: () => ({ meta: [{ title: "Payment Successful — SOLIVA" }] }),
});

const inr = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function PaymentSuccessRoute() {
  const navigate = useNavigate();
  const { confirmedOrder } = useCheckoutStore();
  const orderId = confirmedOrder?.orderId ?? "";
  const { data: order, isLoading } = useOrder(orderId);

  useEffect(() => {
    if (!orderId) navigate({ to: "/" });
  }, [orderId, navigate]);

  const items = order?.orderItems ?? confirmedOrder?.items ?? [];
  const total = order?.totalPrice ?? confirmedOrder?.total ?? 0;
  const ship = order?.shippingInfo;
  const eta = order?.createdAt
    ? new Date(new Date(order.createdAt).getTime() + 6 * 86400000)
    : new Date(Date.now() + 6 * 86400000);

  const invoiceHref = documentUrl(order?.invoiceUrl);
  const receiptHref = documentUrl(order?.receiptUrl);
  const variantOf = (name: string) => (name.includes("—") ? name.split("—").pop()?.trim() : "");

  return (
    <div className="relative min-h-screen w-full bg-[#FAF7F3] text-brown-deep safe-x pb-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 pt-28 md:pt-32">
        {/* Success header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: ease.luxe }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 14 }}
            className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_18px_40px_-14px_rgba(16,122,77,0.55)]"
          >
            <Check className="h-10 w-10 text-white" strokeWidth={3} />
          </motion.div>
          <h1 className="mt-6 font-display text-[clamp(1.8rem,5vw,2.6rem)] leading-tight tracking-tight">
            Payment Successful
          </h1>
          <p className="mt-2 text-ink-muted">
            Thank you{ship?.fullName ? `, ${ship.fullName.split(" ")[0]}` : ""} — your order is confirmed.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-brown-deep/10 bg-white/70 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-brown-deep">
            Order ID&nbsp;<span className="font-bold">#{orderId.slice(-10).toUpperCase()}</span>
          </p>
        </motion.div>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate({ to: "/profile/orders/$id", params: { id: orderId } })}
            className="inline-flex items-center gap-2 rounded-full bg-brown-deep px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-transform active:scale-95"
          >
            View Order <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href={invoiceHref}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!invoiceHref}
            className={`inline-flex items-center gap-2 rounded-full border border-brown-deep/20 bg-white px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brown-deep transition-colors hover:border-brown-deep/40 ${!invoiceHref ? "pointer-events-none opacity-40" : ""}`}
          >
            <FileText className="h-4 w-4" /> Invoice
          </a>
          <a
            href={receiptHref}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!receiptHref}
            className={`inline-flex items-center gap-2 rounded-full border border-brown-deep/20 bg-white px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brown-deep transition-colors hover:border-brown-deep/40 ${!receiptHref ? "pointer-events-none opacity-40" : ""}`}
          >
            <Receipt className="h-4 w-4" /> Receipt
          </a>
        </div>
        <p className="mt-3 text-center text-[12px] text-ink-muted">
          Your Invoice and Receipt are now available in{" "}
          <button
            onClick={() => navigate({ to: "/profile" })}
            className="font-semibold text-orange-glow underline-offset-2 hover:underline"
          >
            Profile → Orders
          </button>
          .
        </p>
        <p className="mt-2 text-center text-[12px] font-bold text-brown-deep">
          You can also check your product details in your registered email.
        </p>

        {/* Order summary card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-10 overflow-hidden rounded-3xl border border-brown-deep/8 bg-white shadow-[0_24px_60px_-40px_rgba(58,42,34,0.5)]"
        >
          <div className="border-b border-line-soft p-6 sm:p-7">
            <h2 className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-orange-glow">
              <Package className="h-4 w-4" /> Order Summary
            </h2>
            <div className="mt-4 space-y-4">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-4">
                  {it.image && (
                    <img
                      src={it.image}
                      alt={it.name}
                      className="h-16 w-16 shrink-0 rounded-xl border border-line-soft object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-brown-deep">{it.name}</p>
                    <p className="text-[12px] text-ink-muted">
                      {variantOf(it.name) && <span>Variant: {variantOf(it.name)} · </span>}
                      Qty: {it.quantity}
                    </p>
                  </div>
                  <p className="font-display text-brown-deep">{inr((it.price || 0) * it.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                Order Total
              </span>
              <span className="font-display text-xl text-brown-deep">{inr(total)}</span>
            </div>
          </div>

          {/* Shipping + payment + ETA */}
          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-3 sm:p-7">
            <div>
              <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                <MapPin className="h-3.5 w-3.5" /> Shipping
              </p>
              {ship ? (
                <p className="text-[13px] leading-relaxed text-brown-deep/80">
                  {ship.fullName}
                  <br />
                  {[ship.houseNo, ship.street].filter(Boolean).join(", ")}
                  <br />
                  {ship.city}, {ship.state} {ship.pincode}
                  <br />
                  {ship.phone}
                </p>
              ) : (
                <p className="text-[13px] text-ink-muted">—</p>
              )}
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                <CreditCard className="h-3.5 w-3.5" /> Payment
              </p>
              <p className="text-[13px] text-brown-deep/80">Razorpay (UPI / Card)</p>
              <p className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                Paid
              </p>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                <Truck className="h-3.5 w-3.5" /> Est. Delivery
              </p>
              <p className="text-[13px] text-brown-deep/80">
                {eta.toLocaleDateString("en-IN", { day: "2-digit", month: "long" })}
              </p>
              <p className="text-[11px] text-ink-muted">5–7 business days</p>
            </div>
          </div>
        </motion.div>

        {/* Tracking timeline */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 rounded-3xl border border-brown-deep/8 bg-white p-6 sm:p-7 shadow-[0_24px_60px_-40px_rgba(58,42,34,0.5)]"
          >
            <h2 className="mb-5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-orange-glow">
              Order Tracking
            </h2>
            <OrderTimeline order={order} />
          </motion.div>
        )}

        <div className="mt-8 text-center">
          <Link to="/collection" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted hover:text-orange-glow">
            Continue Shopping →
          </Link>
        </div>
      </div>
    </div>
  );
}
