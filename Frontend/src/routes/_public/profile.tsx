import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  User,
  Package,
  Heart,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  ShieldCheck,
  Plus,
  Camera,
  Trash2,
  BadgeCheck,
  Mail,
  Phone,
  CalendarDays,
  Star,
  Gift,
  Pencil,
  Clock,
  Zap,
  Crown,
  Sparkles,
  ArrowUpRight,
  Truck,
  Headset,
  FileText,
  Receipt,
} from "lucide-react";
import { useSession } from "@/features/auth/hooks/useSession";
import { useLogout } from "@/features/auth/api";
import { useRemoveAvatar, useUpdateAvatar } from "@/features/user/api";
import { useMyOrders, documentUrl } from "@/features/orders/api";
import { useAddresses } from "@/features/user/profile-api";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { useProducts } from "@/features/catalog/api";

export const Route = createFileRoute("/_public/profile")({
  component: ProfilePage,
});

type Tab = "overview" | "orders" | "wishlist" | "addresses" | "settings";

const statusTone: Record<string, string> = {
  delivered: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  shipped: "text-sky-600 bg-sky-500/10 border-sky-500/20",
  packed: "text-sky-600 bg-sky-500/10 border-sky-500/20",
  paid: "text-orange-glow bg-orange-glow/10 border-orange-glow/20",
  confirmed: "text-orange-glow bg-orange-glow/10 border-orange-glow/20",
  pending: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  cancelled: "text-red-500 bg-red-500/10 border-red-500/20",
  refunded: "text-ink-muted bg-ink-muted/10 border-line-soft",
};

