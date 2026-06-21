import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useSession } from "@/features/auth/hooks/useSession";

// Admin route group.
//   - URL access to /admin/* is blocked here (redirects to /soliva-admin).
//   - Real security is on the backend (every /api/v1/admin/* is gated by
//     isAuthenticatedUser + authorizeRoles('admin') → 403 for non-admins).
//   - This guard is UX only: don't render admin UI for non-admins.
export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const session  = useSession();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (session === null) {
      navigate({ to: "/soliva-admin" });
      return;
    }
    if (session && session.user.role !== "admin") {
      navigate({ to: "/" });
    }
  }, [session, navigate]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1C140F]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#B88445]/30 border-t-[#B88445]" />
      </div>
    );
  }
  if (session.user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1C140F]">
        <p className="text-sm text-[#F7F3EC]/40">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area — offset by sidebar on desktop */}
      <div className="lg:pl-[220px] flex flex-col min-h-screen">
        {/* ── Mobile top bar ── */}
        <header className="flex items-center gap-4 border-b border-[#3a2a22]/08 bg-[#F7F3EC]/80 px-4 py-3 backdrop-blur-sm lg:hidden sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#3a2a22]/10 text-[#3a2a22]/60 transition-colors hover:bg-[#3a2a22]/05"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <p className="font-display text-[1rem] tracking-tight text-[#2D241E]">Soliva Admin</p>
        </header>

        {/* ── Desktop top bar ── */}
        <header className="hidden lg:flex items-center justify-between border-b border-[#3a2a22]/08 bg-[#F7F3EC]/70 px-8 py-4 backdrop-blur-sm sticky top-0 z-30">
          <AdminBreadcrumb />
          <LiveClock />
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminBreadcrumb() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div>
      <p className="font-mono text-[0.5rem] tracking-[0.28em] uppercase font-bold text-[#B88445]">
        Operations Center
      </p>
      <p className="mt-0.5 text-[0.75rem] text-[#3a2a22]/40">{today}</p>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-right">
      <p className="font-mono text-[0.875rem] font-medium tabular-nums text-[#2D241E]">
        {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="font-mono text-[0.5rem] tracking-[0.18em] uppercase text-[#3a2a22]/35">
        India Standard Time
      </p>
    </div>
  );
}
