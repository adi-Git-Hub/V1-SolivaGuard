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

// A half-filled checkout the user left behind — persisted so their shipping /
// recipient / gift details survive the login round-trip (guest fills the form →
// gets sent to login for payment → returns to checkout with everything intact).
export type CheckoutDraft = {
  form: Record<string, string>;
  orderType: string;
} | null;

type CheckoutState = {
  items: CheckoutItem[];
  confirmedOrder: ConfirmedOrder | null;
  draft: CheckoutDraft;
  setItems: (items: CheckoutItem[]) => void;
  setConfirmedOrder: (order: ConfirmedOrder) => void;
  setDraft: (draft: CheckoutDraft) => void;
  clear: () => void;
  clearConfirmed: () => void;
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      items: [],
      confirmedOrder: null,
      draft: null,
      setItems: (items) => set({ items }),
      setConfirmedOrder: (order) => set({ confirmedOrder: order }),
      setDraft: (draft) => set({ draft }),
      // A completed order clears the staged cart AND the saved draft.
      clear: () => set({ items: [], draft: null }),
      clearConfirmed: () => set({ confirmedOrder: null }),
    }),
    {
      name: "soliva.checkout",
      version: 3,
      migrate: (persisted: any) => ({
        items: persisted?.items ?? [],
        confirmedOrder: persisted?.confirmedOrder ?? null,
        draft: persisted?.draft ?? null,
      }),
    },
  ),
);
