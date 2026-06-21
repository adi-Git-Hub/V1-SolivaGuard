import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Users, UserCheck, Repeat, Wallet, Download, ArrowUpDown,
  ArrowUp, ArrowDown, SlidersHorizontal, X, MapPin,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { CustomerDrawer } from "@/components/admin/CustomerDrawer";
import {
  useAdminCustomers, useCustomerStats, exportCustomersCsv,
  type CustomerSegment, type CustomerSortField, type CustomerStatus, type AdminCustomer,
} from "@/features/admin/api";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomersRoute,
});

const PAGE_SIZE = 20;

const SEGMENTS: { id: CustomerSegment; label: string }[] = [
  { id: "all",        label: "All Customers" },
  { id: "new",        label: "New" },
  { id: "returning",  label: "Returning" },
  { id: "high-value", label: "High Value" },
  { id: "inactive",   label: "Inactive" },
  { id: "blocked",    label: "Blocked" },
];

type SortCol = { key: CustomerSortField; label: string; align?: "right" };
const COLUMNS: SortCol[] = [
  { key: "name",          label: "Customer" },
  { key: "totalOrders",   label: "Orders",    align: "right" },
  { key: "totalSpend",    label: "Total Spend", align: "right" },
  { key: "avgOrderValue", label: "Avg Order", align: "right" },
  { key: "lastOrder",     label: "Last Order" },
  { key: "createdAt",     label: "Joined" },
];

