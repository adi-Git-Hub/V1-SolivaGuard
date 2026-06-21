import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingBag, Calendar, BarChart3,
  Users, Repeat2, ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { useAdminAnalytics, type RevenueTrendPoint, type TopProduct, type CustomerGrowthPoint } from "@/features/admin/api";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsRoute,
});

function AdminAnalyticsRoute() {
  const { data, isLoading } = useAdminAnalytics();
  const summary = data?.summary;
  const trend   = data?.revenueTrend ?? [];
  const topProducts = data?.topProducts ?? [];
  const customerGrowth = data?.customerGrowth ?? [];
  const statusBreakdown = data?.statusBreakdown ?? {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="font-mono text-[0.5rem] tracking-[0.32em] uppercase font-bold text-[#B88445] mb-1">Insights</p>
        <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[#2D241E]">Analytics</h1>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[110px] rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard icon={TrendingUp}  label="Revenue Today"   value={formatMoney(Math.round((summary?.revenueToday ?? 0)  * 100), "INR")} accent="#B88445" delay={0.00} />
          <KpiCard icon={TrendingUp}  label="Revenue Week"    value={formatMoney(Math.round((summary?.revenueWeek ?? 0)   * 100), "INR")} accent="#6366F1" delay={0.06} />
          <KpiCard icon={TrendingUp}  label="Revenue Month"   value={formatMoney(Math.round((summary?.revenueMonth ?? 0)  * 100), "INR")} accent="#0EA5E9" delay={0.12} />
          <KpiCard icon={TrendingUp}  label="Revenue Year"    value={formatMoney(Math.round((summary?.revenueYear ?? 0)   * 100), "INR")} accent="#10B981" delay={0.18} />
          <KpiCard icon={ShoppingBag} label="Orders Today"    value={String(summary?.ordersToday ?? 0)}                                   accent="#F59E0B" delay={0.24} />
          <KpiCard icon={Calendar}    label="Orders Month"    value={String(summary?.ordersMonth ?? 0)}                                   accent="#8B5CF6" delay={0.30} />
          <KpiCard icon={BarChart3}   label="Avg Order Value" value={formatMoney(Math.round((summary?.avgOrderValue ?? 0) * 100), "INR")} accent="#EF4444" delay={0.36} />
          <KpiCard icon={Repeat2}     label="Returning"       value="—"   sub="coming soon" accent="#3a2a22" delay={0.42} />
        </div>
      )}

      {/* Two-column charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue trend */}
        <ChartCard title="Revenue Trend" subtitle="Last 30 days">
          {isLoading ? <Skeleton className="h-48 rounded-xl" /> : <RevenueTrendChart data={trend} />}
        </ChartCard>

        {/* Order status breakdown */}
        <ChartCard title="Order Status" subtitle="All-time breakdown">
          {isLoading ? <Skeleton className="h-48 rounded-xl" /> : <StatusBreakdown data={statusBreakdown} />}
        </ChartCard>

        {/* Top products */}
        <ChartCard title="Top Products" subtitle="By revenue">
          {isLoading ? <Skeleton className="h-48 rounded-xl" /> : <TopProductsChart data={topProducts} />}
        </ChartCard>

        {/* Customer growth */}
        <ChartCard title="Customer Growth" subtitle="New registrations per month">
          {isLoading ? <Skeleton className="h-48 rounded-xl" /> : <CustomerGrowthChart data={customerGrowth} />}
        </ChartCard>
      </div>
    </div>
  );
}

