import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartLine } from "./schema";

// Guest cart store. For signed-in users the cart lives on the server (see
// features/cart/api.ts + hooks/useCart.ts) — this store is only the
// pre-login / offline fallback. The unified `useCart()` facade decides which
// source to read.
type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  remove: (productId: string, variant?: string) => void;
  setQuantity: (productId: string, quantity: number, variant?: string) => void;
  clear: () => void;
  /** Replace every line in one go. Used after a server cart merge to reset
   * the guest cart to empty without thrashing subscribers. */
  replaceAll: (lines: CartLine[]) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (input) => {
        const quantity = input.quantity ?? 1;
        const existing = get().lines.find(
          (l) => l.productId === input.productId && (l.variant ?? "") === (input.variant ?? ""),
        );
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.productId === input.productId && (l.variant ?? "") === (input.variant ?? "")
                ? { ...l, quantity: l.quantity + quantity }
                : l,
            ),
          });
          return;
        }
        const { quantity: _omit, ...rest } = input;
        set({ lines: [...get().lines, { ...rest, quantity }] });
      },
      remove: (productId, variant) =>
        set({
          lines: get().lines.filter(
            (l) => !(l.productId === productId && (l.variant ?? "") === (variant ?? "")),
          ),
        }),
      setQuantity: (productId, quantity, variant) => {
        if (quantity <= 0) {
          set({
            lines: get().lines.filter(
              (l) => !(l.productId === productId && (l.variant ?? "") === (variant ?? "")),
            ),
          });
          return;
        }
        set({
          lines: get().lines.map((l) =>
            l.productId === productId && (l.variant ?? "") === (variant ?? "")
              ? { ...l, quantity }
              : l,
          ),
        });
      },
      clear: () => set({ lines: [] }),
      replaceAll: (lines) => set({ lines }),
    }),
    {
      name: "soliva.cart",
      version: 1,
    },
  ),
);

export const useCartUIStore = create<{
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}>((set) => ({
  isOpen: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
}));
