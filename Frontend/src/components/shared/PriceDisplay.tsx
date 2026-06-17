import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

type Props = {
  priceCents: number;
  compareAtCents?: number | null;
  currency?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

export function PriceDisplay({
  priceCents,
  compareAtCents,
  currency = "INR",
  className,
  size = "md",
}: Props) {
  const onSale = compareAtCents != null && compareAtCents > priceCents;
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn(sizes[size], "font-medium text-foreground")}>
        {formatMoney(priceCents, currency)}
      </span>
      {onSale && (
        <span className="text-sm text-muted-foreground line-through">
          {formatMoney(compareAtCents!, currency)}
        </span>
      )}
    </div>
  );
}