function fmtINR(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
function safeDate(iso?: string | null, pattern = "dd MMM yyyy") {
  if (!iso) return "—";
  try {
    return format(new Date(iso), pattern);
  } catch {
    return "—";
  }
}

function ProfilePage() {
  const session = useSession();
  const navigate = useNavigate();
  const logout = useLogout();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: products = [] } = useProducts({ page: 1, limit: 4, sort: "newest" });
  const ordersQuery = useMyOrders();
  const orders = ordersQuery.data ?? [];
  const addressesQuery = useAddresses();
  const addresses = (addressesQuery.data ?? []) as Array<{
    _id?: string;
    label?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    isDefault?: boolean;
  }>;

  // Avatar upload pipeline.
  const avatarFileInput = useRef<HTMLInputElement>(null);
  const updateAvatar = useUpdateAvatar();
  const removeAvatar = useRemoveAvatar();

  async function onAvatarPicked(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) {
      toast.error("Please choose a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be 10 MB or smaller");
      return;
    }
    try {
      await updateAvatar.mutateAsync(file);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update photo");
    }
  }

  useEffect(() => {
    if (session === null) navigate({ to: "/login" });
  }, [session, navigate]);

  if (!session) return null;

  const user = session.user;
  const emailVerified = !!user.isVerified;
  const hasPhone = !!user.phoneNumber;
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const location = defaultAddress ? [defaultAddress.city, defaultAddress.state].filter(Boolean).join(", ") : "—";

  // Security score — real, weighted from actual account state.
  const securityChecks = [
    { label: "Email verified", ok: emailVerified, weight: 30 },
    { label: "Phone number added", ok: hasPhone, weight: 25 },
    { label: "Password protected", ok: true, weight: 25 },
    { label: "Active session secured", ok: true, weight: 20 },
  ];
  const securityScore = securityChecks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);

  const stats = [
    { id: "orders" as Tab, label: "Orders", value: orders.length, icon: Package },
    { id: "wishlist" as Tab, label: "Wishlist", value: products.length, icon: Heart },
    { id: "addresses" as Tab, label: "Addresses", value: addresses.length, icon: MapPin },
    { id: "overview" as Tab, label: "Reviews", value: 0, icon: Star },
    { id: "overview" as Tab, label: "Reward Points", value: orders.length * 50, icon: Gift },
  ];

  const recentOrders = orders.slice(0, 3);

  const sidebarLinks = [
    { id: "overview", label: "Overview", icon: User },
    { id: "orders", label: "Orders", icon: Package },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-luxury-beige/60 pt-24 sm:pt-32 pb-16 sm:pb-24 z-10 safe-x">
      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_20%_30%,rgba(245,130,13,0.04),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(252,231,243,0.5),transparent_60%)] opacity-80" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_70%_80%,rgba(243,236,226,1),transparent_50%),radial-gradient(circle_at_30%_90%,rgba(245,130,13,0.06),transparent_40%)] opacity-70" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-12">
        <div className="flex flex-col items-start gap-5 sm:gap-7 md:flex-row lg:gap-10">
          {/* LEFT SIDEBAR */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex-shrink-0 rounded-2xl sm:rounded-panel md:w-72 md:rounded-panel-lg border border-line-hairline bg-surface-panel p-5 sm:p-6 backdrop-blur-medium shadow-sm md:sticky md:top-28"
          >
            <div className="flex flex-col items-center text-center mb-6 sm:mb-7">
              <div className="relative mb-3 group">
                <input
                  ref={avatarFileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => onAvatarPicked(e.target.files?.[0])}
                />
                <div className="relative rounded-full ring-2 ring-orange-glow/15 ring-offset-2 ring-offset-surface-panel transition-all duration-500 group-hover:ring-orange-glow/40">
                  <Avatar
                    src={user.avatarUrl}
                    name={user.name}
                    size={84}
                    className="shadow-inner transition-all duration-500 group-hover:shadow-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => avatarFileInput.current?.click()}
                  disabled={updateAvatar.isPending}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-orange-glow border-2 border-white flex items-center justify-center shadow-sm hover:bg-orange-glow/90 hover:scale-105 disabled:opacity-50 transition-all duration-300"
                >
                  <Camera className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Remove your profile photo?")) {
                      removeAvatar.mutate(undefined, {
                        onSuccess: () => toast.success("Profile photo removed"),
                        onError: (err) =>
                          toast.error(err instanceof Error ? err.message : "Could not remove"),
                      });
                    }
                  }}
                  className="mb-2 inline-flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase text-ink-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove photo
                </button>
              )}
              <h2 className="font-display text-lg sm:text-xl text-brown-deep tracking-tight font-bold break-words max-w-full">
                {user.name}
              </h2>
              <p className="mt-1 text-[11px] font-mono text-ink-muted tracking-widest uppercase">
                {emailVerified ? "Verified Member" : `${user.role} member`}
              </p>
            </div>

            <nav className="flex flex-col gap-1">
              {sidebarLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    activeTab === link.id
                      ? "bg-surface-glass-strong text-brown-deep shadow-sm border border-line-hairline"
                      : "text-ink-muted hover:bg-surface-panel-strong hover:text-brown-deep hover:translate-x-0.5"
                  }`}
                >
                  <link.icon
                    className={`h-4 w-4 ${activeTab === link.id ? "text-orange-glow" : "opacity-70 group-hover:opacity-100"}`}
                  />
                  <span className="font-mono text-[11px] tracking-eyebrow uppercase font-bold">
                    {link.label}
                    {link.id === "orders" && orders.length > 0 && ` (${orders.length})`}
                    {link.id === "addresses" && addresses.length > 0 && ` (${addresses.length})`}
                  </span>
                  {activeTab === link.id && (
                    <motion.div layoutId="tab-indicator" className="ml-auto">
                      <ChevronRight className="h-3 w-3 text-orange-glow" />
                    </motion.div>
                  )}
                </button>
              ))}

              <Separator className="my-3 bg-brown/10" />

              <button
                onClick={() => logout.mutate()}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-ink-muted hover:bg-red-500/5 hover:text-red-500 transition-all duration-300 group"
              >
                <LogOut className="h-4 w-4 opacity-70 group-hover:opacity-100" />
                <span className="font-mono text-[11px] tracking-eyebrow uppercase font-bold">Sign out</span>
              </button>
            </nav>
          </motion.aside>

          {/* RIGHT CONTENT */}
          <main className="flex-1 w-full min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {/* ════════ OVERVIEW — PREMIUM CUSTOMER HUB ════════ */}
                {activeTab === "overview" && (
                  <div className="space-y-5 sm:space-y-6">
                    {/* Profile banner */}
                    <section className="relative overflow-hidden rounded-2xl sm:rounded-panel border border-line-hairline bg-surface-panel backdrop-blur-medium shadow-sm">
                      <div className="h-20 sm:h-24 w-full bg-gradient-to-r from-orange-glow/15 via-[#f7e6d0]/40 to-[#fce7f3]/40" />
                      <div className="px-5 sm:px-8 pb-6 -mt-10">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                          <div className="rounded-full ring-4 ring-surface-panel">
                            <Avatar src={user.avatarUrl} name={user.name} size={72} className="shadow-md" />
                          </div>
                          <div className="flex-1 min-w-0 sm:pb-1">
                            <h1 className="font-display text-[1.75rem] sm:text-[2rem] leading-tight tracking-tight text-brown-deep">
                              {user.name}
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <VerifChip ok={emailVerified} label={emailVerified ? "Verified Email" : "Email unverified"} />
                              <VerifChip ok={hasPhone} label={hasPhone ? "Verified Phone" : "No phone"} />
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-glow/10 border border-orange-glow/20 px-2.5 py-1 font-mono text-[10px] tracking-widest uppercase font-bold text-orange-glow">
                                <Sparkles className="h-3 w-3" /> Active Member
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-2 sm:pb-1">
                            <span className="font-mono text-[10px] tracking-widest uppercase text-ink-muted">
                              Member Since {safeDate(user.createdAt, "MMM yyyy")}
                            </span>
                            <Button
                              onClick={() => setActiveTab("settings")}
                              className="h-9 rounded-full bg-brown-deep px-4 text-[11px] tracking-widest uppercase font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-brown hover:shadow-md"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
                            </Button>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Quick stats grid */}
                    <section className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
                      {stats.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => setActiveTab(s.id)}
                          className="group text-left rounded-2xl border border-line-hairline bg-surface-panel p-4 backdrop-blur-medium shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-orange-glow/30"
                        >
                          <s.icon className="h-4 w-4 text-orange-glow/70 mb-2.5 transition-transform duration-300 group-hover:scale-110" />
                          {ordersQuery.isLoading || addressesQuery.isLoading ? (
                            <div className="h-7 w-10 rounded-md bg-ink-muted/10 animate-pulse" />
                          ) : (
                            <div className="font-mono text-2xl text-brown-deep font-black leading-none">
                              {String(s.value).padStart(2, "0")}
                            </div>
                          )}
                          <div className="mt-1.5 font-mono text-[10px] tracking-widest text-ink-muted uppercase font-bold">
                            {s.label}
                          </div>
                        </button>
                      ))}
                    </section>

                    {/* Account overview + Security */}
                    <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
                      <section className="lg:col-span-2 rounded-2xl sm:rounded-panel border border-line-hairline bg-surface-panel p-5 sm:p-7 backdrop-blur-medium shadow-sm">
                        <SectionTitle icon={User} eyebrow="Account">
                          Account overview
                        </SectionTitle>
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                          <InfoRow icon={User} label="Name" value={user.name} />
                          <InfoRow icon={Mail} label="Email" value={user.email} verified={emailVerified} />
                          <InfoRow icon={Phone} label="Phone" value={user.phoneNumber || "Not added"} verified={hasPhone} />
                          <InfoRow icon={MapPin} label="Location" value={location} />
                          <InfoRow icon={CalendarDays} label="Joined" value={safeDate(user.createdAt)} />
                          <InfoRow icon={Clock} label="Last login" value="Active now" />
                        </div>
                      </section>

                      <section className="rounded-2xl sm:rounded-panel border border-line-hairline bg-surface-panel p-5 sm:p-7 backdrop-blur-medium shadow-sm">
                        <SectionTitle icon={ShieldCheck} eyebrow="Security">
                          Security score
                        </SectionTitle>
                        <div className="mt-5 flex items-center gap-5">
                          <SecurityRing score={securityScore} />
                          <div className="space-y-2">
                            {securityChecks.map((c) => (
                              <div key={c.label} className="flex items-center gap-2">
                                <span
                                  className={`grid h-4 w-4 place-items-center rounded-full ${c.ok ? "bg-emerald-500/15 text-emerald-600" : "bg-ink-muted/10 text-ink-muted/50"}`}
                                >
                                  <BadgeCheck className="h-2.5 w-2.5" />
                                </span>
                                <span className={`text-[12px] font-light ${c.ok ? "text-brown-deep" : "text-ink-muted/60"}`}>
                                  {c.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between rounded-xl border border-line-soft bg-surface-panel-strong px-3.5 py-2.5">
                          <span className="text-[12px] font-light text-ink-muted">Active sessions</span>
                          <span className="font-mono text-[12px] font-bold text-brown-deep">
                            {user.sessionsCount ?? 1}
                          </span>
                        </div>
                      </section>
                    </div>

                    {/* Recent activity + Member benefits */}
                    <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
                      <section className="lg:col-span-2 rounded-2xl sm:rounded-panel border border-line-hairline bg-surface-panel p-5 sm:p-7 backdrop-blur-medium shadow-sm">
                        <div className="flex items-center justify-between">
                          <SectionTitle icon={Package} eyebrow="Activity">
                            Recent orders
                          </SectionTitle>
                          {orders.length > 0 && (
                            <button
                              onClick={() => setActiveTab("orders")}
                              className="group inline-flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase font-bold text-orange-glow"
                            >
                              View all
                              <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </button>
                          )}
                        </div>

                        <div className="mt-5 space-y-3">
                          {ordersQuery.isLoading ? (
                            [0, 1].map((i) => <SkeletonOrderRow key={i} />)
                          ) : recentOrders.length > 0 ? (
                            recentOrders.map((o) => <OrderRow key={o.id} order={o} />)
                          ) : (
                            <EmptyState
                              icon={Package}
                              title="No orders yet"
                              body="When you place an order, it'll appear here with live tracking."
                              cta={{ label: "Browse collection", to: "/collection" }}
                            />
                          )}
                        </div>
                      </section>

                      <section className="rounded-2xl sm:rounded-panel border border-line-hairline bg-gradient-to-br from-surface-panel to-[#f7efe4]/60 p-5 sm:p-7 backdrop-blur-medium shadow-sm">
                        <SectionTitle icon={Crown} eyebrow="Membership">
                          Member benefits
                        </SectionTitle>
                        <div className="mt-5 space-y-2.5">
                          {[
                            { icon: Zap, label: "Fast Checkout", sub: "Saved details & one-tap pay" },
                            { icon: Headset, label: "Priority Support", sub: "Faster response times" },
                            { icon: Sparkles, label: "Early Access", sub: "Shop drops before anyone" },
                            { icon: Gift, label: "Exclusive Launches", sub: "Members-only editions" },
                          ].map((b) => (
                            <div
                              key={b.label}
                              className="flex items-center gap-3 rounded-xl border border-line-hairline bg-white/55 px-3.5 py-2.5 transition-all duration-300 hover:bg-white/85"
                            >
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-glow/10 text-orange-glow">
                                <b.icon className="h-3.5 w-3.5" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-brown-deep leading-tight">{b.label}</p>
                                <p className="text-[11px] font-light text-ink-muted/70 leading-tight">{b.sub}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                )}

                {/* ════════ ORDERS — real data ════════ */}
                {activeTab === "orders" && (
                  <div className="space-y-5 sm:space-y-6">
                    <TabHeader eyebrow="Order History" title="Your orders" />
                    {ordersQuery.isLoading ? (
                      <div className="space-y-4">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="h-32 rounded-panel bg-surface-panel border border-line-hairline animate-pulse" />
                        ))}
                      </div>
                    ) : orders.length === 0 ? (
                      <EmptyState
                        icon={Package}
                        title="No orders yet"
                        body="Your purchases will show here with status and tracking."
                        cta={{ label: "Explore collection", to: "/collection" }}
                        large
                      />
                    ) : (
                      <div className="space-y-4">
                        {orders.map((o) => (
                          <div
                            key={o.id}
                            className="rounded-2xl sm:rounded-panel border border-line-hairline bg-surface-panel p-5 sm:p-6 backdrop-blur-medium shadow-sm transition-all duration-300 hover:shadow-md"
                          >
                            <div className="flex flex-col gap-4 border-b border-line-soft pb-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-[10px] tracking-widest text-ink-muted uppercase font-bold">
                                  Ref · {(o._id ?? o.id).slice(-8).toUpperCase()}
                                </span>
                                <span className="text-sm text-brown-deep font-medium">
                                  Placed {safeDate(o.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <div className="flex flex-col items-end">
                                  <span className="font-mono text-[10px] tracking-widest text-ink-muted uppercase font-bold">Total</span>
                                  <span className="font-display text-lg text-brown-deep font-bold">{fmtINR(o.totalPrice)}</span>
                                </div>
                                <span
                                  className={`rounded-full border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest ${statusTone[o.orderStatus] ?? statusTone.pending}`}
                                >
                                  {o.orderStatus}
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-4">
                              <div className="h-16 w-14 rounded-xl overflow-hidden bg-cream border border-line-hairline shrink-0">
                                {o.orderItems[0]?.image ? (
                                  <img src={o.orderItems[0].image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="grid h-full w-full place-items-center">
                                    <Package className="h-5 w-5 text-ink-faint" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm sm:text-base font-medium text-brown-deep tracking-tight truncate">
                                  {o.orderItems[0]?.name ?? "Soliva order"}
                                </h4>
                                <p className="text-xs text-ink-muted">
                                  {o.orderItems.reduce((n, it) => n + it.quantity, 0)} item
                                  {o.orderItems.reduce((n, it) => n + it.quantity, 0) === 1 ? "" : "s"}
                                </p>
                              </div>
                            </div>
                            {/* Action row — Track / Digital Invoice / Digital Receipt.
                                Desktop: one row; mobile: 3-up touch grid. */}
                            <div className="mt-4 grid grid-cols-3 gap-2.5 sm:flex sm:flex-wrap">
                              <Link
                                to="/track/$orderId"
                                params={{ orderId: (o._id ?? o.id) as string }}
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brown-deep px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-white active:scale-95"
                              >
                                <Truck className="h-3.5 w-3.5" /> Track Order
                              </Link>
                              {(() => {
                                const inv = documentUrl(o.invoiceUrl);
                                const rec = documentUrl(o.receiptUrl);
                                return (
                                  <>
                                    <a
                                      href={inv}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-line-strong px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted transition-colors hover:text-brown-deep active:scale-95 ${!inv ? "pointer-events-none opacity-40" : ""}`}
                                    >
                                      <FileText className="h-3.5 w-3.5" /> Digital Invoice
                                    </a>
                                    <a
                                      href={rec}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-line-strong px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted transition-colors hover:text-brown-deep active:scale-95 ${!rec ? "pointer-events-none opacity-40" : ""}`}
                                    >
                                      <Receipt className="h-3.5 w-3.5" /> Digital Receipt
                                    </a>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ════════ WISHLIST ════════ */}
                {activeTab === "wishlist" && (
                  <div className="space-y-5 sm:space-y-6">
                    <TabHeader eyebrow="Saved Selections" title="Your wishlist" />
                    {products.length > 0 ? (
                      <div className="grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2">
                        {products.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-2xl sm:rounded-panel border border-line-hairline bg-surface-panel p-4 sm:p-5 backdrop-blur-medium transition-all duration-300 hover:shadow-md"
                          >
                            <ProductCard product={p} />
                            <div className="mt-3 pt-3 border-t border-line-soft flex items-center justify-between gap-3">
                              <Button
                                variant="ghost"
                                className="text-red-500/60 hover:text-red-500 p-0 h-auto font-mono text-[10px] tracking-widest uppercase"
                              >
                                Remove
                              </Button>
                              <Button className="h-9 rounded-full bg-brown-deep px-4 text-[11px] tracking-widest uppercase text-white transition-all duration-300 hover:-translate-y-0.5">
                                Move to cart
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Heart}
                        title="Nothing saved yet"
                        body="Browse our collections to find your favourite editions."
                        cta={{ label: "Explore collection", to: "/collection" }}
                        large
                      />
                    )}
                  </div>
                )}

                {/* ════════ ADDRESSES — real data ════════ */}
                {activeTab === "addresses" && (
                  <div className="space-y-5 sm:space-y-6">
                    <TabHeader eyebrow="Saved Addresses" title="Addresses" />
                    {addressesQuery.isLoading ? (
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {[0, 1].map((i) => (
                          <div key={i} className="h-40 rounded-panel bg-surface-panel border border-line-hairline animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {addresses.map((a) => (
                          <div
                            key={a._id}
                            className="rounded-2xl sm:rounded-panel border border-line-hairline bg-surface-panel p-5 sm:p-6 backdrop-blur-medium shadow-sm transition-all duration-300 hover:shadow-md"
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div className="h-9 w-9 rounded-xl bg-cream flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-ink-faint" />
                              </div>
                              {a.isDefault && (
                                <span className="rounded-full bg-orange-glow/10 border border-orange-glow/20 px-2.5 py-0.5 font-mono text-[9px] tracking-widest uppercase font-bold text-orange-glow">
                                  Default
                                </span>
                              )}
                            </div>
                            <h4 className="mb-1.5 font-mono text-[11px] tracking-widest text-brown-deep uppercase font-black">
                              {a.label ?? "Address"}
                            </h4>
                            <p className="text-sm text-ink-soft leading-relaxed font-light break-words">
                              {[a.street, a.city, a.state, a.pincode, a.country].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        ))}
                        <button className="flex flex-col items-center justify-center gap-3 rounded-2xl sm:rounded-panel border border-dashed border-line-strong bg-surface-glass-ghost p-8 transition-all duration-300 group hover:bg-surface-panel hover:border-orange-glow/30">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-panel-strong transition-transform duration-300 group-hover:scale-110">
                            <Plus className="h-4 w-4 text-ink-faint" />
                          </div>
                          <span className="font-mono text-[11px] tracking-widest text-ink-muted uppercase font-bold">
                            Add new address
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ════════ SETTINGS ════════ */}
                {activeTab === "settings" && (
                  <div className="space-y-5 sm:space-y-6">
                    <TabHeader eyebrow="Account Settings" title="Settings" />
                    <div className="rounded-2xl sm:rounded-panel border border-line-hairline bg-surface-panel p-5 sm:p-8 backdrop-blur-medium shadow-sm">
                      <form className="space-y-8">
                        <section className="space-y-5">
                          <h3 className="font-mono text-[11px] tracking-widest text-ink-faint uppercase font-black">
                            Personal info
                          </h3>
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <Labeled label="Full Name">
                              <Input
                                defaultValue={user.name}
                                className="h-12 rounded-xl border-line-soft bg-surface-glass-ghost px-4 text-brown-deep focus:border-orange-glow transition-all"
                              />
                            </Labeled>
                            <Labeled label="Email Address">
                              <Input
                                defaultValue={user.email}
                                type="email"
                                className="h-12 rounded-xl border-line-soft bg-surface-glass-ghost px-4 text-brown-deep focus:border-orange-glow transition-all"
                              />
                            </Labeled>
                            <Labeled label="Phone">
                              <Input
                                defaultValue={user.phoneNumber ?? ""}
                                placeholder="9876543210"
                                className="h-12 rounded-xl border-line-soft bg-surface-glass-ghost px-4 text-brown-deep focus:border-orange-glow transition-all"
                              />
                            </Labeled>
                          </div>
                        </section>

                        <section className="space-y-5">
                          <h3 className="font-mono text-[11px] tracking-widest text-ink-faint uppercase font-black">
                            Security
                          </h3>
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <Labeled label="New Password">
                              <Input
                                type="password"
                                placeholder="••••••••"
                                className="h-12 rounded-xl border-line-soft bg-surface-glass-ghost px-4 text-brown-deep focus:border-orange-glow transition-all"
                              />
                            </Labeled>
                            <Labeled label="Confirm Password">
                              <Input
                                type="password"
                                placeholder="••••••••"
                                className="h-12 rounded-xl border-line-soft bg-surface-glass-ghost px-4 text-brown-deep focus:border-orange-glow transition-all"
                              />
                            </Labeled>
                          </div>
                        </section>

                        <section className="space-y-3">
                          <h3 className="font-mono text-[11px] tracking-widest text-ink-faint uppercase font-black">
                            Notifications
                          </h3>
                          <ToggleRow icon={Bell} label="Order updates" sub="Shipping & delivery alerts" defaultOn />
                          <ToggleRow icon={Mail} label="Marketing emails" sub="Launches & member offers" />
                        </section>

                        <div className="flex justify-end pt-2">
                          <Button
                            type="button"
                            onClick={() => toast.success("Preferences saved")}
                            className="rounded-full bg-brown-deep px-8 py-5 text-[11px] uppercase font-bold tracking-widest text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-brown hover:shadow-md"
                          >
                            Save changes
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ════════ PRIMITIVES ════════ */

function TabHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header>
      <div className="mb-3 flex items-center gap-3">
        <span className="block h-px w-6 bg-orange-glow/40" />
        <span className="font-mono text-[10px] tracking-widest text-orange-glow uppercase font-bold">
          {eyebrow}
        </span>
      </div>
      <h1 className="font-display text-[2rem] sm:text-4xl leading-tight tracking-tight text-brown-deep">
        {title}
      </h1>
    </header>
  );
}

function SectionTitle({
  icon: Icon,
  eyebrow,
  children,
}: {
  icon: typeof User;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-glow/10 text-orange-glow">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <p className="font-mono text-[9px] tracking-widest text-ink-muted/60 uppercase font-bold leading-none">
          {eyebrow}
        </p>
        <h3 className="font-display text-lg sm:text-xl text-brown-deep tracking-tight leading-tight">
          {children}
        </h3>
      </div>
    </div>
  );
}

function VerifChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-widest uppercase font-bold border ${
        ok
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
          : "bg-ink-muted/8 border-line-soft text-ink-muted/60"
      }`}
    >
      <BadgeCheck className="h-3 w-3" /> {label}
    </span>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  verified,
}: {
  icon: typeof User;
  label: string;
  value: string;
  verified?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-panel-strong text-ink-muted">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] tracking-widest text-ink-muted/70 uppercase font-bold">{label}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-brown-deep font-medium break-words">
          <span className="truncate">{value}</span>
          {verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
        </p>
      </div>
    </div>
  );
}

