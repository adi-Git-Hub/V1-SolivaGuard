import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/components/admin/ProductForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAdminProducts, useUpdateProduct, type ProductFormData } from "@/features/admin/api";

export const Route = createFileRoute("/admin/products/$productId/edit")({
  component: EditProductRoute,
});

function EditProductRoute() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useAdminProducts({ limit: 1000 });
  const product = data?.products.find(p => p._id === productId);

  const update = useUpdateProduct(productId);

  // Pending form data — held until user confirms
  const [pendingData, setPendingData] = useState<ProductFormData | null>(null);

  // Build a human-readable summary of what's changing
  function buildChangeSummary(formData: ProductFormData): string {
    if (!product) return "Save product changes";
    const changes: string[] = [];
    if (formData.name !== product.name) changes.push(`Name: "${product.name}" → "${formData.name}"`);
    if (formData.price !== product.price) changes.push(`Price: ₹${product.price} → ₹${formData.price}`);
    if (formData.compareAtPrice !== (product.compareAtPrice ?? null))
      changes.push(`MRP: ₹${product.compareAtPrice ?? "—"} → ₹${formData.compareAtPrice ?? "—"}`);
    if (formData.stock !== product.stock) changes.push(`Stock: ${product.stock} → ${formData.stock}`);
    if (formData.status !== product.status) changes.push(`Status: ${product.status} → ${formData.status}`);
    if (formData.category !== product.category) changes.push(`Category: ${product.category} → ${formData.category}`);
    return changes.length > 0 ? changes.join(" · ") : "No field changes detected";
  }

  // ProductForm calls this — we intercept and show confirm dialog
  async function handleSubmitRequest(formData: ProductFormData) {
    setPendingData(formData);
  }

  // User confirmed — actually save
  async function handleConfirm() {
    if (!pendingData) return;
    await update.mutateAsync(pendingData, {
      onSuccess: () => {
        toast.success("Product updated");
        setPendingData(null);
        navigate({ to: "/admin/products" });
      },
      onError: (e: unknown) => {
        toast.error((e as Error)?.message ?? "Failed to update product");
        setPendingData(null);
      },
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/admin/products"
          className="mb-3 flex items-center gap-1.5 font-mono text-[0.5rem] tracking-[0.22em] uppercase font-bold text-[#3a2a22]/40 hover:text-[#B88445] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Products
        </Link>
        <p className="font-mono text-[0.5rem] tracking-[0.32em] uppercase font-bold text-[#B88445] mb-1">Management</p>
        <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[#2D241E]">
          {isLoading ? "Loading…" : `Edit: ${product?.name ?? "Product"}`}
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : !product ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#3a2a22]/12 py-20">
          <p className="text-[0.9rem] font-medium text-[#3a2a22]/40">Product not found</p>
          <Link to="/admin/products" className="mt-3 font-mono text-[0.5rem] tracking-[0.2em] uppercase font-bold text-[#B88445] hover:underline">
            ← Back to Products
          </Link>
        </div>
      ) : (
        <ProductForm
          initialData={product}
          onSubmit={handleSubmitRequest}
          isLoading={update.isPending}
          submitLabel="Save Changes"
        />
      )}

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={pendingData !== null}
        title="Save product changes?"
        description={`You are about to update "${product?.name}". Please review the changes below before confirming.`}
        detail={pendingData ? buildChangeSummary(pendingData) : undefined}
        confirmLabel="Yes, Save Changes"
        cancelLabel="Go Back"
        onConfirm={handleConfirm}
        onCancel={() => setPendingData(null)}
        isLoading={update.isPending}
      />
    </div>
  );
}
