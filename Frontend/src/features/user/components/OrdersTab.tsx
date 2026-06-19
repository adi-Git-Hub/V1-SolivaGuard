import { Package, FileText, Receipt, MapPin, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useMyOrders, documentUrl } from "@/features/orders/api";
import {
  trackingLabel,
  statusTone,
} from "@/features/orders/components/OrderTimeline";
import { formatMoney } from "@/lib/format";

const variantOf = (name: string) => (name.includes("—") ? name.split("—").pop()?.trim() : "");

export function OrdersTab() {
  const { data: orders = [], isLoading, isError } = useMyOrders();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-44 bg-surface-panel rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-12 text-center bg-orange-50/50 rounded-3xl border border-orange-100">
        <p className="font-display text-lg text-brown-deep font-bold">Unable to load orders.</p>
        <p className="text-sm text-ink-muted mt-2">Please refresh the page or try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="block h-px w-6 bg-orange-glow/40" />
          <span className="font-mono text-micro-sm sm:text-micro-md tracking-editorial text-orange-glow uppercase font-bold">
            PROCUREMENT
          </span>
        </div>
        <h1 className="font-display text-brown-deep tracking-tight leading-hero text-display-lg">
          My Orders
        </h1>
      </header>

      {orders.length === 0 ? (
        <div className="text-center p-16 sm:p-24 bg-surface-panel/80 rounded-3xl border border-line-hairline backdrop-blur-medium shadow-soft">
          <Package className="h-16 w-16 text-ink-disabled mx-auto mb-6 opacity-30" />
          <h3 className="font-display text-2xl text-brown-deep font-bold mb-3">No orders yet</h3>
          <p className="text-ink-muted text-sm max-w-xs mx-auto mb-8 font-medium">
            When you acquire Soliva protection, your orders will appear here.
          </p>
          <Link to="/collection">
            <Button className="rounded-full bg-brown-deep text-white px-10 py-6 uppercase font-bold tracking-cta text-micro-md">
              Start Exploring
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const date = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—";
            const first = order.orderItems[0];
            const invoiceHref = documentUrl(order.invoiceUrl);
            const receiptHref = documentUrl(order.receiptUrl);

            return (
              <div
                key={order.id}
                className="bg-surface-panel/90 border border-line-hairline rounded-3xl p-5 sm:p-7 backdrop-blur-medium shadow-soft"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  {/* image */}
                  <div className="h-20 w-20 shrink-0 rounded-2xl bg-cream border border-line-hairline overflow-hidden grid place-items-center">
                    {first?.image ? (
                      <img src={first.image} alt={first.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-7 w-7 text-ink-disabled opacity-40" />
                    )}
                  </div>

                  {/* info */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] tracking-widest text-ink-muted uppercase font-bold">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest ${statusTone(order.orderStatus)}`}>
                        {trackingLabel(order.orderStatus)}
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-600">
                        {(order.paymentInfo?.status ?? "paid").toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-display text-lg text-brown-deep font-bold truncate max-w-full">
                      {first?.name || "Soliva Protection"}
                    </h4>
                    <p className="text-[12px] text-ink-muted">
                      {variantOf(first?.name || "") && <span>Color: {variantOf(first!.name)} · </span>}
                      Qty: {first?.quantity ?? 1} · {date}
                    </p>
                  </div>

                  {/* total */}
                  <div className="sm:text-right">
                    <span className="block font-mono text-[9px] tracking-cta text-ink-muted uppercase font-bold mb-0.5">
                      Total Paid
                    </span>
                    <span className="font-display text-xl text-brown-deep font-bold tracking-tight">
                      {formatMoney(Math.round(order.totalPrice * 100), "INR")}
                    </span>
                    <span className="block text-[11px] text-ink-muted">
                      Subtotal {formatMoney(Math.round((order.itemsPrice || order.totalPrice) * 100), "INR")}
                    </span>
                  </div>
                </div>

                {/* CTAs — one clean row on desktop, 2-col touch grid on mobile */}
                <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-line-soft pt-4 sm:flex sm:flex-wrap">
                  <Link
                    to="/profile/orders/$id"
                    params={{ id: order.id }}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brown-deep px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-white active:scale-95"
                  >
                    View Details <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    to="/profile/orders/$id"
                    params={{ id: order.id }}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-line-strong px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted hover:text-brown-deep active:scale-95"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Track Order
                  </Link>
                  <a
                    href={invoiceHref}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-line-strong px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted hover:text-brown-deep active:scale-95 ${!invoiceHref ? "pointer-events-none opacity-40" : ""}`}
                  >
                    <FileText className="h-3.5 w-3.5" /> Invoice
                  </a>
                  <a
                    href={receiptHref}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-line-strong px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted hover:text-brown-deep active:scale-95 ${!receiptHref ? "pointer-events-none opacity-40" : ""}`}
                  >
                    <Receipt className="h-3.5 w-3.5" /> Receipt
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
