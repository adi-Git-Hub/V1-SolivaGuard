import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  ShoppingBag,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  X,
  Warehouse,
} from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { useSession } from "@/features/auth/hooks/useSession";
import { useLogout } from "@/features/auth/api";

/* ─── Nav item data ───────────────────────────────────────────────── */
type NavItem =
  | { label: string; icon: React.ComponentType<{ className?: string }>; to: string; soon?: false }
  | { label: string; icon: React.ComponentType<{ className?: string }>; to: null; soon: true };

const NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid,  to: "/admin/dashboard"  },
  { label: "Orders",    icon: ShoppingBag, to: "/admin/orders"     },
  { label: "Products",  icon: Package,     to: "/admin/products"   },
  { label: "Inventory", icon: Warehouse,   to: "/admin/inventory"  },
  { label: "Customers", icon: Users,       to: "/admin/customers"  },
  { label: "Payments",  icon: CreditCard,  to: "/admin/payments"   },
  { label: "Analytics", icon: BarChart3,   to: "/admin/analytics"  },
  { label: "Settings",  icon: Settings,    to: "/admin/settings"   },
];

/* ─── Component ───────────────────────────────────────────────────── */
interface Props {
  open:    boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: Props) {
  const session  = useSession();
  const logout   = useLogout();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  function handleLogout() {
    logout.mutate(undefined, { onSuccess: () => navigate({ to: "/soliva-admin" }) });
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* ── Brand lockup ── */}
      <div className="flex items-center justify-between px-5 pb-5 pt-6">
        <div>
          <p className="font-display text-[1.125rem] leading-none tracking-tight text-[#F7F3EC]">
            Soliva
          </p>
          <p className="mt-0.5 font-mono text-[0.42rem] tracking-[0.32em] uppercase font-bold text-[#B88445]">
            Ops Center
          </p>
        </div>
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F7F3EC]/40 transition-colors hover:bg-white/5 hover:text-[#F7F3EC] lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── divider ── */}
      <div className="mx-5 mb-4 h-px bg-white/[0.07]" />

      {/* ── Nav ── */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 overflow-y-auto">
        {NAV.map((item) => {
          if (item.soon) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 opacity-35 cursor-default select-none"
              >
                <item.icon className="h-4 w-4 shrink-0 text-[#F7F3EC]/50" />
                <span className="flex-1 text-[0.8125rem] font-medium text-[#F7F3EC]/60">
                  {item.label}
                </span>
                <span className="rounded-full bg-[#B88445]/15 px-1.5 py-0.5 font-mono text-[0.4rem] tracking-[0.18em] uppercase font-bold text-[#B88445]/70">
                  Soon
                </span>
              </div>
            );
          }

          const isActive = pathname === item.to || pathname.startsWith(item.to + "/");

          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                isActive
                  ? "bg-[#B88445]/15 text-[#B88445]"
                  : "text-[#F7F3EC]/60 hover:bg-white/[0.06] hover:text-[#F7F3EC]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-nav-pill"
                  className="absolute inset-0 rounded-xl bg-[#B88445]/12"
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[#B88445]" />
              )}
              <item.icon
                className={`relative h-4 w-4 shrink-0 transition-colors ${
                  isActive ? "text-[#B88445]" : "text-[#F7F3EC]/40 group-hover:text-[#F7F3EC]/70"
                }`}
              />
              <span className="relative text-[0.8125rem] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── divider ── */}
      <div className="mx-5 mt-4 h-px bg-white/[0.07]" />

      {/* ── Admin user + logout ── */}
      {session && (
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar
              src={session.user.avatarUrl}
              name={session.user.name}
              size={32}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8rem] font-medium text-[#F7F3EC]">
                {session.user.name}
              </p>
              <p className="truncate font-mono text-[0.5rem] tracking-[0.12em] uppercase font-bold text-[#B88445]">
                Admin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[0.8rem] text-[#F7F3EC]/45 transition-all hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{logout.isPending ? "Signing out…" : "Sign Out"}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (fixed) ── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[220px] flex-col bg-[#1C140F] border-r border-white/[0.05]">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar (drawer + overlay) ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={onClose}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col bg-[#1C140F] border-r border-white/[0.05] lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
