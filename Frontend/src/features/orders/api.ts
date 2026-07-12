// Architecture stubs for Phase 4 (orders + payments). None of these are
// wired to the UI yet — the cart's checkout button still does
// `toast.info("Checkout coming in Phase 2")`. These hooks exist so the
// checkout page can be assembled later without redesigning the data layer.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { env } from "@/config/env";
import type { CreateOrderInput, Order } from "./schema";

// Documents (invoice/receipt) are served by the backend at /uploads/... — i.e.
// the API origin WITHOUT the /api/v1 suffix. Build an absolute, downloadable URL.
export function documentUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const origin = (env.VITE_API_URL || "").replace(/\/api\/v1\/?$/, "");
  return `${origin}${path}`;
}

type EnvelopedResponse<T> = { success: boolean; message?: string; data: T };

type CreateOrderResponse = {
  order: Order;
  razorpayOrderId: string;
  amount: number; // paise / cents — Razorpay's unit
  razorpayKeyId?: string; // the key the order was created with (authoritative)
};

export const orderKeys = {
  all: ["orders"] as const,
  mine: () => ["orders", "mine"] as const,
  byId: (id: string) => ["orders", "id", id] as const,
};

// Mongo serializes documents with `_id` (no `id`). Normalize so the whole UI
// can rely on `order.id` for routing/keys.
function normalizeOrder(o: any): Order {
  return { ...o, id: (o?.id ?? o?._id ?? "") as string };
}

// ── Reads ──
export function useMyOrders() {
  return useQuery({
    queryKey: orderKeys.mine(),
    queryFn: async () => {
      const res = await api.get<EnvelopedResponse<{ orders: Order[] }>>("/orders/me");
      return (res.data.orders ?? []).map(normalizeOrder);
    },
    staleTime: 30_000,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.byId(orderId),
    queryFn: async () => {
      const res = await api.get<EnvelopedResponse<{ order: Order }>>(`/orders/${orderId}`);
      return normalizeOrder(res.data.order);
    },
    enabled: Boolean(orderId),
    staleTime: 30_000,
  });
}

// ── Mutations ──
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderInput & { idempotencyKey?: string }) => {
      // Backend reads x-idempotency-key from headers, so a future caller will
      // need to thread it through lib/api.ts. For now we send it in the body
      // as an extra field the controller currently ignores — the request
      // wrapper additions (custom headers) are a Phase-4 task.
      const res = await api.post<EnvelopedResponse<CreateOrderResponse>>("/orders", input);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.mine() });
      // Cart was cleared inside the order transaction on the backend.
      qc.invalidateQueries({ queryKey: ["cart", "current"] });
    },
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      orderId: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => api.post<EnvelopedResponse<unknown>>("/orders/verify-payment", input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: orderKeys.byId(vars.orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.mine() });
    },
  });
}

export type CancelOrderInput = {
  orderId: string;
  reason: string;
  detail?: string;
};

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason, detail }: CancelOrderInput) =>
      api.put<EnvelopedResponse<{ order: Order }>>(`/orders/${orderId}/cancel`, {
        reason,
        detail,
      }),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: orderKeys.byId(orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.mine() });
    },
  });
}

// ── Admin: update fulfilment status ──
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.put<EnvelopedResponse<{ order: Order }>>(`/orders/admin/orders/${orderId}`, { status }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: orderKeys.byId(vars.orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.mine() });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}
