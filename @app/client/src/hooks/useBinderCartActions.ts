import type { BinderByShortIdQuery } from "@app/graphql";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { ModalBinderCardRecord } from "@/components/ModalBinderCardDetail/types";
import type { CartItemInput, CartSellerSnapshot } from "@/lib/cart";
import { useCart } from "@/providers/CartContext";

type BinderCartBinder = NonNullable<BinderByShortIdQuery["binderByShortId"]>;

interface UseBinderCartActionsParams {
  binder: BinderCartBinder | null | undefined;
  isCartPreview: boolean;
  isSellerLoading: boolean;
  seller: CartSellerSnapshot | null;
}

interface UseBinderCartActionsResult {
  handleAddToCart: (binderCard: ModalBinderCardRecord) => void;
}

export const useBinderCartActions = ({
  binder,
  isCartPreview,
  isSellerLoading,
  seller,
}: UseBinderCartActionsParams): UseBinderCartActionsResult => {
  const { t } = useTranslation(["checkout"]);
  const { addCartItem } = useCart();

  const getCartItemInput = useCallback(
    (binderCard: ModalBinderCardRecord): CartItemInput | null => {
      if (!binder || !binderCard.card || binderCard.quantity < 1) return null;
      if (isSellerLoading) return null;

      const numericPriceAmount = Number(binderCard.priceAmount);
      const unitPriceAmount =
        binderCard.priceAmount !== null &&
        binderCard.priceAmount !== undefined &&
        Number.isFinite(numericPriceAmount)
          ? numericPriceAmount
          : null;
      const cartSeller = seller ?? {
        country: null,
        id: binder.ownerId,
        nickname: t("checkout:seller_fallback"),
      };

      return {
        availableQuantity: binderCard.quantity,
        binder: {
          id: binder.id,
          name: binder.name,
          note: binder.note,
          shortId: binder.shortId,
        },
        binderCardId: binderCard.id,
        card: {
          collectorNumber: binderCard.card.collectorNumber,
          imageUrl: binderCard.card.imageUrl,
          name: binderCard.card.name,
          scryfallId: binderCard.card.mtgCardDetail?.scryfallId ?? null,
          setCode: binderCard.card.cardSet?.code ?? null,
          setName: binderCard.card.cardSet?.name ?? null,
        },
        condition: binderCard.condition,
        finish: binderCard.finish,
        isPreview: isCartPreview,
        language: binderCard.language,
        seller: cartSeller,
        unitPriceAmount,
        unitPriceCurrency:
          unitPriceAmount === null ? null : binderCard.priceCurrency,
      };
    },
    [binder, isCartPreview, isSellerLoading, seller, t]
  );

  const handleAddToCart = useCallback(
    (binderCard: ModalBinderCardRecord) => {
      const cartItemInput = getCartItemInput(binderCard);
      if (!cartItemInput) {
        toast.error(t("checkout:cart_unavailable"));
        return;
      }

      const result = addCartItem(cartItemInput);
      if (!result) {
        toast.error(t("checkout:cart_unavailable"));
        return;
      }

      if (result.wasCapped) {
        toast.info(t("checkout:add_to_cart_capped"));
      }
    },
    [addCartItem, getCartItemInput, t]
  );

  return { handleAddToCart };
};
