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
import { cn } from "@/lib/utils";
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
  const hasCardPreview = showCardPreview && !!card;
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
    <TableRow
      className={cn(
        "grid border border-[#D8D3CC] border-dashed bg-white p-4 last:!border hover:bg-white md:table-row md:border-x-0 md:border-t-0 md:border-b md:p-0 md:last:!border-0 md:odd:bg-card md:even:bg-surface md:hover:bg-accent/30",
        hasCardPreview
          ? "grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-2"
          : "grid-cols-2 gap-x-4 gap-y-3"
      )}
    >
      {hasCardPreview && (
        <TableCell className="col-span-3 flex min-w-0 items-baseline gap-2 p-0 whitespace-normal md:hidden">
          {printLabel && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {printLabel}
            </span>
          )}
          <Link
            to={`/card/${card.id}`}
            className="truncate text-sm font-normal text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {card.name}
          </Link>
        </TableCell>
      )}
      <TableCell
        className={cn(
          "p-0 whitespace-normal md:table-cell md:px-3 md:py-3",
          hasCardPreview && "contents"
        )}
      >
        <div
          className={cn(
            "min-w-0 items-start gap-3 md:flex",
            hasCardPreview ? "contents" : "flex"
          )}
        >
          {hasCardPreview && (
            <Link
              to={`/card/${card.id}`}
              aria-label={card.name}
              className="col-start-1 row-span-2 row-start-2 shrink-0 self-start"
            >
              <CardImage
                alt=""
                className="h-20 w-auto bg-muted shadow-sm md:h-[70px]"
                finish={getPreferredCardFinish(card.finishes)}
                imageSize="thumbnail"
                imageUrl={card.imageUrl}
                noImageLabel=""
                showBadgeFinish={false}
                scryfallId={getCardScryfallId(card)}
              />
            </Link>
          )}
          <div
            className={cn(
              "min-w-0 flex-1",
              hasCardPreview && "col-start-2 row-start-2"
            )}
          >
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
              <p className="mt-0.5 hidden text-sm text-muted-foreground md:block">
                {printLabel}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell
        className={cn(
          "p-0 whitespace-normal md:table-cell md:px-3 md:py-3",
          hasCardPreview && "col-start-3 row-start-2"
        )}
      >
        <span className="flex items-center justify-end gap-2 md:justify-start">
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
      <TableCell
        className={cn(
          "p-0 font-semibold whitespace-normal tabular-nums md:table-cell md:px-3 md:py-3",
          hasCardPreview && "col-start-2 row-start-3 min-w-0"
        )}
      >
        <div className="flex min-w-0 justify-start md:justify-center">
          <span
            className={cn(
              "relative inline-flex items-baseline gap-2 text-left md:text-center",
              hasCardPreview &&
                "min-w-0 max-w-full flex-wrap gap-y-0 md:flex-nowrap"
            )}
          >
            <span
              className={cn(
                "text-base",
                hasCardPreview && "whitespace-nowrap"
              )}
            >
              {price.original}
            </span>
            {price.converted && (
              <span className="whitespace-nowrap text-sm font-normal text-muted-foreground md:absolute md:top-full md:left-1/2 md:-translate-x-1/2">
                ≈ {price.converted}
              </span>
            )}
          </span>
        </div>
      </TableCell>
      <TableCell
        className={cn(
          "p-0 text-right text-sm font-medium whitespace-normal tabular-nums md:table-cell md:px-3 md:py-3",
          hasCardPreview && "col-start-3 row-start-3 whitespace-nowrap"
        )}
      >
        <span className="text-xs font-normal text-secondary md:hidden">
          {t("card:variant_available", { count: listing.quantity })}
        </span>
        <span className="hidden md:inline">{listing.quantity}</span>
      </TableCell>
      <TableCell
        className={cn(
          "p-0 whitespace-normal [&>div]:w-full md:table-cell md:px-3 md:py-3 md:text-right md:[&>div]:w-28",
          hasCardPreview ? "col-span-3" : "col-span-2"
        )}
      >
        {cartItem ? (
          <CartQuantityControl
            availableQuantity={cartItem.availableQuantity}
            itemName={card?.name ?? t("common:not_available")}
            onRemove={handleRemoveFromCart}
            quantity={cartItem.quantity}
            onQuantityChange={handleQuantityChange}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full md:w-28"
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
    <div
      className={cn(
        "overflow-hidden bg-transparent text-card-foreground md:bg-card",
        listings.length === 0
          ? "rounded-md border border-[#D8D3CC]"
          : "md:rounded-md md:border md:border-[#D8D3CC]"
      )}
    >
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
        <TableBody
          className={listings.length > 0 ? "grid gap-4 md:table-row-group" : ""}
        >
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
