import { createFileRoute } from "@tanstack/react-router";
import { Package, ShoppingBag, Users, Wallet } from "lucide-react";

import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatMoney } from "@/lib/format";
import { useAdminStats } from "@/features/admin/api";
import { useUpdateOrderStatus, documentUrl } from "@/features/orders/api";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardRoute,
});

const ADMIN_STATUSES = [
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function AdminDashboardRoute() {
  const { data: stats, isLoading, isError, error } = useAdminStats();
  const updateStatus = useUpdateOrderStatus();

  const onStatusChange = (orderId: string, status: string) => {
    updateStatus.mutate(
      { orderId, status },
      {
        onSuccess: () => toast.success(`Order updated to ${status}`),
        onError: (e: any) =>
          toast.error(e?.message ?? "Could not update status (invalid transition)"),
      },
    );
  };

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
                      <th className="px-4 py-3 text-left">Ship To</th>
                      <th className="px-4 py-3 text-left">Payment</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Docs</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((o) => {
                      const s = o.shippingInfo ?? {};
                      const line = [s.houseNo, s.buildingName, s.street, s.landmark, s.address]
                        .filter(Boolean)
                        .join(", ");
                      const phone = s.phone ?? (s.phoneNo ? String(s.phoneNo) : "");
                      const pin = s.pincode ?? (s.pinCode ? String(s.pinCode) : "");
                      return (
                      <tr key={o._id} className="border-t border-border/30 align-top">
                        <td className="px-4 py-3 font-mono text-[11px]">{o._id.slice(-8)}</td>
                        <td className="px-4 py-3">
                          {o.user?.name ?? <span className="text-muted-foreground">unknown</span>}
                          {o.user?.email && (
                            <span className="block text-[11px] text-muted-foreground">
                              {o.user.email}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[260px]">
                          {s.fullName || line ? (
                            <>
                              {s.fullName && (
                                <span className="block font-medium">{s.fullName}</span>
                              )}
                              {phone && (
                                <span className="block text-[11px] text-muted-foreground">
                                  {phone}
                                </span>
                              )}
                              {line && (
                                <span className="block text-[11px] text-muted-foreground">
                                  {line}
                                </span>
                              )}
                              <span className="block text-[11px] text-muted-foreground">
                                {[s.city, s.state, pin].filter(Boolean).join(", ")}
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                            {o.paymentInfo?.status ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {o.orderStatus === "cancelled" || o.orderStatus === "refunded" ? (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] uppercase tracking-wider text-red-600">
                              {o.orderStatus}
                            </span>
                          ) : (
                            <select
                              defaultValue={o.orderStatus}
                              onChange={(e) => onStatusChange(o._id, e.target.value)}
                              disabled={updateStatus.isPending}
                              className="rounded-lg border border-border/60 bg-background px-2 py-1 text-[11px] uppercase tracking-wider"
                            >
                              <option value={o.orderStatus} disabled>
                                {o.orderStatus}
                              </option>
                              {ADMIN_STATUSES.filter((st) => st !== o.orderStatus).map((st) => (
                                <option key={st} value={st}>
                                  {st.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-[11px]">
                            {documentUrl(o.invoiceUrl) ? (
                              <a href={documentUrl(o.invoiceUrl)} target="_blank" rel="noreferrer" className="text-orange-glow hover:underline">
                                Invoice
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            {documentUrl(o.receiptUrl) && (
                              <a href={documentUrl(o.receiptUrl)} target="_blank" rel="noreferrer" className="text-orange-glow hover:underline">
                                Receipt
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatMoney(Math.round(o.totalPrice * 100), "INR")}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-[11px]">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                      </tr>
                      );
                    })}
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
