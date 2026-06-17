import { createFileRoute } from "@tanstack/react-router";
import { Package, ShoppingBag, Users, Wallet } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatMoney } from "@/lib/format";
import { useAdminStats } from "@/features/admin/api";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const { data: stats, isLoading, isError, error } = useAdminStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-12 md:py-20 safe-x">
      <header className="mb-10">
        <div className="mb-3 flex items-center gap-3">
          <span className="block h-px w-6 bg-brown/20" />
          <span className="font-mono text-micro-md tracking-editorial text-orange-glow uppercase font-bold">
            Admin
          </span>
        </div>
        <h1
          className="font-display text-brown-deep tracking-tight leading-hero"
          style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)" }}
        >
          Dashboard
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Live counters from <code className="text-xs">/api/v1/admin/dashboard</code>.
        </p>
      </header>

      {isError ? (
        <EmptyState
          title="Could not load dashboard"
          description={error instanceof Error ? error.message : "Unknown error"}
        />
      ) : isLoading || !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Stat icon={Users} label="Total users" value={stats.totalUsers.toString()} />
            <Stat icon={ShoppingBag} label="Total orders" value={stats.totalOrders.toString()} />
            <Stat icon={Package} label="Total products" value={stats.totalProducts.toString()} />
            <Stat
              icon={Wallet}
              label="Revenue (paid)"
              value={formatMoney(Math.round(stats.totalRevenue * 100), "INR")}
            />
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl text-foreground mb-4">Recent orders</h2>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/40">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Order ID</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((o) => (
                      <tr key={o._id} className="border-t border-border/30">
                        <td className="px-4 py-3 font-mono text-[11px]">{o._id.slice(-8)}</td>
                        <td className="px-4 py-3">
                          {o.user?.name ?? <span className="text-muted-foreground">unknown</span>}
                          {o.user?.email && (
                            <span className="block text-[11px] text-muted-foreground">
                              {o.user.email}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-accent/40 px-2 py-0.5 text-[11px] uppercase tracking-wider">
                            {o.orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatMoney(Math.round(o.totalPrice * 100), "INR")}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-[11px]">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-5 sm:p-6">
      <Icon className="h-5 w-5 text-orange-glow/70 mb-3" />
      <div className="font-display text-2xl sm:text-3xl text-foreground">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
