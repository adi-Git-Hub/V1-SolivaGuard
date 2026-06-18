// Architecture stubs for Phase 4 (orders + payments). None of these are
// wired to the UI yet — the cart's checkout button still does
// `toast.info("Checkout coming in Phase 2")`. These hooks exist so the
// checkout page can be assembled later without redesigning the data layer.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { CreateOrderInput, Order } from "./schema";

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

// ── Reads ──
export function useMyOrders() {
  return useQuery({
    queryKey: orderKeys.mine(),
    queryFn: async () => {
      const res = await api.get<EnvelopedResponse<{ orders: Order[] }>>("/orders/me");
      return res.data.orders;
    },
    staleTime: 30_000,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.byId(orderId),
    queryFn: async () => {
      const res = await api.get<EnvelopedResponse<{ order: Order }>>(`/orders/${orderId}`);
      return res.data.order;
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

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api.put<EnvelopedResponse<unknown>>(`/orders/${orderId}/cancel`),
    onSuccess: (_data, orderId) => {
      qc.invalidateQueries({ queryKey: orderKeys.byId(orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.mine() });
    },
  });
}
