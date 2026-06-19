import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Receipt, MapPin, CreditCard, Package, ArrowRight } from "lucide-react";

import { documentUrl } from "@/features/orders/api";
import type { Order } from "@/features/orders/schema";
import { OrderTimeline, trackingLabel, statusTone } from "@/features/orders/components/OrderTimeline";
import { ease } from "@/design-system";

const inr = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const variantOf = (name: string) => (name.includes("—") ? name.split("—").pop()?.trim() : "");

function Summary({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted font-bold">{k}</p>
      <p className="text-[13px] font-semibold text-brown-deep break-words">{v}</p>
    </div>
  );
}

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

function PayRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-[13px] text-ink-muted">{k}</span>
      <span className={`text-right text-[13px] text-brown-deep ${mono ? "break-all font-mono text-[11px]" : ""}`}>{v}</span>
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

/**
 * Shared premium order experience body. Rendered by both:
 *   • /track/:orderId          (mode="track"   — adds "View Full Order Details")
 *   • /profile/orders/:id      (mode="details")
 */
export function OrderExperience({ order, mode = "details" }: { order: Order; mode?: "track" | "details" }) {
  const ship = order.shippingInfo;
  const invoiceHref = documentUrl(order.invoiceUrl);
  const receiptHref = documentUrl(order.receiptUrl);
  const customerEmail = typeof order.user === "object" ? (order.user as any)?.email : undefined;
  const isTrack = mode === "track";

  return (
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
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-orange-glow font-bold">
            {isTrack ? "Track Order" : "Order Details"}
          </p>
          <h1 className="font-display text-2xl tracking-tight">Order #{order.id.slice(-10).toUpperCase()}</h1>
          <p className="text-[13px] text-ink-muted">
            Placed{" "}
            {order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
              : "—"}
            {order.invoiceNumber ? ` · ${order.invoiceNumber}` : ""}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${statusTone(order.orderStatus)}`}>
          {trackingLabel(order.orderStatus)}
        </span>
      </motion.div>

      {/* Document CTAs (+ View Full Order Details on the track page) */}
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
        {isTrack && (
          <Link
            to="/profile/orders/$id"
            params={{ id: order.id }}
            className="inline-flex items-center gap-2 rounded-full bg-brown-deep px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-transform active:scale-95"
          >
            View Full Order Details <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {/* Order Summary */}
        <Card title="Order Summary" icon={FileText}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Summary k="Order ID" v={`#${order.id.slice(-10).toUpperCase()}`} />
            <Summary k="Invoice No." v={order.invoiceNumber || "Generating…"} />
            <Summary k="Receipt No." v={order.receiptNumber || "Generating…"} />
            <Summary
              k="Placed On"
              v={order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            />
            <Summary
              k="Est. Delivery"
              v={
                order.orderStatus === "delivered"
                  ? "Delivered"
                  : new Date((order.createdAt ? new Date(order.createdAt).getTime() : Date.now()) + 6 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
              }
            />
            <Summary k="Items" v={`${order.orderItems.length} product${order.orderItems.length > 1 ? "s" : ""}`} />
          </div>
        </Card>

        {/* Tracking timeline — primary on the track page */}
        <Card title="Order Tracking" icon={Package}>
          <OrderTimeline order={order} />
        </Card>

        {/* Products */}
        <Card title="Product Information" icon={Package}>
          <div className="space-y-4">
            {order.orderItems.map((it, i) => (
              <div key={i} className="flex items-center gap-4">
                {it.image && (
                  <img src={it.image} alt={it.name} className="h-16 w-16 shrink-0 rounded-xl border border-line-soft object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{it.name}</p>
                  <p className="text-[12px] text-ink-muted">
                    {variantOf(it.name) && <span>Color: {variantOf(it.name)} · </span>}
                    Qty: {it.quantity} · {inr(it.price)} each
                  </p>
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card title="Customer & Shipping" icon={MapPin}>
            {ship ? (
              <p className="text-[13px] leading-relaxed text-brown-deep/80">
                <span className="font-semibold text-brown-deep">{ship.fullName}</span>
                <br />
                <span className="text-ink-muted">{ship.phone}</span>
                {customerEmail && (
                  <>
                    <br />
                    <span className="text-ink-muted">{customerEmail}</span>
                  </>
                )}
                <br />
                <span className="mt-2 block">
                  {[ship.houseNo, ship.buildingName, ship.street, ship.landmark].filter(Boolean).join(", ")}
                  <br />
                  {ship.city}, {ship.state} {ship.pincode}
                  <br />
                  {ship.country}
                </span>
              </p>
            ) : (
              <p className="text-[13px] text-ink-muted">—</p>
            )}
          </Card>

          <Card title="Payment Information" icon={CreditCard}>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-ink-muted">Status</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  {(order.paymentInfo?.status ?? "paid").toUpperCase()}
                </span>
              </div>
              <PayRow k="Method" v="Razorpay" />
              {order.paymentInfo?.razorpay_payment_id && (
                <PayRow k="Transaction ID" v={order.paymentInfo.razorpay_payment_id} mono />
              )}
              {order.invoiceNumber && <PayRow k="Invoice No." v={order.invoiceNumber} mono />}
              {order.receiptNumber && <PayRow k="Receipt No." v={order.receiptNumber} mono />}
            </div>
          </Card>
        </div>

        {/* Customer message */}
        <div className="rounded-3xl border border-orange-glow/15 bg-gradient-to-br from-[#FBF3E7] to-[#F8ECDC] p-7 text-center shadow-[0_24px_60px_-44px_rgba(199,102,0,0.5)]">
          <p className="font-display text-xl text-brown-deep">Thank you for choosing Soliva.</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-brown-deep/70">
            Your invoice and payment receipt are securely stored and available anytime inside your account.
          </p>
        </div>
      </div>
    </div>
  );
}
