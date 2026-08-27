import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";

interface CartQuantityControlProps {
  availableQuantity: number;
  onRemove?: () => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export const CartQuantityControl = ({
  availableQuantity,
  onRemove,
  quantity,
  onQuantityChange,
}: CartQuantityControlProps) => {
  const { t } = useTranslation(["common", "checkout"]);
  const handleDecrease = () => {
    if (quantity <= 1) {
      onRemove?.();
      return;
    }

    onQuantityChange(quantity - 1);
  };
  const handleIncrease = () => {
    onQuantityChange(quantity + 1);
  };

  return (
    <div className="inline-flex h-8 w-28 items-center rounded-none border border-border bg-card">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-full w-9 rounded-none"
        disabled={quantity <= 1 && !onRemove}
        aria-label={
          quantity <= 1 && onRemove
            ? t("checkout:remove")
            : t("common:previous")
        }
        onClick={handleDecrease}
      >
        <Minus className="size-4" />
      </Button>
      <span className="flex h-full min-w-0 flex-1 items-center justify-center px-2 text-sm font-semibold tabular-nums">
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-full w-9 rounded-none"
        disabled={quantity >= availableQuantity}
        aria-label={t("common:next")}
        onClick={handleIncrease}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
};
