import { ShoppingBag, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "../hooks/useCart";
import { useSession } from "@/features/auth/hooks/useSession";
import { useCheckoutStore } from "@/features/checkout/store";
import { useCartUIStore } from "../store";
import { CartLineItem } from "./CartLineItem";
import { CartSummary } from "./CartSummary";
import { CartEmptyState } from "./CartEmptyState";

export function MiniCartDrawer() {
  const { isOpen, closeCart } = useCartUIStore();
  const { lines } = useCart();
  const session = useSession();
  const navigate = useNavigate();
  const setCheckoutItems = useCheckoutStore((s) => s.setItems);

  function onCheckout() {
    if (!session?.user) {
      toast.message("Sign in to continue to checkout");
      return;
    }
    setCheckoutItems(
      lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        image: l.image,
        price: l.priceCents / 100,
        quantity: l.quantity,
      })),
    );
    closeCart();
    navigate({ to: "/checkout" });
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-md p-0 flex flex-col bg-background/95 backdrop-blur-2xl border-l border-white/10"
        aria-describedby={undefined}
      >
        <div className="flex items-center justify-between p-6 border-b border-border/10">
          <SheetTitle className="font-display text-2xl tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-bronze/80" />
            Your Cart
          </SheetTitle>
          <button
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {lines.length === 0 ? (
            <div className="transform scale-[0.85] origin-top">
              <CartEmptyState />
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-6">
              {lines.map((line) => (
                <CartLineItem key={line.productId} line={line} />
              ))}
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="p-6 border-t border-border/10 bg-background/50">
            <CartSummary onCheckout={onCheckout} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
