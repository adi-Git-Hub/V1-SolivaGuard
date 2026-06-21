import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, SlidersHorizontal, Edit2, Trash2, Copy, Archive } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAdminProducts, useDeleteProduct, useUpdateProduct, type AdminProduct } from "@/features/admin/api";

export const Route = createFileRoute("/admin/products/")({
  component: AdminProductsRoute,
});

const STATUS_FILTERS = [
  { label: "All",      value: "" },
  { label: "Active",   value: "active" },
  { label: "Draft",    value: "draft" },
  { label: "Archived", value: "archived" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  active:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft:    "bg-amber-50 text-amber-700 border-amber-200",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
};

function StatusBadge({ status }: { status?: string }) {
  const s = status ?? "draft";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.48rem] tracking-[0.14em] uppercase font-bold ${STATUS_BADGE[s] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
      {s}
    </span>
  );
}

function AdminProductsRoute() {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [page, setPage]           = useState(1);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [archiveId, setArchiveId]   = useState<string | null>(null);

  const { data, isLoading } = useAdminProducts({
    keyword: search || undefined,
    status: statusFilter || undefined,
    page,
    limit: 20,
  });

  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct(archiveId ?? "");

  const products   = data?.products ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    products.forEach(p => { c[p.status ?? "draft"] = (c[p.status ?? "draft"] ?? 0) + 1; });
    return c;
  }, [products]);

  function handleDelete(id: string) {
    deleteProduct.mutate(id, {
      onSuccess: () => { toast.success("Product deleted"); setDeleteId(null); },
      onError: (e: unknown) => { toast.error((e as Error)?.message ?? "Delete failed"); setDeleteId(null); },
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.5rem] tracking-[0.32em] uppercase font-bold text-[#B88445] mb-1">Management</p>
          <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[#2D241E]">Products</h1>
          <p className="mt-1 text-[0.8125rem] text-[#3a2a22]/45">{isLoading ? "Loading…" : `${total} total products`}</p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 rounded-xl bg-[#B88445] px-4 py-2.5 font-mono text-[0.5rem] tracking-[0.2em] uppercase font-bold text-white transition-all hover:bg-[#D4A05C] active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" /> Add Product
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3a2a22]/30" />
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-[#3a2a22]/10 bg-[#FDFAF6] py-2.5 pl-9 pr-4 text-[0.8125rem] text-[#2D241E] placeholder-[#3a2a22]/30 outline-none transition-colors focus:border-[#B88445]/40 focus:ring-2 focus:ring-[#B88445]/10"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[0.7rem] text-[#3a2a22]/40">
          <SlidersHorizontal className="h-3 w-3" />
          <span>{products.length} shown</span>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => { setStatus(f.value); setPage(1); }}
            className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.16em] uppercase font-bold transition-all ${
              statusFilter === f.value
                ? "border-[#B88445] bg-[#B88445] text-white"
                : "border-[#3a2a22]/10 bg-[#FDFAF6] text-[#3a2a22]/50 hover:border-[#B88445]/30 hover:text-[#B88445]"
            }`}
          >
            {f.label}
            {f.value && statusCounts[f.value] !== undefined && (
              <span className={`rounded-full px-1 py-0.5 text-[0.4rem] font-bold ${statusFilter === f.value ? "bg-white/25 text-white" : "bg-[#3a2a22]/08 text-[#3a2a22]/50"}`}>
                {statusCounts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#3a2a22]/12 py-16">
          <p className="text-[0.9rem] font-medium text-[#3a2a22]/40">No products found</p>
          <Link to="/admin/products/new" className="mt-3 font-mono text-[0.5rem] tracking-[0.2em] uppercase font-bold text-[#B88445] hover:underline">
            + Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#3a2a22]/08 bg-[#FDFAF6] shadow-[0_2px_12px_-4px_rgba(44,28,18,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[#3a2a22]/06">
                  {["Product", "Category", "Price", "Stock", "Status", "Created", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[0.45rem] tracking-[0.22em] uppercase font-bold text-[#3a2a22]/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <ProductRow key={p._id} product={p} index={i} onDelete={() => setDeleteId(p._id)} onArchive={() => setArchiveId(p._id)} />
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#3a2a22]/06 px-4 py-3">
              <p className="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-[#3a2a22]/30">
                Page {page} of {totalPages} · {total} products
              </p>
              <div className="flex gap-1.5">
                <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="rounded-lg border border-[#3a2a22]/10 px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] uppercase font-bold text-[#3a2a22]/50 transition-all hover:border-[#B88445]/30 hover:text-[#B88445] disabled:opacity-30 disabled:cursor-not-allowed">
                  Prev
                </button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="rounded-lg border border-[#3a2a22]/10 px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] uppercase font-bold text-[#3a2a22]/50 transition-all hover:border-[#B88445]/30 hover:text-[#B88445] disabled:opacity-30 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete this product?"
        description={`"${products.find(p => p._id === deleteId)?.name ?? "This product"}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        destructive
        isLoading={deleteProduct.isPending}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      {/* Archive confirmation */}
      <ConfirmDialog
        open={archiveId !== null}
        title="Archive this product?"
        description={`"${products.find(p => p._id === archiveId)?.name ?? "This product"}" will be hidden from the storefront but not deleted.`}
        detail="Status: active → archived"
        confirmLabel="Yes, Archive"
        cancelLabel="Cancel"
        isLoading={updateProduct.isPending}
        onConfirm={() => {
          if (!archiveId) return;
          updateProduct.mutate({ status: "archived" }, {
            onSuccess: () => { toast.success("Product archived"); setArchiveId(null); },
            onError: (e: unknown) => { toast.error((e as Error)?.message ?? "Failed"); setArchiveId(null); },
          });
        }}
        onCancel={() => setArchiveId(null)}
      />
    </div>
  );
}

function ProductRow({ product, index, onDelete, onArchive }: { product: AdminProduct; index: number; onDelete: () => void; onArchive: () => void }) {
  const thumb = product.images?.[0]?.url;

  function handleDuplicate() {
    toast.info("Open the product and use Save As New to duplicate.");
  }

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.3) }}
      className="group border-b border-[#3a2a22]/05 last:border-0 transition-colors hover:bg-[#B88445]/[0.025]"
    >
      <td className="px-4 py-3 max-w-[220px]">
        <div className="flex items-center gap-3">
          {thumb ? (
            <img src={thumb} alt={product.name} className="h-10 w-10 rounded-lg object-cover border border-[#3a2a22]/08 shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-[#3a2a22]/06 shrink-0 flex items-center justify-center">
              <span className="font-mono text-[0.45rem] text-[#3a2a22]/30">NO IMG</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-medium text-[#2D241E]">{product.name}</p>
            {product.slug && <p className="truncate font-mono text-[0.55rem] text-[#3a2a22]/35">{product.slug}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-[0.625rem] text-[#3a2a22]/55 capitalize">{product.category ?? "—"}</span>
      </td>
      <td className="px-4 py-3">
        <p className="text-[0.875rem] font-semibold text-[#2D241E]">{formatMoney(Math.round((product.price ?? 0) * 100), "INR")}</p>
        {product.compareAtPrice && (
          <p className="font-mono text-[0.55rem] text-[#3a2a22]/30 line-through">{formatMoney(Math.round(product.compareAtPrice * 100), "INR")}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`font-mono text-[0.75rem] font-bold ${
          (product.stock ?? 0) <= 0 ? "text-red-500" :
          (product.stock ?? 0) <= 5 ? "text-amber-600" : "text-[#2D241E]"
        }`}>{product.stock ?? 0}</span>
      </td>
      <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
      <td className="px-4 py-3 font-mono text-[0.58rem] text-[#3a2a22]/40 whitespace-nowrap">
        {product.createdAt ? new Date(product.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link to="/admin/products/$productId/edit" params={{ productId: product._id }}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#3a2a22]/10 text-[#3a2a22]/50 transition-all hover:border-[#B88445]/30 hover:text-[#B88445]" title="Edit">
            <Edit2 className="h-3 w-3" />
          </Link>
          <button type="button" onClick={handleDuplicate}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#3a2a22]/10 text-[#3a2a22]/50 transition-all hover:border-[#B88445]/30 hover:text-[#B88445]" title="Duplicate">
            <Copy className="h-3 w-3" />
          </button>
          {product.status !== "archived" && (
            <button type="button" onClick={onArchive}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#3a2a22]/10 text-[#3a2a22]/50 transition-all hover:border-amber-400/40 hover:text-amber-600" title="Archive">
              <Archive className="h-3 w-3" />
            </button>
          )}
          <button type="button" onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 text-red-400 transition-all hover:border-red-300 hover:bg-red-50" title="Delete">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
