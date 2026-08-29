import { useCallback, useEffect } from "react";

import { CardConditionBadge } from "@/components/CardConditionBadge";
import { CardFinishBadge } from "@/components/CardFinishBadge";
import { CartQuantityControl } from "@/components/Cart/CartQuantityControl";
import { CountryFlag } from "@/components/CountryFlag";
import { Button } from "@/components/ui/Button";
import { cardLanguageFlagCodes } from "@/config/card";
import { useCart } from "@/providers/CartContext";

import type { ModalBinderCardRecord } from "./types";

interface BinderCardOfferPanelProps {
  addToCartLabel: string;
  availableLabel: string;
  binderCard: ModalBinderCardRecord;
  convertedPriceValue: string | null;
  notAvailableLabel: string;
  priceValue: string;
  onAddToCart?: () => void;
  translateCardOption: (
    group: "condition" | "finish" | "language",
    value: string | null | undefined
  ) => string | null;
}

export const BinderCardOfferPanel = ({
  addToCartLabel,
  availableLabel,
  binderCard,
  convertedPriceValue,
  notAvailableLabel,
  priceValue,
  onAddToCart,
  translateCardOption,
}: BinderCardOfferPanelProps) => {
  const {
    items,
    reconcileCartItemAvailability,
    removeCartItem,
    updateCartItemQuantity,
    updateCartItemQuantityWithNotification,
  } = useCart();
  const cartItem = onAddToCart
    ? items.find((item) => item.binderCardId === binderCard.id)
    : undefined;
  const cartItemAvailableQuantity = cartItem?.availableQuantity;
  const languageValue =
    translateCardOption("language", binderCard.language) || notAvailableLabel;
  const cardName = binderCard.card?.name || notAvailableLabel;
  const handleQuantityChange = useCallback(
    (quantity: number) => {
      if (cartItem && quantity > cartItem.quantity) {
        updateCartItemQuantityWithNotification(binderCard.id, quantity);
        return;
      }

      updateCartItemQuantity(binderCard.id, quantity);
    },
    [
      binderCard.id,
      cartItem,
      updateCartItemQuantity,
      updateCartItemQuantityWithNotification,
    ]
  );
  const handleRemoveFromCart = useCallback(() => {
    removeCartItem(binderCard.id);
  }, [binderCard.id, removeCartItem]);

  useEffect(() => {
    if (cartItemAvailableQuantity === undefined) return;

    reconcileCartItemAvailability(binderCard.id, binderCard.quantity);
  }, [
    binderCard.id,
    binderCard.quantity,
    cartItemAvailableQuantity,
    reconcileCartItemAvailability,
  ]);

  return (
    <section className="rounded-sm border border-[#D8D3CC] bg-[#F4F1EC] p-4 text-primary">
      <div className="grid gap-4 md:max-w-[18.5rem]">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-display font-medium tabular-nums">
              {priceValue}
            </span>
            {convertedPriceValue && (
              <span className="text-sm text-muted-foreground tabular-nums">
                ≈ {convertedPriceValue}
              </span>
            )}
          </div>
          <p className="text-xs font-normal text-secondary">{availableLabel}</p>
        </div>

        {onAddToCart &&
          (cartItem ? (
            <CartQuantityControl
              availableQuantity={cartItem.availableQuantity}
              className="h-11 w-full"
              itemName={cardName}
              onRemove={handleRemoveFromCart}
              quantity={cartItem.quantity}
              onQuantityChange={handleQuantityChange}
            />
          ) : (
            <Button
              type="button"
              size="lg"
              className="h-11 w-full"
              disabled={binderCard.quantity < 1}
              onClick={onAddToCart}
            >
              {addToCartLabel}
            </Button>
          ))}

        <div className="flex flex-wrap items-center gap-2">
          <CardConditionBadge
            condition={binderCard.condition}
            className="rounded-sm py-0.5"
            showTooltip
          />
          <CountryFlag
            code={cardLanguageFlagCodes[binderCard.language]}
            className="aspect-[4/3] w-5"
            label={languageValue}
            showTooltip
          />
          <CardFinishBadge finish={binderCard.finish} display="icon" />
        </div>
      </div>
    </section>
  );
};
