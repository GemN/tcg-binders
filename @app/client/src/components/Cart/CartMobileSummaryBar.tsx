import { MessageSquareText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatTotals } from "@/components/Cart/cartFormat";
import type { CartCheckboxState } from "@/components/Cart/cartSelection";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import type { CartCurrencyTotal } from "@/lib/cart";

interface CartMobileSummaryBarProps {
  isGenerateDisabled: boolean;
  locale: string;
  selectionState: CartCheckboxState;
  totals: CartCurrencyTotal[];
  onGenerateMessages: () => void;
  onSelectionChange: (isSelected: boolean) => void;
}

export const CartMobileSummaryBar = ({
  isGenerateDisabled,
  locale,
  selectionState,
  totals,
  onGenerateMessages,
  onSelectionChange,
}: CartMobileSummaryBarProps) => {
  const { t } = useTranslation(["checkout"]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card p-3 lg:hidden">
      <div className="mx-auto flex max-w-[92rem] items-center gap-3">
        <div className="flex shrink-0 items-center gap-1.5">
          <Checkbox
            id="cart-mobile-select-all"
            aria-label={t("checkout:select_all")}
            checked={selectionState}
            onCheckedChange={(checked) => onSelectionChange(checked === true)}
          />
          <label
            htmlFor="cart-mobile-select-all"
            className="cursor-pointer text-sm font-medium"
          >
            {t("checkout:all")}
          </label>
        </div>
        <p
          data-testid="cart-mobile-total"
          className="min-w-0 flex-1 break-words text-right text-lg font-bold leading-tight tabular-nums sm:text-lg"
        >
          {totals.length > 0 ? formatTotals({ locale, totals }) : "-"}
        </p>
        <Button
          type="button"
          className="h-10 shrink-0 gap-1 px-2 text-sm sm:gap-2 sm:px-3"
          disabled={isGenerateDisabled}
          onClick={onGenerateMessages}
        >
          <MessageSquareText className="size-4" />
          {t("checkout:generate_messages")}
        </Button>
      </div>
    </div>
  );
};
