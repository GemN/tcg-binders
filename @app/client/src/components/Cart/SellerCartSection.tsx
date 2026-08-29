import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { CartBinderSection } from "@/components/Cart/CartBinderSection";
import { formatTotals } from "@/components/Cart/cartFormat";
import {
  type CartCheckboxState,
  getCartSelectionState,
} from "@/components/Cart/cartSelection";
import { CountryFlag } from "@/components/CountryFlag";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import type { CartSellerGroup } from "@/lib/cart";
import { getCartCurrencyTotals, getCartItemCount } from "@/lib/cart";

interface SellerCartSectionProps {
  group: CartSellerGroup;
  locale: string;
  selectedItemIds: ReadonlySet<string>;
  selectionState: CartCheckboxState;
  onClearBinder: (binderId: string) => void;
  onClearSeller: (sellerId: string) => void;
  onGroupSelectionChange: (
    binderCardIds: string[],
    isSelected: boolean
  ) => void;
  onItemSelectionChange: (binderCardId: string, isSelected: boolean) => void;
  onQuantityChange: (binderCardId: string, quantity: number) => void;
  onRemove: (binderCardId: string) => void;
}

export const SellerCartSection = ({
  group,
  locale,
  selectedItemIds,
  selectionState,
  onClearBinder,
  onClearSeller,
  onGroupSelectionChange,
  onItemSelectionChange,
  onQuantityChange,
  onRemove,
}: SellerCartSectionProps) => {
  const { t } = useTranslation(["checkout"]);
  const totals = getCartCurrencyTotals(group.items);
  const hasPreviewItems = group.items.some((item) => item.isPreview);
  const sellerCardIds = group.items.map((item) => item.binderCardId);
  const sellerName = group.seller.nickname.trim();

  return (
    <section className="overflow-hidden rounded-md border border-border bg-card text-card-foreground">
      <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-4 lg:items-center lg:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
          <Checkbox
            aria-label={t("checkout:select_seller", {
              seller: group.seller.nickname,
            })}
            checked={selectionState}
            onCheckedChange={(checked) =>
              onGroupSelectionChange(sellerCardIds, checked === true)
            }
          />
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Link
                to={`/user/${encodeURIComponent(sellerName)}`}
                className="inline-flex min-w-0 items-center gap-2 rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {group.seller.country && (
                  <CountryFlag
                    code={group.seller.country}
                    className="h-[13.5px] w-[18px]"
                    label={group.seller.country}
                  />
                )}
                <h2 className="truncate font-display text-lg font-semibold">
                  {group.seller.nickname}
                </h2>
              </Link>
              {hasPreviewItems && (
                <Badge variant="warning" size="sm">
                  {t("checkout:preview_badge")}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("checkout:item_count", {
                count: getCartItemCount(group.items),
              })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 lg:justify-end">
          {totals.length > 0 && (
            <p className="hidden text-sm font-semibold tabular-nums text-foreground lg:block">
              {formatTotals({ locale, totals })}
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-8 p-0 text-destructive hover:text-destructive lg:w-auto lg:px-3"
            aria-label={t("checkout:empty_seller_cart")}
            onClick={() => onClearSeller(group.seller.id)}
          >
            <Trash2 className="size-4" />
            <span className="hidden lg:inline">
              {t("checkout:empty_seller_cart")}
            </span>
          </Button>
        </div>
      </div>

      {group.binders.map((binderGroup) => (
        <CartBinderSection
          key={binderGroup.binder.id}
          binderGroup={binderGroup}
          locale={locale}
          selectedItemIds={selectedItemIds}
          selectionState={getCartSelectionState(
            binderGroup.items,
            selectedItemIds
          )}
          onGroupSelectionChange={onGroupSelectionChange}
          onItemSelectionChange={onItemSelectionChange}
          onClearBinder={onClearBinder}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      ))}
    </section>
  );
};
