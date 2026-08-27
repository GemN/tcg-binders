import type {
  CardListingFieldsFragment,
  UserProfilesByIdsQuery,
} from "@app/graphql";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { BinderOwnerLink } from "@/components/BinderOwnerLink";
import { CardConditionBadge } from "@/components/CardConditionBadge";
import { CardFinishBadge } from "@/components/CardFinishBadge";
import { CardImage } from "@/components/CardImage";
import { getCardPrintLabel } from "@/components/Cart/cartFormat";
import { CartQuantityControl } from "@/components/Cart/CartQuantityControl";
import { CountryFlag } from "@/components/CountryFlag";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cardLanguageFlagCodes, getPreferredCardFinish } from "@/config/card";
import { useBinderCartActions } from "@/hooks/useBinderCartActions";
import { getCardScryfallId } from "@/lib/cardImageUrl";
import type { CartSellerSnapshot } from "@/lib/cart";
import { useCart } from "@/providers/CartContext";

export type CardListingSellerProfile = NonNullable<
  UserProfilesByIdsQuery["userProfilesCollection"]
>["edges"][number]["node"];

export interface FormattedCardListingPrice {
  converted: string | null;
  original: string;
}

export type FormatCardListingPrice = (
  listing: CardListingFieldsFragment
) => FormattedCardListingPrice;

interface CardListingRowProps {
  formatPrice: FormatCardListingPrice;
  isSellerLoading: boolean;
  listing: CardListingFieldsFragment;
  sellerProfile: CardListingSellerProfile | null;
  showCardPreview: boolean;
}

