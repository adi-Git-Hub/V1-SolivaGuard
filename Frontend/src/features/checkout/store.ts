import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CheckoutItem = {
  productId: string;
  variant?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

export type ConfirmedOrder = {
  orderId: string;
  items: CheckoutItem[];
  total: number;
  paymentId: string;
};

type CheckoutState = {
  items: CheckoutItem[];
  confirmedOrder: ConfirmedOrder | null;
  setItems: (items: CheckoutItem[]) => void;
  setConfirmedOrder: (order: ConfirmedOrder) => void;
  clear: () => void;
  clearConfirmed: () => void;
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      items: [],
      confirmedOrder: null,
      setItems: (items) => set({ items }),
      setConfirmedOrder: (order) => set({ confirmedOrder: order }),
      clear: () => set({ items: [] }),
      clearConfirmed: () => set({ confirmedOrder: null }),
    }),
    {
      name: "soliva.checkout",
      version: 2,
      migrate: (persisted: any) => ({
        items: persisted?.items ?? [],
        confirmedOrder: persisted?.confirmedOrder ?? null,
      }),
    },
  ),
);
