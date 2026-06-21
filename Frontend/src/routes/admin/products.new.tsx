import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ProductForm } from "@/components/admin/ProductForm";
import { useCreateProduct, type ProductFormData } from "@/features/admin/api";

export const Route = createFileRoute("/admin/products/new")({
  component: NewProductRoute,
});

function NewProductRoute() {
  const navigate = useNavigate();
  const create   = useCreateProduct();

  async function handleSubmit(data: ProductFormData) {
    await create.mutateAsync(data, {
      onSuccess: () => {
        toast.success("Product created successfully");
        navigate({ to: "/admin/products" });
      },
      onError: (e: unknown) => {
        toast.error((e as Error)?.message ?? "Failed to create product");
      },
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link
          to="/admin/products"
          className="mb-3 flex items-center gap-1.5 font-mono text-[0.5rem] tracking-[0.22em] uppercase font-bold text-[#3a2a22]/40 hover:text-[#B88445] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Products
        </Link>
        <p className="font-mono text-[0.5rem] tracking-[0.32em] uppercase font-bold text-[#B88445] mb-1">Management</p>
        <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[#2D241E]">Add Product</h1>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        isLoading={create.isPending}
        submitLabel="Create Product"
      />
    </div>
  );
}
