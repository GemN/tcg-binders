import type { CurrencyCode } from "@app/graphql";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CardImage } from "@/components/CardImage";
import {
  formatAmount,
  getCartItemPrintLabel,
} from "@/components/Cart/cartFormat";
import { CartItemBadges } from "@/components/Cart/CartItemBadges";
import { CartQuantityControl } from "@/components/Cart/CartQuantityControl";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import type { CartItem } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

interface CartItemRowProps {
  isSelected: boolean;
  item: CartItem;
  locale: string;
  onQuantityChange: (binderCardId: string, quantity: number) => void;
  onRemove: (binderCardId: string) => void;
  onSelectionChange: (binderCardId: string, isSelected: boolean) => void;
}

export const CartItemRow = ({
  isSelected,
  item,
  locale,
  onQuantityChange,
  onRemove,
  onSelectionChange,
}: CartItemRowProps) => {
  const { t } = useTranslation(["checkout", "binder"]);
  const { convertAmountToLocalCurrency, currency } = usePricingSettings();
  const printLabel = getCartItemPrintLabel({ item });
  const hasListedPrice =
    item.unitPriceAmount !== null && item.unitPriceCurrency;
  const unitPriceLabel = hasListedPrice
    ? formatAmount({
        amount: item.unitPriceAmount ?? 0,
        currency: item.unitPriceCurrency as CurrencyCode,
        locale,
      })
    : t("checkout:no_price");
  const convertedUnitPriceAmount =
    item.unitPriceAmount !== null &&
    item.unitPriceCurrency &&
    item.unitPriceCurrency !== currency
      ? convertAmountToLocalCurrency(
          item.unitPriceAmount,
          item.unitPriceCurrency as CurrencyCode
        )
      : null;
  const convertedUnitPriceLabel =
    convertedUnitPriceAmount !== null
      ? formatAmount({
          amount: convertedUnitPriceAmount,
          currency,
          locale,
        })
      : null;
  const lineTotalLabel = hasListedPrice
    ? formatAmount({
        amount: (item.unitPriceAmount ?? 0) * item.quantity,
        currency: item.unitPriceCurrency as CurrencyCode,
        locale,
      })
    : t("checkout:no_price");

  return (
    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 gap-y-3 border-t border-border px-3 py-4 first:border-t-0 lg:grid-cols-[2rem_minmax(0,1fr)_8rem_9rem_8rem_5rem] lg:items-center lg:px-4">
      <div className="flex pt-1 lg:pt-0">
        <Checkbox
          aria-label={t("checkout:select_card", { card: item.card.name })}
          checked={isSelected}
          onCheckedChange={(checked) =>
            onSelectionChange(item.binderCardId, checked === true)
          }
        />
      </div>

      <div className="grid min-w-0 grid-cols-[3.75rem_minmax(0,1fr)] gap-3">
        <CardImage
          alt={item.card.name}
          className="w-[3.75rem] rounded-[4px] border border-border bg-background shadow-sm"
          finish={item.finish}
          imageSize="thumbnail"
          imageUrl={item.card.imageUrl}
          noImageLabel={t("binder:no_image")}
          showBadgeFinish={false}
          scryfallId={item.card.scryfallId}
        />
        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold leading-tight text-foreground">
            {item.card.name}
          </p>
          {printLabel && (
            <p className="mt-1 text-sm text-muted-foreground">{printLabel}</p>
          )}
          <div className="mt-2">
            <CartItemBadges item={item} />
          </div>
        </div>
      </div>

      <div className="col-span-2 grid grid-cols-2 items-center gap-2 lg:col-span-1 lg:block">
        <span className="text-xs font-semibold uppercase text-muted-foreground lg:hidden">
          {t("checkout:unit_price")}
        </span>
        <div className="flex justify-end lg:justify-start">
          <div className="relative inline-flex flex-col items-end lg:block">
            <span
              className={cn(
                "text-right font-semibold tabular-nums lg:block lg:text-left",
                !hasListedPrice && "text-warning"
              )}
            >
              {unitPriceLabel}
            </span>
            {convertedUnitPriceLabel && (
              <p className="mt-1 whitespace-nowrap text-right text-xs tabular-nums text-muted-foreground lg:absolute lg:left-0 lg:top-full">
                ~ {convertedUnitPriceLabel}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-2 grid grid-cols-2 items-center gap-2 lg:col-span-1 lg:block">
        <span className="text-xs font-semibold uppercase text-muted-foreground lg:hidden">
          {t("checkout:quantity")}
        </span>
        <div className="flex justify-end lg:justify-start">
          <div className="relative inline-flex">
            <CartQuantityControl
              availableQuantity={item.availableQuantity}
              itemName={item.card.name}
              quantity={item.quantity}
              onQuantityChange={(quantity) =>
                onQuantityChange(item.binderCardId, quantity)
              }
            />
            <p className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground">
              {t("checkout:available", { count: item.availableQuantity })}
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-2 grid grid-cols-2 items-center gap-2 lg:col-span-1 lg:block">
        <span className="text-xs font-semibold uppercase text-muted-foreground lg:hidden">
          {t("checkout:total_price")}
        </span>
        <span
          className={cn(
            "text-right font-bold tabular-nums text-foreground lg:block",
            !hasListedPrice && "text-warning"
          )}
        >
          {lineTotalLabel}
        </span>
      </div>

      <div className="col-span-2 flex justify-end lg:col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("checkout:remove")}
          onClick={() => onRemove(item.binderCardId)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
};
