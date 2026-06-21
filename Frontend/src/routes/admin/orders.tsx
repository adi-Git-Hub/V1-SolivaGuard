import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { useAdminOrders, type AdminOrder } from "@/features/admin/api";
import { useUpdateOrderStatus, documentUrl } from "@/features/orders/api";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersRoute,
});

/* ─── Status config ───────────────────────────────────────────────── */
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

const PAYMENT_BADGE: Record<string, string> = {
  paid:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  failed:   "bg-red-50 text-red-600 border-red-200",
  refunded: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_FILTERS = [
  { label: "All",           value: "all" },
  { label: "Pending",       value: "pending" },
  { label: "Paid",          value: "paid" },
  { label: "Confirmed",     value: "confirmed" },
  { label: "Packed",        value: "packed" },
  { label: "Shipped",       value: "shipped" },
  { label: "Out for delivery", value: "out_for_delivery" },
  { label: "Delivered",     value: "delivered" },
  { label: "Cancelled",     value: "cancelled" },
  { label: "Refunded",      value: "refunded" },
] as const;

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.48rem] tracking-[0.12em] uppercase font-bold ${STATUS_BADGE[status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function getCustomerName(o: AdminOrder): string {
  if (o.shippingInfo?.fullName) return o.shippingInfo.fullName;
  if (o.user && typeof o.user === "object" && o.user.name) return o.user.name;
  return "—";
}

function getCustomerEmail(o: AdminOrder): string {
  if (o.user && typeof o.user === "object" && o.user.email) return o.user.email;
  return "";
}

function getCustomerPhone(o: AdminOrder): string {
  const s = o.shippingInfo;
  if (!s) return "";
  return s.phone ?? (s.phoneNo ? String(s.phoneNo) : "");
}

/* ─── Page ─────────────────────────────────────────────────────────── */
function AdminOrdersRoute() {
  const { data: ordersData, isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();

  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<string>("all");

  const orders = ordersData?.orders ?? [];

  const filtered = useMemo(() => {
    let list = orders;
    if (filter !== "all") {
      list = list.filter(o => o.orderStatus === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o._id.toLowerCase().includes(q) ||
        getCustomerName(o).toLowerCase().includes(q) ||
        getCustomerEmail(o).toLowerCase().includes(q) ||
        o.orderItems.some(i => i.name.toLowerCase().includes(q)),
      );
    }
    // Sort newest first
    return [...list].sort((a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );
  }, [orders, filter, search]);

  // Count per status for filter pills
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    orders.forEach(o => { c[o.orderStatus] = (c[o.orderStatus] ?? 0) + 1; });
    return c;
  }, [orders]);

  function onStatusChange(orderId: string, status: string) {
    updateStatus.mutate(
      { orderId, status },
      {
        onSuccess: () => toast.success(`Order updated → ${status.replace(/_/g," ")}`),
        onError: (e: any) => toast.error(e?.message ?? "Invalid transition"),
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.5rem] tracking-[0.32em] uppercase font-bold text-[#B88445] mb-1">
            Management
          </p>
          <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[#2D241E]">
            Orders
          </h1>
          <p className="mt-1 text-[0.8125rem] text-[#3a2a22]/45">
            {isLoading ? "Loading…" : `${orders.length} total orders`}
          </p>
        </div>
      </div>

      {/* ── Search + controls ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3a2a22]/30" />
          <input
            type="search"
            placeholder="Search by ID, customer, product…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#3a2a22]/10 bg-[#FDFAF6] py-2.5 pl-9 pr-4 text-[0.8125rem] text-[#2D241E] placeholder-[#3a2a22]/30 outline-none transition-colors focus:border-[#B88445]/40 focus:ring-2 focus:ring-[#B88445]/10"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[0.7rem] text-[#3a2a22]/40">
          <SlidersHorizontal className="h-3 w-3" />
          <span>{filtered.length} shown</span>
        </div>
      </div>

      {/* ── Status filter pills ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.16em] uppercase font-bold transition-all ${
              filter === f.value
                ? "border-[#B88445] bg-[#B88445] text-white"
                : "border-[#3a2a22]/10 bg-[#FDFAF6] text-[#3a2a22]/50 hover:border-[#B88445]/30 hover:text-[#B88445]"
            }`}
          >
            {f.label}
            {counts[f.value] !== undefined && (
              <span className={`rounded-full px-1 py-0.5 text-[0.4rem] font-bold ${
                filter === f.value ? "bg-white/25 text-white" : "bg-[#3a2a22]/08 text-[#3a2a22]/50"
              }`}>
                {counts[f.value] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#3a2a22]/12 py-16">
          <p className="text-[0.9rem] font-medium text-[#3a2a22]/40">No orders found</p>
          <p className="mt-1 text-[0.75rem] text-[#3a2a22]/25">
            {search ? "Try a different search" : "No orders match this filter"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#3a2a22]/06">
                  {["Order", "Customer", "Product(s)", "Amount", "Payment", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[0.45rem] tracking-[0.22em] uppercase font-bold text-[#3a2a22]/30">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => {
                  const transitions = TRANSITIONS[o.orderStatus] ?? [];
                  const phone = getCustomerPhone(o);
                  const s = o.shippingInfo;
                  return (
                    <motion.tr
                      key={o._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.3) }}
                      className="group border-b border-[#3a2a22]/05 last:border-0 transition-colors hover:bg-[#B88445]/[0.025]"
                    >
                      {/* Order ID */}
                      <td className="px-4 py-3">
                        <Link
                          to="/admin/orders/$orderId"
                          params={{ orderId: o._id }}
                          className="font-mono text-[0.6875rem] font-bold text-[#B88445] hover:underline"
                        >
                          #{o._id.slice(-8).toUpperCase()}
                        </Link>
                        {o.invoiceNumber && (
                          <p className="font-mono text-[0.5rem] text-[#3a2a22]/30 mt-0.5">
                            {o.invoiceNumber}
                          </p>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="truncate text-[0.8125rem] font-medium text-[#2D241E]">
                          {getCustomerName(o)}
                        </p>
                        {getCustomerEmail(o) && (
                          <p className="truncate font-mono text-[0.58rem] text-[#3a2a22]/40">
                            {getCustomerEmail(o)}
                          </p>
                        )}
                        {phone && (
                          <p className="font-mono text-[0.58rem] text-[#3a2a22]/35">{phone}</p>
                        )}
                        {s?.city && (
                          <p className="font-mono text-[0.55rem] text-[#3a2a22]/30">
                            {[s.city, s.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </td>

                      {/* Products */}
                      <td className="px-4 py-3 max-w-[180px]">
                        {o.orderItems.map((item, j) => (
                          <div key={j} className={j > 0 ? "mt-1" : ""}>
                            <p className="truncate text-[0.75rem] text-[#2D241E]">{item.name}</p>
                            <p className="font-mono text-[0.55rem] text-[#3a2a22]/35">
                              Qty {item.quantity} · {formatMoney(Math.round(item.price * 100), "INR")}
                            </p>
                          </div>
                        ))}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3">
                        <p className="text-[0.875rem] font-semibold text-[#2D241E]">
                          {formatMoney(Math.round(o.totalPrice * 100), "INR")}
                        </p>
                        {o.shippingPrice > 0 && (
                          <p className="font-mono text-[0.5rem] text-[#3a2a22]/30">
                            +{formatMoney(Math.round(o.shippingPrice * 100), "INR")} ship
                          </p>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.48rem] tracking-[0.12em] uppercase font-bold ${
                          PAYMENT_BADGE[o.paymentInfo?.status ?? ""] ?? "bg-gray-100 text-gray-500 border-gray-200"
                        }`}>
                          {o.paymentInfo?.status ?? "pending"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {transitions.length === 0 ? (
                          <StatusBadge status={o.orderStatus} />
                        ) : (
                          <select
                            defaultValue={o.orderStatus}
                            onChange={e => onStatusChange(o._id, e.target.value)}
                            disabled={updateStatus.isPending}
                            className="rounded-lg border border-[#3a2a22]/12 bg-[#F7F3EC] px-2 py-1 font-mono text-[0.56rem] tracking-[0.1em] uppercase text-[#2D241E] outline-none focus:border-[#B88445]/40 disabled:opacity-50 cursor-pointer"
                          >
                            <option value={o.orderStatus}>{o.orderStatus.replace(/_/g," ")}</option>
                            {transitions.map(t => (
                              <option key={t} value={t}>{t.replace(/_/g," ")}</option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 font-mono text-[0.58rem] text-[#3a2a22]/40 whitespace-nowrap">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        }) : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Link
                            to="/admin/orders/$orderId"
                            params={{ orderId: o._id }}
                            className="flex items-center gap-1 font-mono text-[0.5rem] tracking-[0.12em] uppercase font-bold text-[#B88445] hover:underline"
                          >
                            View <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                          {documentUrl(o.invoiceUrl) && (
                            <a
                              href={documentUrl(o.invoiceUrl)} target="_blank" rel="noreferrer"
                              className="font-mono text-[0.5rem] tracking-[0.12em] uppercase font-bold text-[#3a2a22]/40 hover:text-[#3a2a22]"
                            >
                              Invoice
                            </a>
                          )}
                          {documentUrl(o.receiptUrl) && (
                            <a
                              href={documentUrl(o.receiptUrl)} target="_blank" rel="noreferrer"
                              className="font-mono text-[0.5rem] tracking-[0.12em] uppercase font-bold text-[#3a2a22]/40 hover:text-[#3a2a22]"
                            >
                              Receipt
                            </a>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Footer row ── */}
          <div className="flex items-center justify-between border-t border-[#3a2a22]/06 px-4 py-3">
            <p className="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#3a2a22]/30">
              {filtered.length} order{filtered.length !== 1 ? "s" : ""}
              {filter !== "all" && ` · ${filter.replace(/_/g," ")}`}
            </p>
            {ordersData?.totalAmount !== undefined && filter === "all" && (
              <p className="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#3a2a22]/30">
                Total: {formatMoney(Math.round(ordersData.totalAmount * 100), "INR")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
