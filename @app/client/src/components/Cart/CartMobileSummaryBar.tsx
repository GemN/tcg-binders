import { MessageSquareText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatTotals } from "@/components/Cart/cartFormat";
import { Button } from "@/components/ui/Button";
import type { CartCurrencyTotal } from "@/lib/cart";

interface CartMobileSummaryBarProps {
  isGenerateDisabled: boolean;
  itemCount: number;
  locale: string;
  totals: CartCurrencyTotal[];
  onGenerateMessages: () => void;
}

export const CartMobileSummaryBar = ({
  isGenerateDisabled,
  itemCount,
  locale,
  totals,
  onGenerateMessages,
}: CartMobileSummaryBarProps) => {
  const { t } = useTranslation(["checkout"]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card p-3 lg:hidden">
      <div className="mx-auto flex max-w-[92rem] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">
            {t("checkout:selected_item_count", { count: itemCount })}
          </p>
          <p className="truncate font-bold tabular-nums">
            {totals.length > 0
              ? formatTotals({ locale, totals })
              : t("checkout:no_price")}
          </p>
        </div>
        <Button
          type="button"
          className="h-10"
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
