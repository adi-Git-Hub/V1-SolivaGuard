import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  X, ShoppingBag, Wallet, TrendingUp, Calendar, Mail, Phone, User as UserIcon,
  CheckCircle2, ShieldOff, ShieldCheck, Download, MapPin, Clock, ExternalLink, ArrowRight,
  Globe, Wifi, Monitor, Navigation,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  useAdminCustomer, useUpdateCustomerStatus, exportCustomersCsv,
  type AdminAddress, type AdminOrder, type AdminCustomer,
} from "@/features/admin/api";

const ORDER_STATUS_BADGE: Record<string, string> = {
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

const fmtDate = (d?: string | null, opts?: Intl.DateTimeFormatOptions) =>
  d ? new Date(d).toLocaleDateString("en-IN", opts ?? { day: "2-digit", month: "short", year: "numeric" }) : "—";

interface Props {
  customerId: string | null;
  open: boolean;
  onClose: () => void;
}

export function CustomerDrawer({ customerId, open, onClose }: Props) {
  const { data, isLoading } = useAdminCustomer(customerId ?? "", open);
  const updateStatus = useUpdateCustomerStatus();
  const [confirm, setConfirm] = useState<null | "block" | "unblock">(null);
  const [exporting, setExporting] = useState(false);

  const customer  = data?.customer;
  const addresses = data?.addresses ?? [];
  const orders    = data?.orders ?? [];
  const isBlocked = customer?.status === "blocked";

  const doStatus = () => {
    if (!customerId) return;
    updateStatus.mutate(
      { id: customerId, status: isBlocked ? "active" : "blocked" },
      { onSettled: () => setConfirm(null) },
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportCustomersCsv(); } finally { setExporting(false); }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-[#2D241E]/40 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-[#F7F3EC] shadow-[-12px_0_48px_-12px_rgba(44,28,18,0.25)]"
            >
              {/* Sticky header */}
              <div className="flex items-start justify-between gap-3 border-b border-[#3a2a22]/08 bg-[#FDFAF6] px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  {isLoading || !customer ? (
                    <Skeleton className="h-11 w-11 rounded-full" />
                  ) : customer.avatarUrl ? (
                    <img src={customer.avatarUrl} alt={customer.name} className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B88445]/15">
                      <span className="font-display text-[1.1rem] text-[#B88445]">{customer?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    {isLoading || !customer ? (
                      <><Skeleton className="h-4 w-32 rounded" /><Skeleton className="mt-1.5 h-2.5 w-40 rounded" /></>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h2 className="truncate font-display text-[1.15rem] leading-tight text-[#2D241E]">{customer.name}</h2>
                          <StatusBadge status={customer.status ?? "active"} />
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="truncate font-mono text-[0.58rem] text-[#3a2a22]/45">{customer.email}</p>
                          {customer.isVerified && (
                            <span className="flex shrink-0 items-center gap-0.5 font-mono text-[0.45rem] text-emerald-600">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button" onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#3a2a22]/40 transition-colors hover:bg-[#3a2a22]/05 hover:text-[#2D241E]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Actions bar */}
              <div className="flex items-center gap-2 border-b border-[#3a2a22]/06 bg-[#FDFAF6]/60 px-5 py-3">
                <button
                  type="button"
                  disabled={isLoading || !customer}
                  onClick={() => setConfirm(isBlocked ? "unblock" : "block")}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-[0.5rem] tracking-[0.16em] uppercase font-bold transition-all disabled:opacity-40 ${
                    isBlocked
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
                >
                  {isBlocked ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                  {isBlocked ? "Unblock" : "Block"}
                </button>
                <button
                  type="button"
                  disabled={exporting}
                  onClick={handleExport}
                  className="flex items-center gap-1.5 rounded-xl border border-[#3a2a22]/12 px-3 py-2 font-mono text-[0.5rem] tracking-[0.16em] uppercase font-bold text-[#3a2a22]/55 transition-all hover:border-[#B88445]/30 hover:text-[#B88445] disabled:opacity-40"
                >
                  <Download className="h-3 w-3" /> {exporting ? "Exporting…" : "Export"}
                </button>
                {customerId && (
                  <Link
                    to="/admin/customers/$customerId" params={{ customerId }}
                    className="ml-auto flex items-center gap-1 font-mono text-[0.5rem] tracking-[0.14em] uppercase font-bold text-[#B88445] hover:underline"
                  >
                    Full Page <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                )}
              </div>

              {/* Scroll body */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {isLoading || !customer ? (
                  <DrawerSkeleton />
                ) : (
                  <div className="space-y-6">
                    {/* Analytics */}
                    <div className="grid grid-cols-2 gap-3">
                      <MiniStat icon={ShoppingBag} label="Total Orders"   value={String(customer.totalOrders)} accent="#6366F1" />
                      <MiniStat icon={Wallet}      label="Lifetime Value" value={formatMoney(Math.round((customer.lifetimeValue ?? 0) * 100), "INR")} accent="#B88445" />
                      <MiniStat icon={TrendingUp}  label="Avg Order"      value={formatMoney(Math.round((customer.avgOrderValue ?? 0) * 100), "INR")} accent="#10B981" />
                      <MiniStat icon={Calendar}    label="Last Purchase"  value={fmtDate(customer.lastOrder, { day: "2-digit", month: "short" })} accent="#0EA5E9" />
                    </div>

                    {/* Customer information */}
                    <Section title="Customer Information">
                      <InfoRow icon={UserIcon} label="Full Name">{customer.name}</InfoRow>
                      <InfoRow icon={Mail}     label="Email">{customer.email}</InfoRow>
                      <InfoRow icon={Phone}    label="Phone">{customer.phoneNumber || "—"}</InfoRow>
                      <InfoRow icon={Calendar} label="Registered">{fmtDate(customer.createdAt)}</InfoRow>
                      <InfoRow icon={Clock}    label="Last Login">{fmtDate(customer.lastLoginAt, { day: "2-digit", month: "short", year: "numeric" })}</InfoRow>
                      <InfoRow icon={ShieldCheck} label="Status">
                        <span className="capitalize">{customer.status ?? "active"}</span>
                      </InfoRow>
                    </Section>

                    {/* Location information */}
                    <LocationSection customer={customer} />

                    {/* Addresses */}
                    <Section title={`Addresses (${addresses.length})`}>
                      {addresses.length === 0 ? (
                        <EmptyInline icon={MapPin} text="No saved addresses" />
                      ) : (
                        <div className="space-y-2.5">
                          {addresses.map((a, i) => <AddressCard key={a._id} address={a} primary={i === 0} />)}
                        </div>
                      )}
                    </Section>

                    {/* Recent orders */}
                    <Section title={`Recent Orders (${orders.length})`}>
                      {orders.length === 0 ? (
                        <EmptyInline icon={ShoppingBag} text="No orders yet" />
                      ) : (
                        <div className="space-y-2">
                          {orders.slice(0, 8).map((o) => <OrderRow key={o._id} order={o} />)}
                          {orders.length > 8 && customerId && (
                            <Link
                              to="/admin/customers/$customerId" params={{ customerId }}
                              className="flex items-center justify-center gap-1 rounded-xl border border-dashed border-[#3a2a22]/12 py-2.5 font-mono text-[0.5rem] tracking-[0.16em] uppercase font-bold text-[#B88445] hover:bg-[#B88445]/04"
                            >
                              View all {orders.length} orders <ArrowRight className="h-2.5 w-2.5" />
                            </Link>
                          )}
                        </div>
                      )}
                    </Section>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "block" ? "Block this customer?" : "Unblock this customer?"}
        description={
          confirm === "block"
            ? "They will be signed out immediately and unable to log in or place orders until unblocked."
            : "They will regain access to their account and be able to log in and place orders again."
        }
        detail={customer ? `${customer.name} · ${customer.email}` : undefined}
        confirmLabel={confirm === "block" ? "Block Customer" : "Unblock Customer"}
        destructive={confirm === "block"}
        isLoading={updateStatus.isPending}
        onConfirm={doStatus}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const blocked = status === "blocked";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 font-mono text-[0.42rem] tracking-[0.12em] uppercase font-bold ${
      blocked ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"
    }`}>
      {status}
    </span>
  );
}

function MiniStat({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-3.5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]">
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: accent }} />
      <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${accent}18`, color: accent }}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="mt-2 font-display text-[1.1rem] leading-none text-[#2D241E] tabular-nums">{value}</p>
      <p className="mt-1.5 font-mono text-[0.42rem] tracking-[0.18em] uppercase font-bold text-[#3a2a22]/40">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 font-mono text-[0.5rem] tracking-[0.24em] uppercase font-bold text-[#3a2a22]/40">{title}</p>
      <div className="rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-4 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.05)]">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#3a2a22]/05 py-2 last:border-0">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#B88445]/10">
        <Icon className="h-3 w-3 text-[#B88445]" />
      </div>
      <p className="w-24 shrink-0 font-mono text-[0.46rem] tracking-[0.14em] uppercase font-bold text-[#3a2a22]/35">{label}</p>
      <p className="flex-1 truncate text-[0.8125rem] text-[#2D241E]">{children}</p>
    </div>
  );
}

function LocationSection({ customer: c }: { customer: AdminCustomer }) {
  const hasLocation =
    c.lastLoginCity || c.areaName || c.lastLoginIP || c.lastLatitude != null;

  const place = [c.lastLoginCity, c.lastLoginState, c.lastLoginCountry].filter(Boolean).join(", ");
  const coords =
    c.lastLatitude != null && c.lastLongitude != null
      ? `${c.lastLatitude.toFixed(5)}, ${c.lastLongitude.toFixed(5)}`
      : null;

  return (
    <Section title="Location Information">
      {!hasLocation ? (
        <EmptyInline icon={MapPin} text="No location captured yet" />
      ) : (
        <>
          {c.areaName && <InfoRow icon={MapPin} label="Area">{c.areaName}</InfoRow>}
          <InfoRow icon={MapPin}     label="City">{c.lastLoginCity || "—"}</InfoRow>
          <InfoRow icon={Navigation} label="State">{c.lastLoginState || "—"}</InfoRow>
          <InfoRow icon={Globe}      label="Country">{c.lastLoginCountry || "—"}</InfoRow>
          <InfoRow icon={Wifi}       label="IP Address">{c.lastLoginIP || "—"}</InfoRow>
          <InfoRow icon={Wifi}       label="ISP">{c.lastLoginISP || "—"}</InfoRow>
          <InfoRow icon={Monitor}    label="Device">{c.deviceInfo || "—"}</InfoRow>
          <InfoRow icon={Monitor}    label="Browser">{[c.browserInfo, c.osInfo].filter(Boolean).join(" · ") || "—"}</InfoRow>
          {coords && <InfoRow icon={Navigation} label="Coordinates">{coords}</InfoRow>}
        </>
      )}
    </Section>
  );
}

function AddressCard({ address, primary }: { address: AdminAddress; primary: boolean }) {
  return (
    <div className="rounded-xl border border-[#3a2a22]/06 bg-[#F7F3EC]/60 px-3.5 py-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="font-mono text-[0.5rem] tracking-[0.14em] uppercase font-bold text-[#2D241E]">{address.fullName}</span>
        <span className="rounded-full bg-[#B88445]/12 px-1.5 py-0.5 font-mono text-[0.4rem] tracking-[0.1em] uppercase font-bold text-[#B88445]">
          {primary ? "Shipping · Default" : address.addressType ?? "Other"}
        </span>
      </div>
      <p className="text-[0.78rem] leading-relaxed text-[#3a2a22]/70">
        {[address.houseNo, address.buildingName, address.street, address.landmark].filter(Boolean).join(", ")}
        {address.landmark ? "" : ""}<br />
        {[address.city, address.state, address.pincode].filter(Boolean).join(", ")}, {address.country ?? "India"}
      </p>
      <p className="mt-1 font-mono text-[0.55rem] text-[#3a2a22]/40">{address.phone}</p>
    </div>
  );
}

function OrderRow({ order }: { order: AdminOrder }) {
  return (
    <Link
      to="/admin/orders/$orderId" params={{ orderId: order._id }}
      className="flex items-center gap-3 rounded-xl border border-[#3a2a22]/06 bg-[#F7F3EC]/50 px-3 py-2.5 transition-colors hover:bg-[#B88445]/[0.04]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.65rem] font-bold text-[#B88445]">#{order._id.slice(-8).toUpperCase()}</span>
          <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[0.4rem] tracking-[0.08em] uppercase font-bold ${ORDER_STATUS_BADGE[order.orderStatus] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
            {order.orderStatus.replace(/_/g, " ")}
          </span>
        </div>
        <p className="mt-0.5 truncate font-mono text-[0.52rem] text-[#3a2a22]/35">
          {order.orderItems.map((i) => i.name).join(", ")}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[0.8125rem] font-semibold text-[#2D241E]">{formatMoney(Math.round(order.totalPrice * 100), "INR")}</p>
        <p className="font-mono text-[0.5rem] text-[#3a2a22]/35">{fmtDate(order.createdAt, { day: "2-digit", month: "short" })}</p>
      </div>
    </Link>
  );
}

function EmptyInline({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3a2a22]/05">
        <Icon className="h-4 w-4 text-[#3a2a22]/25" />
      </div>
      <p className="text-[0.78rem] font-medium text-[#3a2a22]/35">{text}</p>
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[88px] rounded-2xl" />)}
      </div>
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}
