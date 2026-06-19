import { Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { useCart } from "../hooks/useCart";
import type { CartLine } from "../schema";

export function CartLineItem({ line }: { line: CartLine }) {
  const { setQuantity, remove } = useCart();

  return (
    <div className="flex gap-3 sm:gap-4 border-b border-border/40 py-4 sm:py-5">
      <Link
        to="/collection"
        search={{ edition: line.variant ?? line.slug }}
        className="block h-24 w-20 sm:h-28 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-secondary"
      >
        <img
          src={line.image}
          alt={line.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <Link
            to="/collection"
            search={{ edition: line.variant ?? line.slug }}
            className="font-display text-base sm:text-lg leading-tight text-foreground hover:underline break-words"
          >
            {line.name}
          </Link>
          <button
            type="button"
            onClick={() => remove(line.productId, line.variant)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground -m-1.5"
            aria-label={`Remove ${line.name} from cart`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-border">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full"
              onClick={() => setQuantity(line.productId, line.quantity - 1, line.variant)}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-7 text-center text-sm tabular-nums">{line.quantity}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full"
              onClick={() => setQuantity(line.productId, line.quantity + 1, line.variant)}
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <PriceDisplay
            priceCents={line.priceCents * line.quantity}
            currency={line.currency}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