const CardListingRow = ({
  formatPrice,
  isSellerLoading,
  listing,
  sellerProfile,
  showCardPreview,
}: CardListingRowProps) => {
  const { t } = useTranslation(["card", "common"]);
  const binder = listing.binder;
  const seller = sellerProfile
    ? ({
        country: sellerProfile.country,
        id: sellerProfile.id,
        nickname: sellerProfile.nickname,
      } satisfies CartSellerSnapshot)
    : null;
  const { handleAddToCart } = useBinderCartActions({
    binder,
    isCartPreview: false,
    isSellerLoading,
    seller,
  });
  const {
    items,
    reconcileCartItemAvailability,
    removeCartItem,
    updateCartItemQuantity,
    updateCartItemQuantityWithNotification,
  } = useCart();
  const cartItem = items.find((item) => item.binderCardId === listing.id);
  const cartItemAvailableQuantity = cartItem?.availableQuantity;
  const languageLabel = t(`common:card.language.${listing.language}`, {
    defaultValue: listing.language.toUpperCase(),
  });
  const sellerName = sellerProfile?.nickname.trim();
  const price = formatPrice(listing);
  const card = listing.card;
  const printLabel = card
    ? getCardPrintLabel({
        collectorNumber: card.collectorNumber,
        setCode: card.cardSet?.code,
      })
    : null;
  const handleQuantityChange = (quantity: number) => {
    if (cartItem && quantity > cartItem.quantity) {
      updateCartItemQuantityWithNotification(listing.id, quantity);
      return;
    }

    updateCartItemQuantity(listing.id, quantity);
  };
  const handleRemoveFromCart = () => {
    removeCartItem(listing.id);
  };

  useEffect(() => {
    if (cartItemAvailableQuantity === undefined) return;

    reconcileCartItemAvailability(listing.id, listing.quantity);
  }, [
    cartItemAvailableQuantity,
    listing.id,
    listing.quantity,
    reconcileCartItemAvailability,
  ]);

  return (
    <TableRow className="grid grid-cols-2 gap-x-4 gap-y-3 border-[#D8D3CC] border-dashed p-4 odd:bg-card even:bg-surface hover:bg-accent/30 md:table-row md:p-0">
      <TableCell className="col-span-2 p-0 whitespace-normal md:table-cell md:px-3 md:py-3">
        <span className="mb-1 block text-[10px] font-medium text-muted-foreground md:hidden">
          {t("card:binder")}
        </span>
        <div className="flex min-w-0 items-start gap-3">
          {showCardPreview && card && (
            <Link
              to={`/card/${card.id}`}
              aria-label={card.name}
              className="shrink-0"
            >
              <CardImage
                alt=""
                className="h-[70px] w-auto bg-muted shadow-sm"
                finish={getPreferredCardFinish(card.finishes)}
                imageSize="thumbnail"
                imageUrl={card.imageUrl}
                noImageLabel=""
                showBadgeFinish={false}
                scryfallId={getCardScryfallId(card)}
              />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            {binder ? (
              <Link
                to={`/binder/${binder.shortId}`}
                className="block truncate text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {binder.name}
              </Link>
            ) : (
              t("common:not_available")
            )}
            <div className="mt-1">
              {sellerProfile && sellerName ? (
                <BinderOwnerLink
                  className="text-xs text-tertiary underline hover:text-tertiary/80"
                  country={sellerProfile.country}
                  nickname={sellerName}
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t("card:unknown_seller")}
                </span>
              )}
            </div>
            {showCardPreview && printLabel && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {printLabel}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="col-span-2 p-0 whitespace-normal md:table-cell md:px-3 md:py-3">
        <span className="mb-1 block text-[10px] font-medium text-muted-foreground md:hidden">
          {t("card:information")}
        </span>
        <span className="flex items-center gap-2">
          <CardConditionBadge
            condition={listing.condition}
            className="rounded-sm py-0.5"
            showTooltip
          />
          <CountryFlag
            code={cardLanguageFlagCodes[listing.language]}
            className="aspect-[4/3] w-5"
            label={languageLabel}
            showTooltip
          />
          <CardFinishBadge finish={listing.finish} display="icon" />
        </span>
      </TableCell>
      <TableCell className="p-0 font-semibold whitespace-normal tabular-nums md:table-cell md:px-3 md:py-3">
        <span className="mb-1 block text-[10px] font-medium text-muted-foreground md:hidden">
          {t("card:price")}
        </span>
        <div className="flex justify-center">
          <span className="relative inline-flex text-center">
            <span className="text-base">{price.original}</span>
            {price.converted && (
              <span className="absolute top-full left-1/2  -translate-x-1/2 whitespace-nowrap text-sm font-normal text-muted-foreground">
                ≈ {price.converted}
              </span>
            )}
          </span>
        </div>
      </TableCell>
      <TableCell className="p-0 text-right text-sm font-medium whitespace-normal tabular-nums md:table-cell md:px-3 md:py-3">
        <span className="mb-1 block text-[10px] font-medium text-muted-foreground md:hidden">
          {t("card:availability")}
        </span>
        {listing.quantity}
      </TableCell>
      <TableCell className="col-span-2 p-0 whitespace-normal md:table-cell md:px-3 md:py-3 md:text-right">
        {cartItem ? (
          <CartQuantityControl
            availableQuantity={cartItem.availableQuantity}
            onRemove={handleRemoveFromCart}
            quantity={cartItem.quantity}
            onQuantityChange={handleQuantityChange}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-28"
            disabled={!binder || isSellerLoading || listing.quantity < 1}
            onClick={() => handleAddToCart(listing)}
          >
            {t("card:add_to_cart")}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

interface CardListingsTableProps {
  formatPrice: FormatCardListingPrice;
  isSellerLoading: boolean;
  listings: CardListingFieldsFragment[];
  sellerProfilesById: Map<string, CardListingSellerProfile>;
  showCardPreview?: boolean;
}

export const CardListingsTable = ({
  formatPrice,
  isSellerLoading,
  listings,
  sellerProfilesById,
  showCardPreview = false,
}: CardListingsTableProps) => {
  const { t } = useTranslation(["card"]);

  return (
    <div className="overflow-hidden rounded-md border border-[#D8D3CC] bg-card text-card-foreground">
      <Table className="text-sm">
        <TableHeader className="hidden bg-[#ECE9E4] md:table-header-group">
          <TableRow className="border-[#D8D3CC] hover:bg-transparent">
            <TableHead className="h-10 px-3 text-xs font-medium text-primary">
              {t("card:binder")}
            </TableHead>
            <TableHead className="h-10 px-3 text-xs font-medium text-primary">
              {t("card:information")}
            </TableHead>
            <TableHead className="h-10 px-3 text-center text-xs font-medium text-primary">
              {t("card:price")}
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-medium text-primary">
              {t("card:availability")}
            </TableHead>
            <TableHead className="h-10 px-3">
              <span className="sr-only">{t("card:add_to_cart")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.length > 0 ? (
            listings.map((listing) => (
              <CardListingRow
                key={listing.id}
                formatPrice={formatPrice}
                isSellerLoading={isSellerLoading}
                listing={listing}
                showCardPreview={showCardPreview}
                sellerProfile={
                  listing.binder
                    ? sellerProfilesById.get(listing.binder.ownerId) || null
                    : null
                }
              />
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-28 whitespace-normal px-4 text-center text-primary"
              >
                {t("card:no_listings")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
