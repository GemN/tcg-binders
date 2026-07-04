import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";

interface CartQuantityControlProps {
  availableQuantity: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export const CartQuantityControl = ({
  availableQuantity,
  quantity,
  onQuantityChange,
}: CartQuantityControlProps) => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="inline-flex h-9 items-center rounded-md border border-border bg-background">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-r-none"
        disabled={quantity <= 1}
        aria-label={t("common:previous")}
        onClick={() => onQuantityChange(quantity - 1)}
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="flex h-full min-w-10 items-center justify-center border-x border-border px-2 text-sm font-semibold tabular-nums">
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-l-none"
        disabled={quantity >= availableQuantity}
        aria-label={t("common:next")}
        onClick={() => onQuantityChange(quantity + 1)}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
};
