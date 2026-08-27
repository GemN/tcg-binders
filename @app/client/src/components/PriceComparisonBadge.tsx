import { ArrowDown, ArrowUp } from "lucide-react";

import type { PriceComparison } from "@/lib/priceComparison";
import { cn } from "@/lib/utils";

interface PriceComparisonBadgeProps {
  accessibleLabel?: string;
  comparison: PriceComparison | null | undefined;
}

export const PriceComparisonBadge = ({
  accessibleLabel,
  comparison,
}: PriceComparisonBadgeProps) => {
  if (!comparison || comparison.direction === "even") return null;

  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-0.5 rounded-sm px-1 py-0.5 text-xs font-medium leading-none",
        comparison.direction === "below" &&
          "bg-success-background text-success border border-success-border",
        comparison.direction === "above" &&
          "bg-error-background text-error border border-error-border"
      )}
    >
      {comparison.direction === "below" ? (
        <ArrowDown aria-hidden="true" className="size-3" />
      ) : (
        <ArrowUp aria-hidden="true" className="size-3" />
      )}
      <span className="truncate" aria-hidden={!!accessibleLabel}>
        {comparison.label}
      </span>
      {accessibleLabel && <span className="sr-only">{accessibleLabel}</span>}
    </span>
  );
};
