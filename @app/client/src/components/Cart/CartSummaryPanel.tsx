import { MessageSquareText, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatAmount } from "@/components/Cart/cartFormat";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import type { CartCurrencyTotal, CartEstimatedTotal } from "@/lib/cart";

interface CartSummaryPanelProps {
  binderCount: number;
  estimatedTotal: CartEstimatedTotal | null;
  itemCount: number;
  locale: string;
  sellerCount: number;
  totals: CartCurrencyTotal[];
  unpricedItemCount: number;
  isGenerateDisabled: boolean;
  onClearCart: () => void;
  onGenerateMessages: () => void;
}

export const CartSummaryPanel = ({
  binderCount,
  estimatedTotal,
  itemCount,
  locale,
  sellerCount,
  totals,
  unpricedItemCount,
  isGenerateDisabled,
  onClearCart,
  onGenerateMessages,
}: CartSummaryPanelProps) => {
  const { t } = useTranslation(["checkout"]);

  return (
    <aside className="rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm lg:sticky lg:top-20">
      <h2 className="font-display text-xl font-semibold">
        {t("checkout:cart_summary")}
      </h2>

      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t("checkout:sellers")}</dt>
          <dd className="font-semibold">
            {t("checkout:seller_count", { count: sellerCount })}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t("checkout:binders")}</dt>
          <dd className="font-semibold">
            {t("checkout:binder_count", { count: binderCount })}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t("checkout:items")}</dt>
          <dd className="font-semibold">
            {t("checkout:item_count", { count: itemCount })}
          </dd>
        </div>
        {unpricedItemCount > 0 && (
          <div className="flex items-center justify-between gap-3 text-warning">
            <dt>
              {t("checkout:unpriced_count", { count: unpricedItemCount })}
            </dt>
            <dd className="font-semibold tabular-nums">{unpricedItemCount}</dd>
          </div>
        )}
      </dl>

      <Separator className="my-4" />

      <div className="grid gap-2">
        <p className="text-sm font-semibold text-muted-foreground">
          {t("checkout:totals")}
        </p>
        {totals.length > 0 ? (
          totals.map((total) => (
            <div
              key={total.currency}
              className="flex items-center justify-between gap-3 text-base"
            >
              <span>{total.currency}</span>
              <span className="font-bold tabular-nums">
                {formatAmount({
                  amount: total.amount,
                  currency: total.currency,
                  locale,
                })}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-warning">{t("checkout:no_price")}</p>
        )}
      </div>

      {estimatedTotal && (
        <>
          <Separator className="my-4" />
          <div className="grid gap-1">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">
                {t("checkout:estimated_total")}
              </span>
              <span className="font-display text-xl font-bold tabular-nums">
                {formatAmount({
                  amount: estimatedTotal.amount,
                  currency: estimatedTotal.currency,
                  locale,
                })}
              </span>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("checkout:estimated_total_hint")}
            </p>
          </div>
        </>
      )}

      <div className="mt-5 grid gap-2">
        {isGenerateDisabled && (
          <p className="text-sm text-warning">
            {t("checkout:no_selected_items")}
          </p>
        )}
        <Button
          type="button"
          size="lg"
          disabled={isGenerateDisabled}
          onClick={onGenerateMessages}
        >
          <MessageSquareText className="size-4" />
          {t("checkout:generate_messages")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={onClearCart}
        >
          <Trash2 className="size-4" />
          {t("checkout:empty_cart")}
        </Button>
      </div>
    </aside>
  );
};
