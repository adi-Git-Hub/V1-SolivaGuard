import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CreditCard, CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { useAdminPayments } from "@/features/admin/api";
import { documentUrl } from "@/features/orders/api";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsRoute,
});

const STATUS_FILTERS = [
  { label: "All",      value: "" },
  { label: "Paid",     value: "paid" },
  { label: "Pending",  value: "pending" },
  { label: "Failed",   value: "failed" },
  { label: "Refunded", value: "refunded" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  paid:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  failed:   "bg-red-50 text-red-600 border-red-200",
  refunded: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  paid:     CheckCircle2,
  pending:  Clock,
  failed:   XCircle,
  refunded: RotateCcw,
};

function PaymentBadge({ status }: { status?: string }) {
  const s = status ?? "pending";
  const Icon = STATUS_ICON[s] ?? Clock;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[0.48rem] tracking-[0.12em] uppercase font-bold ${STATUS_BADGE[s] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
      <Icon className="h-2.5 w-2.5" /> {s}
    </span>
  );
}

function AdminPaymentsRoute() {
  const [statusFilter, setStatus] = useState("");
  const [search, setSearch]       = useState("");

  const { data, isLoading } = useAdminPayments({
    status: statusFilter || undefined,
    keyword: search || undefined,
  });

  const payments = data?.payments ?? [];
  const summary  = data?.summary;

  function getCustomerName(payment: typeof payments[0]) {
    const u = payment.user;
    if (u && typeof u === "object" && "name" in u) return u.name ?? "—";
    return "—";
  }

  function getCustomerEmail(payment: typeof payments[0]) {
    const u = payment.user;
    if (u && typeof u === "object" && "email" in u) return u.email ?? "";
    return "";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="font-mono text-[0.5rem] tracking-[0.32em] uppercase font-bold text-[#B88445] mb-1">Finance</p>
        <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[#2D241E]">Payments</h1>
        <p className="mt-1 text-[0.8125rem] text-[#3a2a22]/45">{isLoading ? "Loading…" : `${payments.length} transactions`}</p>
      </div>

      {/* Summary cards */}
      {!isLoading && summary && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <SummaryCard icon={CheckCircle2} label="Total Revenue (Paid)" value={formatMoney(Math.round((summary.totalPaid ?? 0) * 100), "INR")} accent="#10B981" />
          <SummaryCard icon={Clock}        label="Pending"               value={String(summary.totalPending ?? 0)} sub="transactions"  accent="#F59E0B" />
          <SummaryCard icon={XCircle}      label="Failed"                value={String(summary.totalFailed ?? 0)}  sub="transactions"  accent="#EF4444" />
        </div>
      )}

      {/* Search + filter pills */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3a2a22]/30" />
          <input
            type="search"
            placeholder="Search payment ID or order ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#3a2a22]/10 bg-[#FDFAF6] py-2.5 pl-9 pr-4 text-[0.8125rem] text-[#2D241E] placeholder-[#3a2a22]/30 outline-none transition-colors focus:border-[#B88445]/40 focus:ring-2 focus:ring-[#B88445]/10"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.16em] uppercase font-bold transition-all ${
                statusFilter === f.value
                  ? "border-[#B88445] bg-[#B88445] text-white"
                  : "border-[#3a2a22]/10 bg-[#FDFAF6] text-[#3a2a22]/50 hover:border-[#B88445]/30 hover:text-[#B88445]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : payments.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#3a2a22]/12 py-16">
          <p className="text-[0.9rem] font-medium text-[#3a2a22]/40">No payments found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#3a2a22]/06">
                  {["Payment ID", "Order", "Customer", "Amount", "Method", "Status", "Date", "Receipt"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[0.45rem] tracking-[0.22em] uppercase font-bold text-[#3a2a22]/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <motion.tr
                    key={p._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.25) }}
                    className="group border-b border-[#3a2a22]/05 last:border-0 transition-colors hover:bg-[#B88445]/[0.025]"
                  >
                    {/* Payment ID */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-[0.6rem] text-[#2D241E]">
                        {p.paymentInfo?.razorpay_payment_id
                          ? p.paymentInfo.razorpay_payment_id.slice(-12)
                          : "—"}
                      </p>
                      {p.paymentInfo?.razorpay_payment_id && (
                        <p className="font-mono text-[0.5rem] text-[#3a2a22]/30 truncate max-w-[120px]">
                          {p.paymentInfo.razorpay_payment_id}
                        </p>
                      )}
                    </td>

                    {/* Order */}
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/orders/$orderId"
                        params={{ orderId: p.orderId }}
                        className="font-mono text-[0.6875rem] font-bold text-[#B88445] hover:underline"
                      >
                        #{p.orderId.slice(-8).toUpperCase()}
                      </Link>
                      {p.invoiceNumber && (
                        <p className="font-mono text-[0.48rem] text-[#3a2a22]/30">{p.invoiceNumber}</p>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="truncate text-[0.8125rem] font-medium text-[#2D241E]">{getCustomerName(p)}</p>
                      <p className="truncate font-mono text-[0.58rem] text-[#3a2a22]/40">{getCustomerEmail(p)}</p>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 font-semibold text-[0.875rem] text-[#2D241E]">
                      {formatMoney(Math.round((p.amount ?? 0) * 100), "INR")}
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-mono text-[0.55rem] text-[#3a2a22]/55">
                        <CreditCard className="h-3 w-3" /> Razorpay
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3"><PaymentBadge status={p.paymentInfo?.status} /></td>

                    {/* Date */}
                    <td className="px-4 py-3 font-mono text-[0.58rem] text-[#3a2a22]/40 whitespace-nowrap">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>

                    {/* Receipt */}
                    <td className="px-4 py-3">
                      {documentUrl(p.receiptUrl) ? (
                        <a
                          href={documentUrl(p.receiptUrl)} target="_blank" rel="noreferrer"
                          className="font-mono text-[0.5rem] tracking-[0.12em] uppercase font-bold text-[#B88445] hover:underline"
                        >
                          Receipt
                        </a>
                      ) : <span className="font-mono text-[0.5rem] text-[#3a2a22]/20">—</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#3a2a22]/06 px-4 py-3">
            <p className="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#3a2a22]/30">
              {payments.length} transaction{payments.length !== 1 ? "s" : ""}
              {statusFilter && ` · ${statusFilter}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string; accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.07)]"
    >
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: accent }} />
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accent}18` }}>
        <div style={{ color: accent }}><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-3 font-display text-[1.5rem] leading-none text-[#2D241E] tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[0.65rem] text-[#3a2a22]/40">{sub}</p>}
      <p className="mt-2 font-mono text-[0.5rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/40">{label}</p>
    </motion.div>
  );
}
