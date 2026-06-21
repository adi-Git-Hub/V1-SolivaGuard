import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Package, AlertTriangle, XCircle, DollarSign, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAdminInventory, useAdjustInventory, type AdminProduct } from "@/features/admin/api";

export const Route = createFileRoute("/admin/inventory")({
  component: AdminInventoryRoute,
});

const STOCK_FILTERS = [
  { label: "All",       value: ""    },
  { label: "Low Stock", value: "low" },
  { label: "Out",       value: "out" },
] as const;

type StockFilter = "" | "low" | "out";

function AdminInventoryRoute() {
  const [search, setSearch]       = useState("");
  const [stockFilter, setStock]   = useState<StockFilter>("");
  const [adjustId, setAdjustId]     = useState<string | null>(null);
  const [adjustDelta, setDelta]     = useState("");
  const [adjustReason, setReason]   = useState("");
  const [confirmAdj, setConfirmAdj] = useState(false);

  const { data, isLoading } = useAdminInventory({
    keyword: search || undefined,
    stock: stockFilter || undefined,
  });

  const adjustInventory = useAdjustInventory();
  const products = data?.products ?? [];
  const summary  = data?.summary;

  function openAdjust(id: string) {
    setAdjustId(id);
    setDelta("");
    setReason("");
  }

  function handleAdjustRequest() {
    if (!adjustId) return;
    const delta = Number(adjustDelta);
    if (isNaN(delta) || delta === 0) { toast.error("Enter a non-zero adjustment"); return; }
    setConfirmAdj(true); // show confirmation
  }

  function handleAdjustConfirmed() {
    if (!adjustId) return;
    const delta = Number(adjustDelta);
    adjustInventory.mutate(
      { productId: adjustId, adjustment: delta, reason: adjustReason || undefined },
      {
        onSuccess: (res) => {
          toast.success(`Stock updated to ${res.data.newStock}`);
          setConfirmAdj(false);
          setAdjustId(null);
        },
        onError: (e: unknown) => {
          toast.error((e as Error)?.message ?? "Failed");
          setConfirmAdj(false);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="font-mono text-[0.5rem] tracking-[0.32em] uppercase font-bold text-[#B88445] mb-1">Operations</p>
        <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[#2D241E]">Inventory</h1>
        <p className="mt-1 text-[0.8125rem] text-[#3a2a22]/45">{isLoading ? "Loading…" : `${products.length} products`}</p>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard icon={Package}       label="Total Units"      value={String(summary?.totalInventory ?? 0)}                                           accent="#10B981" delay={0.00} />
          <SummaryCard icon={DollarSign}    label="Inventory Value"  value={formatMoney(Math.round((summary?.inventoryValue ?? 0) * 100), "INR")}           accent="#B88445" delay={0.06} />
          <SummaryCard icon={AlertTriangle} label="Low Stock"        value={String(summary?.lowStock ?? 0)}      sub="≤ 5 units"                            accent="#F59E0B" delay={0.12} />
          <SummaryCard icon={XCircle}       label="Out of Stock"     value={String(summary?.outOfStock ?? 0)}    sub="0 units"                              accent="#EF4444" delay={0.18} />
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3a2a22]/30" />
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#3a2a22]/10 bg-[#FDFAF6] py-2.5 pl-9 pr-4 text-[0.8125rem] text-[#2D241E] placeholder-[#3a2a22]/30 outline-none transition-colors focus:border-[#B88445]/40 focus:ring-2 focus:ring-[#B88445]/10"
          />
        </div>
        <div className="flex gap-1.5">
          {STOCK_FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStock(f.value)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.16em] uppercase font-bold transition-all ${
                stockFilter === f.value
                  ? "border-[#B88445] bg-[#B88445] text-white"
                  : "border-[#3a2a22]/10 bg-[#FDFAF6] text-[#3a2a22]/50 hover:border-[#B88445]/30 hover:text-[#B88445]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : products.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#3a2a22]/12 py-16">
          <p className="text-[0.9rem] font-medium text-[#3a2a22]/40">No products found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#3a2a22]/06">
                  {["Product", "Category", "Price", "Current Stock", "Status", "Stock Value", "Adjust"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[0.45rem] tracking-[0.22em] uppercase font-bold text-[#3a2a22]/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const isOut = (p.stock ?? 0) <= 0;
                  const isLow = !isOut && (p.stock ?? 0) <= 5;
                  return (
                    <motion.tr
                      key={p._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.25) }}
                      className={`group border-b border-[#3a2a22]/05 last:border-0 transition-colors hover:bg-[#B88445]/[0.025] ${isOut ? "bg-red-50/30" : isLow ? "bg-amber-50/20" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt={p.name} className="h-9 w-9 rounded-lg object-cover border border-[#3a2a22]/08 shrink-0" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-[#3a2a22]/06 shrink-0" />
                          )}
                          <p className="text-[0.8125rem] font-medium text-[#2D241E] truncate max-w-[160px]">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[0.625rem] text-[#3a2a22]/55 capitalize">{p.category ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold text-[0.8125rem] text-[#2D241E]">{formatMoney(Math.round((p.price ?? 0) * 100), "INR")}</td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-[0.875rem] font-bold ${isOut ? "text-red-500" : isLow ? "text-amber-600" : "text-[#2D241E]"}`}>
                          {p.stock ?? 0}
                        </span>
                        {isOut && <span className="ml-2 font-mono text-[0.45rem] text-red-400 uppercase tracking-[0.14em]">OUT</span>}
                        {isLow && <span className="ml-2 font-mono text-[0.45rem] text-amber-500 uppercase tracking-[0.14em]">LOW</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-[0.5rem] tracking-[0.12em] uppercase font-bold ${p.status === "active" ? "text-emerald-600" : p.status === "archived" ? "text-gray-400" : "text-amber-600"}`}>
                          {p.status ?? "draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[0.75rem] text-[#3a2a22]/55">
                        {formatMoney(Math.round((p.stock ?? 0) * (p.price ?? 0) * 100), "INR")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openAdjust(p._id)}
                          className="flex items-center gap-1.5 rounded-lg border border-[#B88445]/20 bg-[#B88445]/06 px-2.5 py-1.5 font-mono text-[0.48rem] tracking-[0.16em] uppercase font-bold text-[#B88445] transition-all hover:bg-[#B88445]/12"
                        >
                          <Plus className="h-2.5 w-2.5" /><Minus className="h-2.5 w-2.5" /> Adjust
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust modal */}
      {adjustId && (() => {
        const prod = products.find(p => p._id === adjustId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-4 w-full max-w-sm rounded-2xl bg-[#FDFAF6] p-6 shadow-2xl"
            >
              <h3 className="font-display text-[1.1rem] text-[#2D241E]">Adjust Inventory</h3>
              <p className="mt-1 text-[0.8125rem] text-[#3a2a22]/50">{prod?.name}</p>
              <p className="mt-0.5 font-mono text-[0.5rem] text-[#3a2a22]/35">Current stock: {prod?.stock ?? 0}</p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block font-mono text-[0.48rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/45 mb-1.5">
                    Adjustment (+ increase / − decrease)
                  </label>
                  <input
                    type="number"
                    value={adjustDelta}
                    onChange={e => setDelta(e.target.value)}
                    placeholder="e.g. 10 or -5"
                    className="w-full rounded-xl border border-[#3a2a22]/10 bg-[#F7F3EC] px-3.5 py-2.5 text-[0.8125rem] text-[#2D241E] outline-none focus:border-[#B88445]/40 focus:ring-2 focus:ring-[#B88445]/10"
                  />
                  {adjustDelta && !isNaN(Number(adjustDelta)) && prod && (
                    <p className="mt-1 font-mono text-[0.5rem] text-[#3a2a22]/40">
                      New stock: {Math.max(0, (prod.stock ?? 0) + Number(adjustDelta))}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-mono text-[0.48rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/45 mb-1.5">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Restock, Damage, Return"
                    className="w-full rounded-xl border border-[#3a2a22]/10 bg-[#F7F3EC] px-3.5 py-2.5 text-[0.8125rem] text-[#2D241E] outline-none focus:border-[#B88445]/40 focus:ring-2 focus:ring-[#B88445]/10"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustId(null)}
                  className="flex-1 rounded-xl border border-[#3a2a22]/12 py-2.5 font-mono text-[0.5rem] tracking-[0.18em] uppercase font-bold text-[#3a2a22]/60 transition-all hover:bg-[#3a2a22]/04"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdjustRequest}
                  className="flex-1 rounded-xl bg-[#B88445] py-2.5 font-mono text-[0.5rem] tracking-[0.18em] uppercase font-bold text-white transition-all hover:bg-[#D4A05C]"
                >
                  Review &amp; Apply
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}
      {/* Inventory adjust confirmation */}
      {(() => {
        const prod = products.find(p => p._id === adjustId);
        const delta = Number(adjustDelta);
        const newStock = Math.max(0, (prod?.stock ?? 0) + delta);
        return (
          <ConfirmDialog
            open={confirmAdj}
            title="Confirm stock adjustment?"
            description={`You are about to update stock for "${prod?.name ?? "this product"}".`}
            detail={`Stock: ${prod?.stock ?? 0} → ${newStock}${adjustReason ? ` · Reason: ${adjustReason}` : ""}`}
            confirmLabel="Yes, Apply"
            cancelLabel="Go Back"
            isLoading={adjustInventory.isPending}
            onConfirm={handleAdjustConfirmed}
            onCancel={() => setConfirmAdj(false)}
          />
        );
      })()}
    </div>
  );
}

function SummaryCard({
  icon: Icon, label, value, sub, accent = "#B88445", delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] p-5 shadow-[0_2px_12px_-4px_rgba(44,28,18,0.07)]"
    >
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: accent }} />
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accent}18` }}>
        <div style={{ color: accent }}><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3">
        <p className="font-display text-[1.6rem] leading-none text-[#2D241E] tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-[0.65rem] text-[#3a2a22]/40">{sub}</p>}
      </div>
      <p className="mt-2 font-mono text-[0.5rem] tracking-[0.2em] uppercase font-bold text-[#3a2a22]/40">{label}</p>
    </motion.div>
  );
}