function AdminCustomersRoute() {
  const [search, setSearch]   = useState("");
  const [segment, setSegment] = useState<CustomerSegment>("all");
  const [status, setStatus]   = useState<CustomerStatus | "">("");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo]     = useState("");
  const [sort, setSort] = useState<CustomerSortField>("createdAt");
  const [dir, setDir]   = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const statsQuery = useCustomerStats();
  const { data, isLoading, isFetching } = useAdminCustomers({
    keyword: search || undefined,
    segment, status: status || undefined,
    sort, dir, joinedFrom: joinedFrom || undefined, joinedTo: joinedTo || undefined,
    page, limit: PAGE_SIZE,
  });

  const customers = data?.customers ?? [];
  const total     = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = statsQuery.data;
  const statsLoading = statsQuery.isLoading;

  const hasActiveFilters = Boolean(status || joinedFrom || joinedTo);

  const resetPage = () => setPage(1);
  const toggleSort = (key: CustomerSortField) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(key); setDir(key === "name" ? "asc" : "desc"); }
    resetPage();
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportCustomersCsv(); } finally { setExporting(false); }
  };

  const cards = useMemo(() => ([
    { icon: Users,     label: "Total Customers",   value: stats ? String(stats.totalCustomers) : "—",     accent: "#6366F1" },
    { icon: UserCheck, label: "Active (30d)",       value: stats ? String(stats.activeCustomers) : "—",    accent: "#10B981" },
    { icon: Repeat,    label: "Returning",          value: stats ? String(stats.returningCustomers) : "—", accent: "#B88445" },
    { icon: Wallet,    label: "Customer Revenue",   value: stats ? formatMoney(Math.round(stats.customerRevenue * 100), "INR") : "—", accent: "#0EA5E9" },
  ]), [stats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[0.5rem] tracking-[0.32em] uppercase font-bold text-[#B88445] mb-1">Management</p>
          <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[#2D241E]">Customers</h1>
          <p className="mt-1 text-[0.8125rem] text-[#3a2a22]/45">
            {isLoading ? "Loading…" : `${total} customer${total === 1 ? "" : "s"}${segment !== "all" ? ` · ${SEGMENTS.find(s => s.id === segment)?.label}` : ""}`}
          </p>
        </div>
        <button
          type="button" onClick={handleExport} disabled={exporting}
          className="flex items-center gap-1.5 rounded-xl border border-[#3a2a22]/12 bg-[#FDFAF6] px-3.5 py-2.5 font-mono text-[0.5rem] tracking-[0.16em] uppercase font-bold text-[#3a2a22]/60 transition-all hover:border-[#B88445]/30 hover:text-[#B88445] disabled:opacity-40"
        >
          <Download className="h-3 w-3" /> {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-2xl" />)
          : cards.map((c, i) => <StatCard key={c.label} {...c} index={i} />)}
      </div>

      {/* Segment pills */}
      <div className="flex flex-wrap items-center gap-2">
        {SEGMENTS.map((s) => {
          const active = segment === s.id;
          return (
            <button
              key={s.id} type="button"
              onClick={() => { setSegment(s.id); resetPage(); }}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] uppercase font-bold transition-all ${
                active
                  ? "border-[#B88445] bg-[#B88445] text-white shadow-[0_4px_12px_-4px_rgba(184,132,69,0.5)]"
                  : "border-[#3a2a22]/12 bg-[#FDFAF6] text-[#3a2a22]/50 hover:border-[#B88445]/30 hover:text-[#B88445]"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Toolbar: search + filter toggle */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3a2a22]/30" />
          <input
            type="search" placeholder="Search name, email or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="w-full rounded-xl border border-[#3a2a22]/10 bg-[#FDFAF6] py-2.5 pl-9 pr-4 text-[0.8125rem] text-[#2D241E] placeholder-[#3a2a22]/30 outline-none transition-colors focus:border-[#B88445]/40 focus:ring-2 focus:ring-[#B88445]/10"
          />
        </div>
        <button
          type="button" onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 font-mono text-[0.5rem] tracking-[0.16em] uppercase font-bold transition-all ${
            showFilters || hasActiveFilters
              ? "border-[#B88445]/40 bg-[#B88445]/08 text-[#B88445]"
              : "border-[#3a2a22]/12 bg-[#FDFAF6] text-[#3a2a22]/55 hover:border-[#B88445]/30 hover:text-[#B88445]"
          }`}
        >
          <SlidersHorizontal className="h-3 w-3" /> Filters{hasActiveFilters ? " ·" : ""}
          {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-[#B88445]" />}
        </button>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="grid gap-3 rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-4 sm:grid-cols-3"
        >
          <Field label="Status">
            <select
              value={status} onChange={(e) => { setStatus(e.target.value as CustomerStatus | ""); resetPage(); }}
              className="w-full rounded-lg border border-[#3a2a22]/10 bg-white py-2 px-2.5 text-[0.8125rem] text-[#2D241E] outline-none focus:border-[#B88445]/40"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </Field>
          <Field label="Joined From">
            <input type="date" value={joinedFrom} onChange={(e) => { setJoinedFrom(e.target.value); resetPage(); }}
              className="w-full rounded-lg border border-[#3a2a22]/10 bg-white py-2 px-2.5 text-[0.8125rem] text-[#2D241E] outline-none focus:border-[#B88445]/40" />
          </Field>
          <Field label="Joined To">
            <input type="date" value={joinedTo} onChange={(e) => { setJoinedTo(e.target.value); resetPage(); }}
              className="w-full rounded-lg border border-[#3a2a22]/10 bg-white py-2 px-2.5 text-[0.8125rem] text-[#2D241E] outline-none focus:border-[#B88445]/40" />
          </Field>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setStatus(""); setJoinedFrom(""); setJoinedTo(""); resetPage(); }}
              className="flex items-center gap-1 justify-self-start font-mono text-[0.5rem] tracking-[0.14em] uppercase font-bold text-[#3a2a22]/40 hover:text-red-500"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </motion.div>
      )}

      {/* Table / states */}
      {isLoading ? (
        <TableSkeleton />
      ) : customers.length === 0 ? (
        <EmptyState search={search} segment={segment} hasFilters={hasActiveFilters} />
      ) : (
        <div className={`overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)] transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1140px]">
              <thead>
                <tr className="border-b border-[#3a2a22]/06">
                  {COLUMNS.map((col) => (
                    <th key={col.key} className={`px-4 py-3 ${col.align === "right" ? "text-right" : "text-left"}`}>
                      <button
                        type="button" onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 font-mono text-[0.45rem] tracking-[0.2em] uppercase font-bold transition-colors hover:text-[#B88445] ${
                          sort === col.key ? "text-[#B88445]" : "text-[#3a2a22]/30"
                        } ${col.align === "right" ? "flex-row-reverse" : ""}`}
                      >
                        {col.label}
                        {sort === col.key
                          ? (dir === "asc" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />)
                          : <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-mono text-[0.45rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/30">Location</th>
                  <th className="px-4 py-3 text-left font-mono text-[0.45rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/30">Device</th>
                  <th className="px-4 py-3 text-left font-mono text-[0.45rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/30">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <CustomerRow key={c._id} customer={c} index={i} onView={() => setDrawerId(c._id)} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#3a2a22]/06 px-4 py-3">
              <p className="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#3a2a22]/30">
                Page {page} of {totalPages} · {total} customers
              </p>
              <div className="flex gap-1.5">
                <PageBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</PageBtn>
                <PageBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</PageBtn>
              </div>
            </div>
          )}
        </div>
      )}

      <CustomerDrawer customerId={drawerId} open={drawerId !== null} onClose={() => setDrawerId(null)} />
    </div>
  );
}

/* ── Row ─────────────────────────────────────────────────────────────── */
function CustomerRow({ customer: c, index, onView }: { customer: AdminCustomer; index: number; onView: () => void }) {
  const blocked = c.status === "blocked";
  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.25) }}
      onClick={onView}
      className="group cursor-pointer border-b border-[#3a2a22]/05 last:border-0 transition-colors hover:bg-[#B88445]/[0.025]"
    >
      {/* Customer */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {c.avatarUrl ? (
            <img src={c.avatarUrl} alt={c.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B88445]/15">
              <span className="font-mono text-[0.55rem] font-bold text-[#B88445]">{c.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-medium text-[#2D241E]">{c.name}</p>
            <p className="truncate font-mono text-[0.55rem] text-[#3a2a22]/40">{c.email}</p>
            {c.phoneNumber && <p className="truncate font-mono text-[0.52rem] text-[#3a2a22]/30">{c.phoneNumber}</p>}
          </div>
        </div>
      </td>
      {/* Orders */}
      <td className="px-4 py-3 text-right font-mono text-[0.8125rem] font-bold text-[#2D241E] tabular-nums">{c.totalOrders}</td>
      {/* Total spend */}
      <td className="px-4 py-3 text-right font-semibold text-[0.875rem] text-[#2D241E] tabular-nums">
        {formatMoney(Math.round((c.totalSpend ?? 0) * 100), "INR")}
      </td>
      {/* AOV */}
      <td className="px-4 py-3 text-right text-[0.8125rem] text-[#3a2a22]/65 tabular-nums">
        {formatMoney(Math.round((c.avgOrderValue ?? 0) * 100), "INR")}
      </td>
      {/* Last order */}
      <td className="px-4 py-3 font-mono text-[0.58rem] text-[#3a2a22]/45">
        {c.lastOrder ? new Date(c.lastOrder).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
      </td>
      {/* Joined */}
      <td className="px-4 py-3 font-mono text-[0.58rem] text-[#3a2a22]/45">
        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
      </td>
      {/* Location */}
      <td className="px-4 py-3">
        <LocationCell customer={c} />
      </td>
      {/* Device */}
      <td className="px-4 py-3">
        {c.deviceInfo || c.browserInfo ? (
          <div className="leading-tight" title={[c.deviceInfo, c.browserInfo, c.osInfo].filter(Boolean).join(" · ")}>
            <p className="text-[0.72rem] font-medium text-[#2D241E]">{c.deviceInfo || "—"}</p>
            <p className="font-mono text-[0.52rem] text-[#3a2a22]/40">{[c.browserInfo, c.osInfo].filter(Boolean).join(" · ") || "—"}</p>
          </div>
        ) : (
          <span className="font-mono text-[0.58rem] text-[#3a2a22]/30">—</span>
        )}
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <StatusPill blocked={blocked} activity={c.activity} />
      </td>
      {/* Action */}
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-[0.5rem] tracking-[0.14em] uppercase font-bold text-[#B88445] opacity-0 transition-opacity group-hover:opacity-100">
          View →
        </span>
      </td>
    </motion.tr>
  );
}

function LocationCell({ customer: c }: { customer: AdminCustomer }) {
  const place = [c.lastLoginCity, c.lastLoginState].filter(Boolean).join(", ");
  if (!place && !c.areaName) {
    return <span className="font-mono text-[0.58rem] text-[#3a2a22]/30">—</span>;
  }
  const tooltip = [
    c.areaName && `Area: ${c.areaName}`,
    place && `${place}${c.lastLoginCountry ? `, ${c.lastLoginCountry}` : ""}`,
    c.lastLoginIP && `IP: ${c.lastLoginIP}`,
    c.lastLoginISP && `ISP: ${c.lastLoginISP}`,
    c.lastLatitude != null && c.lastLongitude != null && `GPS: ${c.lastLatitude.toFixed(4)}, ${c.lastLongitude.toFixed(4)}`,
  ].filter(Boolean).join("\n");
  return (
    <div className="flex items-center gap-1.5 leading-tight" title={tooltip}>
      <MapPin className="h-3 w-3 shrink-0 text-[#B88445]" />
      <div className="min-w-0">
        <p className="truncate text-[0.72rem] font-medium text-[#2D241E]">{c.areaName || c.lastLoginCity || "—"}</p>
        <p className="truncate font-mono text-[0.52rem] text-[#3a2a22]/40">{place || c.lastLoginCountry || "—"}</p>
      </div>
    </div>
  );
}

function StatusPill({ blocked, activity }: { blocked: boolean; activity?: string }) {
  if (blocked) {
    return <Pill className="border-red-200 bg-red-50 text-red-600">Blocked</Pill>;
  }
  if (activity === "active") {
    return <Pill className="border-emerald-200 bg-emerald-50 text-emerald-700">Active</Pill>;
  }
  return <Pill className="border-[#3a2a22]/12 bg-[#3a2a22]/05 text-[#3a2a22]/45">Inactive</Pill>;
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.45rem] tracking-[0.12em] uppercase font-bold ${className}`}>
      {children}
    </span>
  );
}

/* ── Stat card ───────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, accent, index }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="relative overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-4 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.07)]"
    >
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: accent }} />
      <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${accent}18`, color: accent }}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="mt-2.5 font-display text-[1.4rem] leading-none text-[#2D241E] tabular-nums">{value}</p>
      <p className="mt-1.5 font-mono text-[0.45rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/40">{label}</p>
    </motion.div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[0.45rem] tracking-[0.18em] uppercase font-bold text-[#3a2a22]/40">{label}</span>
      {children}
    </label>
  );
}

function PageBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button" disabled={disabled} onClick={onClick}
      className="rounded-lg border border-[#3a2a22]/10 px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] uppercase font-bold text-[#3a2a22]/50 transition-all hover:border-[#B88445]/30 hover:text-[#B88445] disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-[#3a2a22]/04 px-2 py-3 last:border-0">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-40 rounded" />
            <Skeleton className="h-2 w-56 rounded" />
          </div>
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ search, segment, hasFilters }: { search: string; segment: CustomerSegment; hasFilters: boolean }) {
  const filtered = Boolean(search) || hasFilters || segment !== "all";
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#3a2a22]/12 bg-[#FDFAF6]/50 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B88445]/10">
        {filtered ? <Search className="h-6 w-6 text-[#B88445]/50" /> : <Users className="h-6 w-6 text-[#B88445]/50" />}
      </div>
      <div>
        <p className="font-display text-[1.05rem] text-[#2D241E]">
          {filtered ? "No customers match" : "No customers yet"}
        </p>
        <p className="mt-1 text-[0.8125rem] text-[#3a2a22]/40">
          {filtered
            ? "Try a different search, segment, or filter."
            : "Customers will appear here once people sign up."}
        </p>
      </div>
    </div>
  );
}
