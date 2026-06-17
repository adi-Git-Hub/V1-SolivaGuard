import { useMemo } from "react";

import { useSession } from "@/features/auth/hooks/useSession";
import { useCartStore } from "../store";
import type { CartLine } from "../schema";

// Unified cart facade. Components call `add` / `remove` / `setQuantity` /
// `clear` and read `lines`, `itemCount`, `subtotalCents` the same way.
//
// The storefront sells a single showcase product (SunWrap) that lives entirely
// in the frontend — it has no backend Product document — so the server cart
// (which does Product.findById) can never accept it. The cart therefore lives
// in the persisted local store for BOTH guests and signed-in users, and
// checkout is staged separately via the checkout store + Razorpay.
export type CartFacade = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  isLoading: boolean;
  isSignedIn: boolean;
  add: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

export function useCart(): CartFacade {
  const session = useSession();
  const isSignedIn = Boolean(session);

  const lines = useCartStore((s) => s.lines);
  const add = useCartStore((s) => s.add);
  const remove = useCartStore((s) => s.remove);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const clear = useCartStore((s) => s.clear);

  const { itemCount, subtotalCents } = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    for (const l of lines) {
      count += l.quantity;
      subtotal += l.priceCents * l.quantity;
    }
    return { itemCount: count, subtotalCents: subtotal };
  }, [lines]);

  return {
    lines,
    itemCount,
    subtotalCents,
    isLoading: false,
    isSignedIn,
    add,
    remove,
    setQuantity,
    clear,
  };
}