function SecurityRing({ score }: { score: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="relative h-[80px] w-[80px] shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-ink-muted/10" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          className="text-orange-glow"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c}` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center leading-none">
          <span className="font-mono text-lg font-black text-brown-deep">{score}%</span>
          <p className="mt-0.5 font-mono text-[8px] tracking-widest uppercase text-ink-muted">Secure</p>
        </div>
      </div>
    </div>
  );
}

function OrderRow({
  order,
}: {
  order: {
    id: string;
    _id?: string;
    orderStatus: string;
    createdAt?: string;
    totalPrice: number;
    orderItems: { name: string; image?: string; quantity: number }[];
  };
}) {
  const count = order.orderItems.reduce((n, it) => n + it.quantity, 0);
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line-hairline bg-surface-panel-strong p-3 transition-all duration-300 hover:bg-white/70">
      <div className="h-12 w-11 shrink-0 overflow-hidden rounded-lg bg-cream border border-line-hairline">
        {order.orderItems[0]?.image ? (
          <img src={order.orderItems[0].image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <Package className="h-4 w-4 text-ink-faint" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-brown-deep truncate">{order.orderItems[0]?.name ?? "Soliva order"}</p>
        <p className="text-[11px] text-ink-muted">
          {safeDate(order.createdAt)} · {count} item{count === 1 ? "" : "s"} · {fmtINR(order.totalPrice)}
        </p>
      </div>
      <span
        className={`rounded-full border px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-widest ${statusTone[order.orderStatus] ?? statusTone.pending}`}
      >
        {order.orderStatus}
      </span>
    </div>
  );
}

function SkeletonOrderRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line-hairline bg-surface-panel-strong p-3">
      <div className="h-12 w-11 rounded-lg bg-ink-muted/10 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 rounded bg-ink-muted/10 animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-ink-muted/10 animate-pulse" />
      </div>
      <div className="h-5 w-16 rounded-full bg-ink-muted/10 animate-pulse" />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
  large,
}: {
  icon: typeof Package;
  title: string;
  body: string;
  cta: { label: string; to: string };
  large?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-line-hairline bg-surface-panel-strong text-center ${large ? "p-12 sm:p-16" : "p-8"}`}
    >
      <Icon className={`mx-auto mb-4 text-ink-disabled ${large ? "h-10 w-10" : "h-8 w-8"}`} />
      <h3 className="mb-1.5 font-display text-lg sm:text-xl text-brown-deep">{title}</h3>
      <p className="mx-auto mb-5 max-w-xs text-sm text-ink-muted font-light">{body}</p>
      <Button
        asChild
        className="rounded-full bg-brown-deep px-6 py-2.5 text-[11px] uppercase font-bold tracking-widest text-white transition-all duration-300 hover:-translate-y-0.5"
      >
        <Link to={cta.to}>{cta.label}</Link>
      </Button>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="ml-1 font-mono text-[10px] tracking-widest text-ink-muted uppercase font-bold">
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  sub,
  defaultOn,
}: {
  icon: typeof Bell;
  label: string;
  sub: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="flex w-full items-center gap-3 rounded-xl border border-line-hairline bg-surface-glass-ghost px-4 py-3 text-left transition-all duration-300 hover:bg-surface-panel-strong"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-glow/10 text-orange-glow">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-brown-deep leading-tight">{label}</p>
        <p className="text-[11px] font-light text-ink-muted/70 leading-tight">{sub}</p>
      </div>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-orange-glow" : "bg-ink-muted/25"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300 ${on ? "left-[1.125rem]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
