import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { resolveImageUrl } from "@/lib/image";
import type { CartLine } from "./schema";
import { useCartStore } from "./store";

// ── Wire shapes ─────────────────────────────────────────────────────────
type EnvelopedResponse<T> = { success: boolean; message?: string; data: T };

type RawCartItem = {
  product:
    | string
    | {
        _id?: string;
        id?: string;
        name?: string;
        slug?: string;
        price?: number;
        currency?: string;
        images?: Array<{ url?: string } | string>;
      };
  quantity: number;
};

type RawCart = {
  cartItems: RawCartItem[];
  totalPrice?: number;
};

// ── Normalizers ─────────────────────────────────────────────────────────
function normalizeCart(raw: RawCart | null | undefined): CartLine[] {
  if (!raw || !Array.isArray(raw.cartItems)) return [];
  return raw.cartItems
    .map((item): CartLine | null => {
      const p = item.product;
      if (!p || typeof p === "string") return null; // unpopulated reference
      const id = String(p._id ?? p.id ?? "");
      if (!id) return null;
      const firstImage = Array.isArray(p.images)
        ? p.images.map((i) => (typeof i === "string" ? i : i?.url)).find(Boolean)
        : undefined;
      return {
        productId: id,
        slug: p.slug || id,
        name: p.name || "",
        image: resolveImageUrl(firstImage ?? undefined),
        priceCents: Math.round(Number(p.price ?? 0) * 100),
        currency: p.currency || "INR",
        quantity: Number(item.quantity || 1),
      };
    })
    .filter((l): l is CartLine => l !== null);
}

// ── Query keys ──────────────────────────────────────────────────────────
export const cartKeys = {
  all: ["cart"] as const,
  current: () => ["cart", "current"] as const,
};

// ── Server-cart query ───────────────────────────────────────────────────
async function fetchServerCart(): Promise<CartLine[]> {
  const res = await api.get<EnvelopedResponse<{ cart: RawCart }>>("/cart");
  return normalizeCart(res.data.cart);
}

export function useServerCartQuery(enabled: boolean) {
  return useQuery({
    queryKey: cartKeys.current(),
    queryFn: fetchServerCart,
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

// ── Server-cart mutations ───────────────────────────────────────────────
export function useAddToServerCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; quantity: number }) =>
      api.post<EnvelopedResponse<{ cart: RawCart }>>("/cart", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.current() }),
  });
}

export function useUpdateServerCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; quantity: number }) =>
      api.put<EnvelopedResponse<{ cart: RawCart }>>(`/cart/${input.productId}`, {
        quantity: input.quantity,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.current() }),
  });
}

export function useRemoveServerCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      api.delete<EnvelopedResponse<{ cart: RawCart }>>(`/cart/${productId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.current() }),
  });
}

export function useClearServerCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<EnvelopedResponse<unknown>>("/cart"),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.current() }),
  });
}

// ── Merge helper (called once on login) ─────────────────────────────────
// Lives here because it touches both the guest store and the server cart.
// Auth's login mutation onSuccess hook calls this after the cookie is set.
export async function mergeGuestCartIntoServer(): Promise<void> {
  // No-op: the cart is local-only (the showcase product has no backend Product
  // document, so /cart/merge would reject it). The persisted guest store is the
  // single source of truth across guest → signed-in, so there is nothing to
  // merge and the local cart must survive login untouched.
}
