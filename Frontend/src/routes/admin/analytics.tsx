import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingBag, Calendar, BarChart3,
  Users, Repeat2, ArrowUpRight, Eye, Globe,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import {
  useAdminAnalytics,
  useReachAnalytics,
  type RevenueTrendPoint,
  type TopProduct,
  type CustomerGrowthPoint,
} from "@/features/admin/api";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsRoute,
});

export function AdminAnalyticsRoute() {
  // Queries
  const { data: commerceData, isLoading: commerceLoading } = useAdminAnalytics();
  const { data: reachData, isLoading: reachLoading } = useReachAnalytics();

  const summary = commerceData?.summary;
  const trend = commerceData?.revenueTrend ?? [];
  const topProducts = commerceData?.topProducts ?? [];
  const customerGrowth = commerceData?.customerGrowth ?? [];
  const statusBreakdown = commerceData?.statusBreakdown ?? {};

  const reach = reachData;

  return (
    <div className="space-y-12">
      {/* ─────────────────────────────────────────────────────────────────
          SECTION 1 (TOP): COMMERCE & REVENUE ANALYTICS (EXISTING DASHBOARD)
      ───────────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <p className="font-mono text-[0.5rem] tracking-[0.32em] uppercase font-bold text-[#B88445] mb-1">
            Insights
          </p>
          <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[#2D241E]">
            Analytics
          </h1>
          <p className="mt-0.5 text-[0.78rem] text-[#3a2a22]/55">
            Store revenue performance, order distribution, customer trends, and website traffic reach.
          </p>
        </div>

        {/* Commerce KPI Grid */}
        {commerceLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[110px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              icon={TrendingUp}
              label="Revenue Today"
              value={formatMoney(Math.round((summary?.revenueToday ?? 0) * 100), "INR")}
              accent="#B88445"
              delay={0.0}
            />
            <KpiCard
              icon={TrendingUp}
              label="Revenue Week"
              value={formatMoney(Math.round((summary?.revenueWeek ?? 0) * 100), "INR")}
              accent="#6366F1"
              delay={0.06}
            />
            <KpiCard
              icon={TrendingUp}
              label="Revenue Month"
              value={formatMoney(Math.round((summary?.revenueMonth ?? 0) * 100), "INR")}
              accent="#0EA5E9"
              delay={0.12}
            />
            <KpiCard
              icon={TrendingUp}
              label="Revenue Year"
              value={formatMoney(Math.round((summary?.revenueYear ?? 0) * 100), "INR")}
              accent="#10B981"
              delay={0.18}
            />
            <KpiCard
              icon={ShoppingBag}
              label="Orders Today"
              value={String(summary?.ordersToday ?? 0)}
              accent="#F59E0B"
              delay={0.24}
            />
            <KpiCard
              icon={Calendar}
              label="Orders Month"
              value={String(summary?.ordersMonth ?? 0)}
              accent="#8B5CF6"
              delay={0.3}
            />
            <KpiCard
              icon={BarChart3}
              label="Avg Order Value"
              value={formatMoney(Math.round((summary?.avgOrderValue ?? 0) * 100), "INR")}
              accent="#EF4444"
              delay={0.36}
            />
            <KpiCard
              icon={Repeat2}
              label="Returning"
              value="—"
              sub="coming soon"
              accent="#3a2a22"
              delay={0.42}
            />
          </div>
        )}

        {/* Existing Commerce Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue trend */}
          <ChartCard title="Revenue Trend" subtitle="Last 30 days">
            {commerceLoading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : (
              <RevenueTrendChart data={trend} />
            )}
          </ChartCard>

          {/* Order status breakdown */}
          <ChartCard title="Order Status" subtitle="All-time breakdown">
            {commerceLoading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : (
              <StatusBreakdown data={statusBreakdown} />
            )}
          </ChartCard>

          {/* Top products */}
          <ChartCard title="Top Products" subtitle="By revenue">
            {commerceLoading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : (
              <TopProductsChart data={topProducts} />
            )}
          </ChartCard>

          {/* Customer growth */}
          <ChartCard title="Customer Growth" subtitle="New registrations per month">
            {commerceLoading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : (
              <CustomerGrowthChart data={customerGrowth} />
            )}
          </ChartCard>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 2 (SCROLL DOWN): WEBSITE TRAFFIC (FOCUSED & LIGHTWEIGHT)
      ───────────────────────────────────────────────────────────────── */}
      <section className="space-y-6 pt-6 border-t border-[#3a2a22]/10">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#B88445]" />
            <h2 className="font-display text-[1.45rem] leading-tight text-[#2D241E]">
              Website Traffic
            </h2>
          </div>
          <p className="mt-0.5 font-mono text-[0.55rem] text-[#3a2a22]/50">
            Real-time public storefront reach, distinct visitors, and 7-day traffic trend
          </p>
        </div>

        {/* 3 Website Traffic KPI Cards */}
        {reachLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[110px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard
              icon={Users}
              label="Total Website Visitors"
              value={String(reach?.totalVisitors ?? reach?.uniqueVisitors ?? 0)}
              sub="Total unique visitors recorded"
              accent="#6366F1"
              delay={0.0}
            />
            <KpiCard
              icon={Calendar}
              label="Today's Visitors"
              value={String(reach?.todayVisitors ?? 0)}
              sub="Distinct visitors seen today"
              accent="#10B981"
              delay={0.06}
            />
            <KpiCard
              icon={Eye}
              label="Total Page Views"
              value={String(reach?.totalPageViews ?? 0)}
              sub="Total tracked page visits"
              accent="#B88445"
              delay={0.12}
            />
          </div>
        )}

        {/* Website Traffic Chart (Last 7 Days) */}
        <ChartCard
          title="Website Traffic Chart"
          subtitle="Daily unique visitors & page views over the last 7 days"
        >
          {reachLoading ? (
            <Skeleton className="h-56 rounded-xl" />
          ) : (
            <WebsiteTrafficChart data={reach?.trafficTrend ?? []} />
          )}
        </ChartCard>
      </section>
    </div>
  );
}

