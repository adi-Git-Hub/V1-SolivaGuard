import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Receipt,
  MapPin,
  CreditCard,
  Package,
  Loader2,
} from "lucide-react";

import { useOrder, documentUrl } from "@/features/orders/api";
import { OrderTimeline, trackingLabel, statusTone } from "@/features/orders/components/OrderTimeline";
import { ease } from "@/design-system";

export const Route = createFileRoute("/_public/profile/orders/$id")({
  component: OrderDetailsRoute,
  head: () => ({ meta: [{ title: "Order Details — SOLIVA" }] }),
});

const inr = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-brown-deep/8 bg-white p-6 sm:p-7 shadow-[0_24px_60px_-44px_rgba(58,42,34,0.5)]">
      <h2 className="mb-4 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-orange-glow">
        <Icon className="h-4 w-4" /> {title}
      </h2>
      {children}
    </div>
  );
}

function OrderDetailsRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, isError } = useOrder(id);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FAF7F3]">
        <Loader2 className="h-7 w-7 animate-spin text-orange-glow" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FAF7F3] px-6 text-center">
        <div>
          <p className="font-display text-xl text-brown-deep">Order not found</p>
          <p className="mt-1 text-sm text-ink-muted">It may have been removed, or you need to sign in.</p>
          <button
            onClick={() => navigate({ to: "/profile" })}
            className="mt-5 rounded-full bg-brown-deep px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const ship = order.shippingInfo;
  const invoiceHref = documentUrl(order.invoiceUrl);
  const receiptHref = documentUrl(order.receiptUrl);

  return (
    <div className="min-h-screen w-full bg-[#FAF7F3] text-brown-deep safe-x pb-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 pt-28 md:pt-32">
        <Link
          to="/profile"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted hover:text-orange-glow"
        >
          <ArrowLeft className="h-4 w-4" /> My Orders
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: ease.luxe }}
          className="mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <h1 className="font-display text-2xl tracking-tight">
              Order #{order.id.slice(-10).toUpperCase()}
            </h1>
            <p className="text-[13px] text-ink-muted">
              Placed {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
              {order.invoiceNumber ? ` · ${order.invoiceNumber}` : ""}
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${statusTone(order.orderStatus)}`}>
            {trackingLabel(order.orderStatus)}
          </span>
        </motion.div>

        {/* Document CTAs */}
        <div className="mb-6 flex flex-wrap gap-3">
          <a
            href={invoiceHref}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-2 rounded-full border border-brown-deep/20 bg-white px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-colors hover:border-brown-deep/40 ${!invoiceHref ? "pointer-events-none opacity-40" : ""}`}
          >
            <FileText className="h-4 w-4" /> Download Invoice
          </a>
          <a
            href={receiptHref}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-2 rounded-full border border-brown-deep/20 bg-white px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-colors hover:border-brown-deep/40 ${!receiptHref ? "pointer-events-none opacity-40" : ""}`}
          >
            <Receipt className="h-4 w-4" /> Download Receipt
          </a>
        </div>

        <div className="space-y-6">
          {/* Products */}
          <Card title="Products" icon={Package}>
            <div className="space-y-4">
              {order.orderItems.map((it, i) => (
                <div key={i} className="flex items-center gap-4">
                  {it.image && (
                    <img src={it.image} alt={it.name} className="h-16 w-16 shrink-0 rounded-xl border border-line-soft object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{it.name}</p>
                    <p className="text-[12px] text-ink-muted">Qty: {it.quantity}</p>
                  </div>
                  <p className="font-display">{inr((it.price || 0) * it.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-1.5 border-t border-line-soft pt-4 text-[13px]">
              <Row k="Items" v={inr(order.itemsPrice)} />
              <Row k="Tax (incl.)" v={inr(order.taxPrice)} />
              <Row k="Shipping" v={order.shippingPrice ? inr(order.shippingPrice) : "FREE"} />
              <div className="flex items-center justify-between border-t border-line-soft pt-2.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">Grand Total</span>
                <span className="font-display text-lg">{inr(order.totalPrice)}</span>
              </div>
            </div>
          </Card>

          {/* Tracking */}
          <Card title="Order Tracking" icon={Package}>
            <OrderTimeline order={order} />
          </Card>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card title="Shipping Address" icon={MapPin}>
              {ship ? (
                <p className="text-[13px] leading-relaxed text-brown-deep/80">
                  <span className="font-semibold text-brown-deep">{ship.fullName}</span>
                  <br />
                  {[ship.houseNo, ship.buildingName, ship.street, ship.landmark].filter(Boolean).join(", ")}
                  <br />
                  {ship.city}, {ship.state} {ship.pincode}
                  <br />
                  {ship.country}
                  <br />
                  <span className="text-ink-muted">{ship.phone}</span>
                </p>
              ) : (
                <p className="text-[13px] text-ink-muted">—</p>
              )}
            </Card>

            <Card title="Payment" icon={CreditCard}>
              <p className="text-[13px] text-brown-deep/80">Method: Razorpay</p>
              <p className="mt-1 text-[13px] text-brown-deep/80">
                Status:{" "}
                <span className="font-semibold text-emerald-600">
                  {(order.paymentInfo?.status ?? "paid").toUpperCase()}
                </span>
              </p>
              {order.paymentInfo?.razorpay_payment_id && (
                <p className="mt-1 break-all font-mono text-[11px] text-ink-muted">
                  {order.paymentInfo.razorpay_payment_id}
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-ink-muted">
      <span>{k}</span>
      <span className="text-brown-deep">{v}</span>
    </div>
  );
}