/* ─── Revenue trend bars ─────────────────────────────────────────────── */
function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  const last7  = data.slice(-7);
  if (data.length === 0) return <EmptyChart />;

  return (
    <div className="space-y-4">
      {/* Bars — last 30 days mini */}
      <div className="flex items-end gap-0.5 h-28">
        {data.map((d, i) => {
          const h = Math.max(4, (d.revenue / maxRev) * 100);
          const isLast7 = i >= data.length - 7;
          return (
            <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end">
              <div
                className={`w-full rounded-t transition-all ${isLast7 ? "bg-[#B88445]" : "bg-[#B88445]/30"} hover:bg-[#D4A05C]`}
                style={{ height: `${h}%` }}
              />
              <div className="pointer-events-none absolute bottom-full mb-1 z-10 hidden group-hover:flex">
                <div className="rounded-lg bg-[#1C140F] px-2 py-1 text-center shadow-lg">
                  <p className="font-mono text-[0.45rem] text-[#B88445]">{d.date.slice(5)}</p>
                  <p className="font-mono text-[0.5rem] font-bold text-white">{formatMoney(Math.round(d.revenue * 100), "INR")}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between font-mono text-[0.45rem] text-[#3a2a22]/30">
        <span>{data[0]?.date?.slice(5) ?? ""}</span>
        <span>Last 30 days</span>
        <span>{data[data.length - 1]?.date?.slice(5) ?? ""}</span>
      </div>

      {/* Last 7 days table */}
      <div className="border-t border-[#3a2a22]/06 pt-3 space-y-1">
        {last7.map(d => (
          <div key={d.date} className="flex items-center justify-between">
            <span className="font-mono text-[0.55rem] text-[#3a2a22]/45">{d.date}</span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[0.55rem] text-[#3a2a22]/40">{d.orders} orders</span>
              <span className="font-mono text-[0.6rem] font-bold text-[#2D241E]">{formatMoney(Math.round(d.revenue * 100), "INR")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Status breakdown ───────────────────────────────────────────────── */
const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B", paid: "#3B82F6", confirmed: "#0EA5E9",
  packed: "#6366F1", shipped: "#8B5CF6", out_for_delivery: "#F97316",
  delivered: "#10B981", cancelled: "#EF4444", refunded: "#6B7280",
};

function StatusBreakdown({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return <EmptyChart />;
  return (
    <div className="space-y-2.5">
      {entries.map(([status, count]) => {
        const pct = Math.round((count / total) * 100);
        const color = STATUS_COLOR[status] ?? "#9CA3AF";
        return (
          <div key={status} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.55rem] capitalize text-[#3a2a22]/55">{status.replace(/_/g, " ")}</span>
              <span className="font-mono text-[0.55rem] font-bold text-[#2D241E]">{count} <span className="font-normal text-[#3a2a22]/35">({pct}%)</span></span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#3a2a22]/06">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Top products ───────────────────────────────────────────────────── */
function TopProductsChart({ data }: { data: TopProduct[] }) {
  if (data.length === 0) return <EmptyChart />;
  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((p, i) => (
        <motion.div
          key={p.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-3"
        >
          <span className="w-4 shrink-0 font-mono text-[0.5rem] text-[#3a2a22]/30 text-right">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="truncate text-[0.75rem] font-medium text-[#2D241E]">{p.name}</p>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="font-mono text-[0.5rem] text-[#3a2a22]/40">{p.units} units</span>
                <span className="font-mono text-[0.6rem] font-bold text-[#2D241E]">{formatMoney(Math.round(p.revenue * 100), "INR")}</span>
              </div>
            </div>
            <div className="h-1 w-full rounded-full bg-[#3a2a22]/06">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(p.revenue / maxRev) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.04 }}
                className="h-full rounded-full bg-[#B88445]"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Customer growth ────────────────────────────────────────────────── */
function CustomerGrowthChart({ data }: { data: CustomerGrowthPoint[] }) {
  const maxC = Math.max(...data.map(d => d.customers), 1);
  if (data.length === 0) return <EmptyChart />;
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => {
          const h = Math.max(4, (d.customers / maxC) * 100);
          return (
            <div key={d.month} className="group relative flex flex-1 flex-col items-center justify-end">
              <div
                className="w-full rounded-t bg-[#0EA5E9]/60 hover:bg-[#0EA5E9] transition-colors"
                style={{ height: `${h}%` }}
              />
              <div className="pointer-events-none absolute bottom-full mb-1 z-10 hidden group-hover:flex">
                <div className="rounded-lg bg-[#1C140F] px-2 py-1 shadow-lg">
                  <p className="font-mono text-[0.45rem] text-[#0EA5E9]">{d.month}</p>
                  <p className="font-mono text-[0.5rem] font-bold text-white">{d.customers} new</p>
                </div>
              </div>
              <p className="mt-1 font-mono text-[0.38rem] text-[#3a2a22]/30 rotate-45 origin-left">{d.month}</p>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5">
        <Users className="h-3 w-3 text-[#0EA5E9]" />
        <span className="font-mono text-[0.5rem] text-[#3a2a22]/40">
          Total: {data.reduce((s, d) => s + d.customers, 0)} new customers (12 months)
        </span>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-28 items-center justify-center">
      <p className="text-[0.8125rem] text-[#3a2a22]/30">No data yet</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-display text-[1rem] leading-tight text-[#2D241E]">{title}</p>
          <p className="mt-0.5 font-mono text-[0.48rem] text-[#3a2a22]/35">{subtitle}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-[#B88445]/40" />
      </div>
      {children}
    </motion.div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent, delay }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string; accent: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.07)] transition-all hover:-translate-y-0.5"
    >
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all group-hover:top-0 group-hover:bottom-0" style={{ background: accent }} />
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accent}18` }}>
        <div style={{ color: accent }}><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3">
        <p className="font-display text-[1.45rem] leading-none text-[#2D241E] tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-[0.65rem] text-[#3a2a22]/40">{sub}</p>}
      </div>
      <p className="mt-2 font-mono text-[0.5rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/40">{label}</p>
    </motion.div>
  );
}
