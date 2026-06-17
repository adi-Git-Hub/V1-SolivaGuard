import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogIn,
  UserPlus,
  Package,
  Heart,
  LogOut,
  LayoutDashboard,
  MessageCircle,
  Mail,
  ChevronRight,
} from "lucide-react";

import { Avatar } from "@/components/shared/Avatar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/features/auth/hooks/useSession";
import { useLogout } from "@/features/auth/api";
import { useIsMobile } from "@/design-system";

const WHATSAPP_URL = "https://wa.me/919479737209";
const SUPPORT_EMAIL = "support@soliva.in";

type Action = { icon: typeof User; label: string; to: string };

/**
 * Premium Soliva account panel. Desktop → floating glass dropdown.
 * Mobile → full-screen slide drawer from the right. One shared panel.
 */
export function AccountMenu() {
  const session = useSession();
  const logout = useLogout();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Esc closes the desktop dropdown.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Loading state skeleton
  if (session === undefined) {
    return (
      <div className="h-10.5 w-10.5 animate-pulse rounded-full bg-white/10" />
    );
  }

  const firstName = session?.user?.name?.trim().split(/\s+/)[0];

  const actions: Action[] = session
    ? [
        { icon: User, label: "Profile", to: "/profile" },
        { icon: Package, label: "Track Order", to: "/profile" },
        { icon: Heart, label: "Wishlist", to: "/collection" },
        ...(session.user.role === "admin"
          ? [{ icon: LayoutDashboard, label: "Admin Dashboard", to: "/admin/dashboard" }]
          : []),
      ]
    : [
        { icon: LogIn, label: "Sign In", to: "/login" },
        { icon: UserPlus, label: "Create Account", to: "/register" },
        { icon: Package, label: "Track Order", to: "/profile" },
        { icon: Heart, label: "Wishlist", to: "/collection" },
      ];

  const triggerClass = session
    ? "flex h-10.5 items-center gap-3 rounded-full outline-none transition-all hover:opacity-85 focus-visible:ring-2 focus-visible:ring-orange-glow/30"
    : "flex h-10.5 px-4 items-center justify-center gap-2.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all outline-none";

  const trigger = session ? (
    <>
      <span className="grid place-items-center rounded-full ring-2 ring-white/30 transition-all duration-300 hover:ring-white/60 hover:shadow-[0_0_0_4px_rgba(255,255,255,0.12),0_6px_18px_-6px_rgba(124,45,18,0.5)]">
        <Avatar src={session.user.avatarUrl} name={session.user.name} size={36} />
      </span>
      <span className="hidden lg:inline text-[13px] font-medium tracking-tight text-white">Profile</span>
    </>
  ) : (
    <>
      <User className="h-[18px] w-[18px]" />
      <span className="hidden lg:inline text-[13px] font-medium tracking-tight">Account</span>
    </>
  );

  const Panel = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-1 pb-4">
        <p className="font-display text-[1.35rem] leading-tight tracking-tight text-brown-deep">
          {session ? `Welcome back${firstName ? `, ${firstName}` : ""}` : "Welcome to Soliva"}
        </p>
        <p className="mt-1 text-[0.8rem] font-light text-ink-muted">
          Manage orders, account and preferences
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#3a2a22]/15 to-transparent" />

      {/* Actions */}
      <div className="flex flex-col gap-0.5 py-3">
        {actions.map(({ icon: Icon, label, to }) => (
          <Link
            key={label}
            to={to}
            onClick={close}
            className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-300 hover:bg-[#3a2a22]/[0.05] active:bg-[#3a2a22]/[0.08]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#c76600]/[0.08] text-[#c76600]">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 text-[0.9rem] font-medium text-brown-deep">{label}</span>
            <ChevronRight className="h-4 w-4 text-ink-muted/40 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        ))}

        {session && (
          <button
            type="button"
            onClick={() => {
              close();
              logout.mutate();
            }}
            className="group mt-0.5 flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-300 hover:bg-red-500/[0.06]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-500/[0.08] text-red-500/80">
              <LogOut className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 text-[0.9rem] font-medium text-red-500/90">Sign Out</span>
          </button>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#3a2a22]/15 to-transparent" />

      {/* Footer */}
      <div className="mt-auto px-1 pt-4">
        <p className="mb-2.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.24em] text-ink-muted/55">
          Need Help?
        </p>
        <div className="flex flex-col gap-2.5">
          <Link
            to="/contact"
            onClick={close}
            className="group flex items-center justify-between gap-2.5 rounded-xl border border-[#c76600]/10 bg-[#c76600]/[0.02] px-3.5 py-3 text-[0.85rem] font-semibold text-[#c76600] transition-all hover:bg-[#c76600]/0.05 hover:shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <MessageCircle className="h-4 w-4" />
              Contact Us
            </div>
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );

  // ── Mobile: full-screen slide drawer from the right ──
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button type="button" aria-label="Account" className={triggerClass}>
            {trigger}
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          aria-describedby={undefined}
          className="w-full max-w-full border-0 bg-[#FAF7F3] p-0"
        >
          <SheetTitle className="sr-only">Account</SheetTitle>
          <div className="flex h-full flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 safe-x">
            <Panel />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // ── Desktop: floating glass dropdown ──
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Account"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <>
            {/* click-outside catcher */}
            <div className="fixed inset-0 z-40" onClick={close} />
            <motion.div
              // macOS "genie" — the panel pours out of the CTA corner: starts as
              // a thin, blurred, skewed sliver at the top-right (the icon) and
              // unfurls with a non-uniform stretch; on close it collapses back
              // into that same point, like a window minimising into the dock.
              variants={{
                hidden: {
                  opacity: 0,
                  scaleX: 0.18,
                  scaleY: 0.04,
                  y: -14,
                  skewY: 5,
                  filter: "blur(6px)",
                  transition: { duration: 0.26, ease: [0.4, 0, 1, 1] },
                },
                visible: {
                  opacity: 1,
                  scaleX: 1,
                  scaleY: 1,
                  y: 0,
                  skewY: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              initial="hidden"
              animate="visible"
              exit="hidden"
              style={{ transformOrigin: "100% 0%", willChange: "transform, filter, opacity" }}
              className="absolute right-0 top-full z-50 mt-3 w-[300px] rounded-2xl border border-[#3a2a22]/[0.08] bg-[#FAF7F3]/95 p-5 backdrop-blur-xl shadow-[0_2px_8px_-2px_rgba(58,42,34,0.06),0_24px_55px_-22px_rgba(58,42,34,0.32)]"
            >
              <Panel />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
