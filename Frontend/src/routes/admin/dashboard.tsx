import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, ShoppingBag, Package, Wallet,
  Clock, CheckCircle2, Truck, XCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { useAdminStats, useAdminOrders } from "@/features/admin/api";
import { useUpdateOrderStatus, documentUrl } from "@/features/orders/api";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardRoute,
});

/* ─── Status transitions (mirrors backend state machine) ─────────── */
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

/* ─── Count-up animation hook ────────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const t    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * target));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

/* ─── Status badge ────────────────────────────────────────────────── */
const STATUS_BADGE: Record<string, string> = {
  pending:          "bg-amber-50 text-amber-700 border border-amber-200",
  paid:             "bg-blue-50 text-blue-700 border border-blue-200",
  confirmed:        "bg-sky-50 text-sky-700 border border-sky-200",
  packed:           "bg-indigo-50 text-indigo-700 border border-indigo-200",
  shipped:          "bg-purple-50 text-purple-700 border border-purple-200",
  out_for_delivery: "bg-orange-50 text-orange-700 border border-orange-200",
  delivered:        "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled:        "bg-red-50 text-red-600 border border-red-200",
  refunded:         "bg-gray-100 text-gray-500 border border-gray-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[0.5rem] tracking-[0.14em] uppercase font-bold ${
        STATUS_BADGE[status] ?? "bg-gray-100 text-gray-500 border border-gray-200"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

/* ─── Stat card ───────────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "#B88445",
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-8px_rgba(44,28,18,0.14)]"
    >
      {/* left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-300 group-hover:top-0 group-hover:bottom-0"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${accent}18` }}
        >
          <div style={{ color: accent }}><Icon className="h-4 w-4" /></div>
        </div>
      </div>
      <div className="mt-3">
        <p className="font-display text-[1.6rem] leading-none text-[#2D241E] tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-[0.65rem] text-[#3a2a22]/40">{sub}</p>}
      </div>
      <p className="mt-2 font-mono text-[0.5rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/40">
        {label}
      </p>
    </motion.div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────── */
function AdminDashboardRoute() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();

  const orders = ordersData?.orders ?? [];

  // Status breakdown computed client-side
  const pending    = orders.filter(o => o.orderStatus === "pending").length;
  const processing = orders.filter(o => ["paid","confirmed","packed"].includes(o.orderStatus)).length;
  const shipped    = orders.filter(o => ["shipped","out_for_delivery"].includes(o.orderStatus)).length;
  const delivered  = orders.filter(o => o.orderStatus === "delivered").length;
  const cancelled  = orders.filter(o => ["cancelled","refunded"].includes(o.orderStatus)).length;

  const revenue = useCountUp(stats ? Math.round(stats.totalRevenue) : 0, 1500);
  const totalOrders  = useCountUp(stats?.totalOrders ?? 0, 900);
  const totalCustomers = useCountUp(stats?.totalUsers ?? 0, 900);
  const totalProducts  = useCountUp(stats?.totalProducts ?? 0, 700);

  const isLoading = statsLoading || ordersLoading;

  // Recent 5 orders from dashboard endpoint
  const recentOrders = stats?.recentOrders ?? [];

  function onStatusChange(orderId: string, status: string) {
    updateStatus.mutate(
      { orderId, status },
      {
        onSuccess: () => toast.success(`Order updated to ${status}`),
        onError: (e: any) => toast.error(e?.message ?? "Invalid transition"),
      },
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div>
        <p className="font-mono text-[0.5rem] tracking-[0.32em] uppercase font-bold text-[#B88445] mb-1">
          Overview
        </p>
        <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[#2D241E]">
          Dashboard
        </h1>
      </div>

      {/* ── Stat cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={Wallet}        label="Revenue (paid)"      value={`₹${revenue.toLocaleString("en-IN")}`}          accent="#B88445" delay={0.00} />
          <StatCard icon={ShoppingBag}   label="Total Orders"        value={totalOrders.toString()}                         accent="#6366F1" delay={0.06} />
          <StatCard icon={Users}         label="Customers"           value={totalCustomers.toString()}                      accent="#0EA5E9" delay={0.12} />
          <StatCard icon={Package}       label="Products"            value={totalProducts.toString()}                       accent="#10B981" delay={0.18} />
          <StatCard icon={Clock}         label="Pending"             value={pending.toString()}    sub="Awaiting action"    accent="#F59E0B" delay={0.24} />
          <StatCard icon={CheckCircle2}  label="Processing"          value={processing.toString()} sub="Paid → Packed"     accent="#6366F1" delay={0.30} />
          <StatCard icon={Truck}         label="Shipped"             value={shipped.toString()}    sub="In transit"         accent="#8B5CF6" delay={0.36} />
          <StatCard icon={XCircle}       label="Cancelled"           value={cancelled.toString()}  sub="incl. refunded"    accent="#EF4444" delay={0.42} />
        </div>
      )}

      {/* ── Recent orders ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[1.15rem] tracking-tight text-[#2D241E]">
            Recent Orders
          </h2>
          <Link
            to="/admin/orders"
            className="flex items-center gap-1.5 font-mono text-[0.5rem] tracking-[0.2em] uppercase font-bold text-[#B88445] transition-colors hover:text-[#D4A05C]"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : recentOrders.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#3a2a22]/12 py-12">
            <p className="text-sm text-[#3a2a22]/35">No orders yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3a2a22]/06">
                    {["Order ID", "Customer", "Amount", "Payment", "Status", "Docs", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-mono text-[0.48rem] tracking-[0.22em] uppercase font-bold text-[#3a2a22]/35">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o, i) => {
                    const transitions = TRANSITIONS[o.orderStatus] ?? [];
                    return (
                      <motion.tr
                        key={o._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="group border-b border-[#3a2a22]/05 last:border-0 transition-colors hover:bg-[#3a2a22]/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <Link
                            to="/admin/orders/$orderId"
                            params={{ orderId: o._id }}
                            className="font-mono text-[0.6875rem] font-medium text-[#B88445] hover:underline"
                          >
                            #{o._id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[0.8125rem] font-medium text-[#2D241E]">
                            {o.user && typeof o.user === "object" ? o.user.name ?? "—" : "—"}
                          </p>
                          <p className="text-[0.6875rem] text-[#3a2a22]/40">
                            {o.user && typeof o.user === "object" ? o.user.email : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-medium text-[0.8125rem] text-[#2D241E]">
                          {formatMoney(Math.round(o.totalPrice * 100), "INR")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[0.48rem] tracking-[0.12em] uppercase font-bold ${
                            o.paymentInfo?.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {o.paymentInfo?.status ?? "pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {transitions.length === 0 ? (
                            <StatusBadge status={o.orderStatus} />
                          ) : (
                            <select
                              defaultValue={o.orderStatus}
                              onChange={e => onStatusChange(o._id, e.target.value)}
                              disabled={updateStatus.isPending}
                              className="rounded-lg border border-[#3a2a22]/12 bg-[#F7F3EC] px-2 py-1 font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[#2D241E] outline-none focus:border-[#B88445]/40 disabled:opacity-50 cursor-pointer"
                            >
                              <option value={o.orderStatus}>{o.orderStatus.replace(/_/g," ")}</option>
                              {transitions.map(t => (
                                <option key={t} value={t}>{t.replace(/_/g," ")}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            {documentUrl(o.invoiceUrl) ? (
                              <a href={documentUrl(o.invoiceUrl)} target="_blank" rel="noreferrer"
                                className="font-mono text-[0.58rem] text-[#B88445] hover:underline">
                                Invoice
                              </a>
                            ) : <span className="text-[0.58rem] text-[#3a2a22]/25">—</span>}
                            {documentUrl(o.receiptUrl) && (
                              <a href={documentUrl(o.receiptUrl)} target="_blank" rel="noreferrer"
                                className="font-mono text-[0.58rem] text-[#B88445] hover:underline">
                                Receipt
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[0.6rem] text-[#3a2a22]/40">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", {
                            day:"2-digit", month:"short", year:"numeric"
                          }) : "—"}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
