import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Wallet, Mail, Calendar, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { useAdminCustomer } from "@/features/admin/api";
import type { AdminOrder } from "@/features/admin/api";

export const Route = createFileRoute("/admin/customers/$customerId")({
  component: CustomerDetailRoute,
});

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

function CustomerDetailRoute() {
  const { customerId } = Route.useParams();
  const { data, isLoading } = useAdminCustomer(customerId);

  const customer = data?.customer;
  const orders   = data?.orders ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-[1rem] font-medium text-[#3a2a22]/50">Customer not found</p>
        <Link to="/admin/customers" className="font-mono text-[0.5rem] tracking-[0.22em] uppercase font-bold text-[#B88445] hover:underline">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/admin/customers"
          className="mb-3 flex items-center gap-1.5 font-mono text-[0.5rem] tracking-[0.22em] uppercase font-bold text-[#3a2a22]/40 hover:text-[#B88445] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Customers
        </Link>
        <div className="flex items-center gap-4">
          {customer.avatarUrl ? (
            <img src={customer.avatarUrl} alt={customer.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B88445]/15">
              <span className="font-display text-[1.25rem] text-[#B88445]">{customer.name.charAt(0)}</span>
            </div>
          )}
          <div>
            <h1 className="font-display text-[1.5rem] leading-tight tracking-tight text-[#2D241E]">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[0.58rem] text-[#3a2a22]/40">{customer.email}</span>
              {customer.isVerified && (
                <span className="flex items-center gap-0.5 font-mono text-[0.45rem] text-emerald-600">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Total Orders"    value={String(customer.totalOrders)} accent="#6366F1" />
        <StatCard icon={Wallet}      label="Total Spend"     value={formatMoney(Math.round((customer.totalSpend ?? 0) * 100), "INR")} accent="#B88445" />
        <StatCard icon={Calendar}    label="Last Order"      value={customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"} accent="#10B981" />
        <StatCard icon={Calendar}    label="Member Since"    value={customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"} accent="#0EA5E9" />
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile */}
        <Card icon={Mail} title="Contact Details">
          <InfoRow label="Name">{customer.name}</InfoRow>
          <InfoRow label="Email">{customer.email}</InfoRow>
          <InfoRow label="Phone">{customer.phoneNumber ?? "—"}</InfoRow>
          <InfoRow label="Verified">{customer.isVerified ? "Yes" : "No"}</InfoRow>
          <InfoRow label="Joined">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN") : "—"}</InfoRow>
        </Card>

        {/* Order history — spans 2 cols */}
        <div className="lg:col-span-2">
          <Card icon={ShoppingBag} title={`Order History (${orders.length})`}>
            {orders.length === 0 ? (
              <p className="text-center text-[0.8125rem] text-[#3a2a22]/35 py-6">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {orders.map((o, i) => <OrderRow key={o._id} order={o} index={i} />)}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, index }: { order: AdminOrder; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="flex items-center gap-3 rounded-xl border border-[#3a2a22]/06 bg-[#F7F3EC]/60 px-3 py-2.5 transition-colors hover:bg-[#B88445]/[0.03]"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            to="/admin/orders/$orderId"
            params={{ orderId: order._id }}
            className="font-mono text-[0.6875rem] font-bold text-[#B88445] hover:underline"
          >
            #{order._id.slice(-8).toUpperCase()}
          </Link>
          <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[0.42rem] tracking-[0.1em] uppercase font-bold ${STATUS_BADGE[order.orderStatus] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
            {order.orderStatus.replace(/_/g, " ")}
          </span>
        </div>
        <p className="font-mono text-[0.55rem] text-[#3a2a22]/35 mt-0.5">
          {order.orderItems.map(i => i.name).join(", ").slice(0, 60)}
          {order.orderItems.reduce((s, i) => s + i.name.length, 0) > 60 ? "…" : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-[0.8125rem] text-[#2D241E]">{formatMoney(Math.round(order.totalPrice * 100), "INR")}</p>
        <p className="font-mono text-[0.5rem] text-[#3a2a22]/35">
          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
        </p>
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-4 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.07)]"
    >
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: accent }} />
      <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${accent}18` }}>
        <div style={{ color: accent }}><Icon className="h-3.5 w-3.5" /></div>
      </div>
      <p className="mt-2 font-display text-[1.35rem] leading-none text-[#2D241E] tabular-nums">{value}</p>
      <p className="mt-1.5 font-mono text-[0.45rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/40">{label}</p>
    </motion.div>
  );
}

function Card({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#B88445]/10">
          <Icon className="h-3.5 w-3.5 text-[#B88445]" />
        </div>
        <p className="font-mono text-[0.5rem] tracking-[0.24em] uppercase font-bold text-[#3a2a22]/45">{title}</p>
      </div>
      {children}
    </motion.div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-[#3a2a22]/04 last:border-0">
      <p className="w-20 shrink-0 font-mono text-[0.48rem] tracking-[0.16em] uppercase font-bold text-[#3a2a22]/30 pt-0.5">{label}</p>
      <p className="flex-1 text-[0.8125rem] text-[#2D241E]">{children}</p>
    </div>
  );
}

