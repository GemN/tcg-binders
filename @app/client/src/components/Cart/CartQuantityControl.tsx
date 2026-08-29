import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

const MAXIMUM_TOOLTIP_DURATION_MS = 1500;

interface CartQuantityControlProps {
  availableQuantity: number;
  className?: string;
  itemName?: string;
  onRemove?: () => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export const CartQuantityControl = ({
  availableQuantity,
  className,
  itemName,
  onRemove,
  quantity,
  onQuantityChange,
}: CartQuantityControlProps) => {
  const { t } = useTranslation(["common", "checkout"]);
  const [isMaximumTooltipOpen, setIsMaximumTooltipOpen] = useState(false);
  const maximumTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isMaximumReached = quantity >= availableQuantity;
  const decreaseLabel = itemName
    ? t(
        quantity <= 1 && onRemove
          ? "checkout:remove_item"
          : "checkout:decrease_quantity",
        { name: itemName }
      )
    : quantity <= 1 && onRemove
      ? t("checkout:remove")
      : t("common:previous");
  const increaseLabel = itemName
    ? t("checkout:increase_quantity", { name: itemName })
    : t("common:next");

  useEffect(
    () => () => {
      if (maximumTooltipTimeoutRef.current) {
        clearTimeout(maximumTooltipTimeoutRef.current);
      }
    },
    []
  );

  const handleDecrease = () => {
    if (quantity <= 1) {
      onRemove?.();
      return;
    }

    onQuantityChange(quantity - 1);
  };
  const handleIncrease = () => {
    if (!isMaximumReached) {
      onQuantityChange(quantity + 1);
      return;
    }

    if (maximumTooltipTimeoutRef.current) {
      clearTimeout(maximumTooltipTimeoutRef.current);
    }

    setIsMaximumTooltipOpen(true);
    maximumTooltipTimeoutRef.current = setTimeout(() => {
      setIsMaximumTooltipOpen(false);
    }, MAXIMUM_TOOLTIP_DURATION_MS);
  };

  return (
    <div
      className={cn(
        "inline-flex h-8 w-28 items-center rounded-none border border-border bg-card",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-full w-9 rounded-none"
        disabled={quantity <= 1 && !onRemove}
        aria-label={decreaseLabel}
        onClick={handleDecrease}
      >
        <Minus className="size-4" />
      </Button>
      <span className="flex h-full min-w-0 flex-1 items-center justify-center px-2 text-sm font-semibold tabular-nums">
        {quantity}
      </span>
      <Tooltip open={isMaximumTooltipOpen}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-full w-9 rounded-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            aria-disabled={isMaximumReached}
            aria-label={increaseLabel}
            onClick={handleIncrease}
          >
            <Plus className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={4}>
          {t("checkout:maximum_reached")}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