/* ─── Website Traffic 7-Day Chart ────────────────────────────────────── */
function formatDayLabel(dateStr: string): string {
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "UTC" });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function WebsiteTrafficChart({
  data,
}: {
  data: Array<{ date: string; pageViews: number; uniqueVisitors: number }>;
}) {
  const hasActivity = data.some((d) => d.pageViews > 0 || d.uniqueVisitors > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-44 flex-col items-center justify-center text-center p-4">
        <p className="font-display text-[0.95rem] text-[#2D241E]">No website traffic recorded yet</p>
        <p className="mt-1 font-mono text-[0.62rem] text-[#3a2a22]/40 max-w-sm">
          Visits will appear here in real time as customers browse the storefront.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.pageViews, d.uniqueVisitors)),
    1
  );

  return (
    <div className="space-y-4">
      {/* Legend & Summary Info */}
      <div className="flex items-center justify-between font-mono text-[0.55rem]">
        <div>
          {!hasActivity && (
            <span className="text-[#3a2a22]/45 italic">
              Awaiting first visitor events on public storefront
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-[#0EA5E9]" />
            <span className="text-[#3a2a22]/70 font-medium">Unique Visitors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-[#B88445]" />
            <span className="text-[#3a2a22]/70 font-medium">Page Views</span>
          </div>
        </div>
      </div>

      {/* Dual Bars Timeline */}
      <div className="flex items-end gap-2 h-40 border-b border-[#3a2a22]/08 pb-1">
        {data.map((d) => {
          const pvHeight = hasActivity ? Math.max(d.pageViews > 0 ? 6 : 0, (d.pageViews / maxVal) * 100) : 0;
          const uvHeight = hasActivity ? Math.max(d.uniqueVisitors > 0 ? 6 : 0, (d.uniqueVisitors / maxVal) * 100) : 0;

          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center justify-end h-full"
            >
              {/* Dual bars side-by-side */}
              <div className="flex items-end gap-1 w-full justify-center h-full">
                {/* Unique visitors bar (Cyan) */}
                <div
                  className="w-1/2 max-w-[18px] rounded-t bg-[#0EA5E9] transition-all group-hover:bg-[#38BDF8]"
                  style={{
                    height: `${uvHeight}%`,
                    minHeight: d.uniqueVisitors > 0 ? "4px" : "2px",
                    opacity: d.uniqueVisitors > 0 ? 1 : 0.25,
                  }}
                />
                {/* Page views bar (Gold) */}
                <div
                  className="w-1/2 max-w-[18px] rounded-t bg-[#B88445] transition-all group-hover:bg-[#D4A05C]"
                  style={{
                    height: `${pvHeight}%`,
                    minHeight: d.pageViews > 0 ? "4px" : "2px",
                    opacity: d.pageViews > 0 ? 1 : 0.25,
                  }}
                />
              </div>

              {/* Hover Tooltip */}
              <div className="pointer-events-none absolute bottom-full mb-2 z-20 hidden group-hover:flex">
                <div className="rounded-xl bg-[#1C140F] p-2.5 text-center shadow-xl min-w-[110px]">
                  <p className="font-mono text-[0.55rem] font-bold text-[#B88445] border-b border-white/10 pb-1 mb-1.5">
                    {formatDayLabel(d.date)}
                  </p>
                  <div className="space-y-1 text-left font-mono text-[0.55rem] text-white">
                    <p className="flex justify-between gap-3">
                      <span className="text-white/60">Visitors:</span>
                      <span className="font-bold text-[#0EA5E9]">{d.uniqueVisitors}</span>
                    </p>
                    <p className="flex justify-between gap-3">
                      <span className="text-white/60">Page Views:</span>
                      <span className="font-bold text-[#B88445]">{d.pageViews}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Day label */}
              <p className="mt-2 font-mono text-[0.5rem] text-[#3a2a22]/50 truncate max-w-full">
                {formatDayLabel(d.date)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center font-mono text-[0.5rem] text-[#3a2a22]/40 pt-1">
        <span>Storefront 7-day timeline</span>
        <span>
          7-Day Views: {data.reduce((s, d) => s + d.pageViews, 0)} • 7-Day Visitors: {data.reduce((s, d) => s + d.uniqueVisitors, 0)}
        </span>
      </div>
    </div>
  );
}

/* ─── Existing Commerce Charts ───────────────────────────────────────── */
function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  const maxR = Math.max(...data.map((d) => d.revenue), 1);
  if (data.length === 0) return <EmptyChart />;

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-28">
        {data.map((d) => {
          const h = Math.max(4, (d.revenue / maxR) * 100);
          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
            >
              <div
                className="w-full rounded-t bg-[#B88445]/60 hover:bg-[#B88445] transition-colors"
                style={{ height: `${h}%` }}
              />
              <div className="pointer-events-none absolute bottom-full mb-1 z-10 hidden group-hover:flex">
                <div className="rounded-lg bg-[#1C140F] px-2 py-1 shadow-lg">
                  <p className="font-mono text-[0.45rem] text-[#B88445]">{d.date}</p>
                  <p className="font-mono text-[0.5rem] font-bold text-white">
                    {formatMoney(Math.round(d.revenue * 100), "INR")}
                  </p>
                  <p className="font-mono text-[0.45rem] text-white/50">{d.orders} orders</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between font-mono text-[0.45rem] text-[#3a2a22]/30">
        <span>{data[0]?.date}</span>
        <span>30-day timeline</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function StatusBreakdown({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <EmptyChart />;

  const colors: Record<string, string> = {
    Delivered: "#10B981",
    Processing: "#F59E0B",
    Shipped: "#6366F1",
    Confirmed: "#0EA5E9",
    Cancelled: "#EF4444",
  };

  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full gap-0.5">
        {Object.entries(data).map(([status, count]) => {
          const pct = (count / total) * 100;
          return (
            <div
              key={status}
              className="h-full transition-all"
              style={{ width: `${pct}%`, background: colors[status] || "#3a2a22" }}
              title={`${status}: ${count} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 font-mono text-[0.55rem]">
        {Object.entries(data).map(([status, count]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: colors[status] || "#3a2a22" }}
            />
            <span className="text-[#3a2a22]/60 truncate">{status}</span>
            <span className="ml-auto font-bold text-[#2D241E]">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopProductsChart({ data }: { data: TopProduct[] }) {
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  if (data.length === 0) return <EmptyChart />;

  return (
    <div className="space-y-2.5">
      {data.slice(0, 5).map((p, i) => {
        const pct = (p.revenue / maxRev) * 100;
        return (
          <div key={p.name} className="flex items-center gap-3">
            <span className="w-4 shrink-0 font-mono text-[0.5rem] text-[#3a2a22]/30 text-right">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="truncate text-[0.75rem] font-medium text-[#2D241E]">
                  {p.name}
                </p>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="font-mono text-[0.5rem] text-[#3a2a22]/40">
                    {p.units} units
                  </span>
                  <span className="font-mono text-[0.6rem] font-bold text-[#2D241E]">
                    {formatMoney(Math.round(p.revenue * 100), "INR")}
                  </span>
                </div>
              </div>
              <div className="h-1 w-full rounded-full bg-[#3a2a22]/06">
                <div
                  className="h-full rounded-full bg-[#B88445]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CustomerGrowthChart({ data }: { data: CustomerGrowthPoint[] }) {
  const maxC = Math.max(...data.map((d) => d.customers), 1);
  if (data.length === 0) return <EmptyChart />;

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-28">
        {data.map((d) => {
          const h = Math.max(4, (d.customers / maxC) * 100);
          return (
            <div
              key={d.month}
              className="group relative flex flex-1 flex-col items-center justify-end"
            >
              <div
                className="w-full rounded-t bg-[#0EA5E9]/60 hover:bg-[#0EA5E9] transition-colors"
                style={{ height: `${h}%` }}
              />
              <div className="pointer-events-none absolute bottom-full mb-1 z-10 hidden group-hover:flex">
                <div className="rounded-lg bg-[#1C140F] px-2 py-1 shadow-lg">
                  <p className="font-mono text-[0.45rem] text-[#0EA5E9]">
                    {d.month}
                  </p>
                  <p className="font-mono text-[0.5rem] font-bold text-white">
                    {d.customers} new
                  </p>
                </div>
              </div>
              <p className="mt-1 font-mono text-[0.38rem] text-[#3a2a22]/30 rotate-45 origin-left">
                {d.month}
              </p>
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
      <p className="text-[0.8125rem] text-[#3a2a22]/30">No data available yet</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-6 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.07)]"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-display text-[1rem] leading-tight text-[#2D241E]">
            {title}
          </p>
          <p className="mt-0.5 font-mono text-[0.48rem] text-[#3a2a22]/35">
            {subtitle}
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-[#B88445]/40" />
      </div>
      {children}
    </motion.div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.07)] transition-all hover:-translate-y-0.5"
    >
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all group-hover:top-0 group-hover:bottom-0"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${accent}18` }}
        >
          <div style={{ color: accent }}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <p className="font-display text-[1.45rem] leading-none text-[#2D241E] tabular-nums">
          {value}
        </p>
        {sub && <p className="mt-0.5 text-[0.65rem] text-[#3a2a22]/40">{sub}</p>}
      </div>
      <p className="mt-2 font-mono text-[0.5rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/40">
        {label}
      </p>
    </motion.div>
  );
}
