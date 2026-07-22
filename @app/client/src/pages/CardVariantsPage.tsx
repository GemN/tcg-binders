import { useCardByIdQuery, useCardListingCountByNameQuery } from "@app/graphql";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { CardImage } from "@/components/CardImage";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { getPreferredCardFinish } from "@/config/card";
import {
  type CardVariant,
  useAllCardVariants,
} from "@/hooks/useAllCardVariants";
import { publicGraphqlRequestContext } from "@/lib/apollo";
import { getLowestConvertedBinderCardPrice } from "@/lib/binderCardPricing";
import { getCardScryfallId } from "@/lib/cardImageUrl";
import { formatCurrency } from "@/lib/currency";
import { NotFound } from "@/pages/NotFound";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

interface CardVariantTileProps {
  listingCountLabel: string;
  lowestPriceLabel: string | null;
  noImageLabel: string;
  variant: CardVariant;
}

const CardVariantTile = ({
  listingCountLabel,
  lowestPriceLabel,
  noImageLabel,
  variant,
}: CardVariantTileProps) => (
  <Link
    to={`/card/${variant.id}`}
    className="group/card-image min-w-0 focus-visible:outline-none"
  >
    <CardImage
      alt={variant.name}
      className="w-full border border-border bg-muted shadow-sm outline outline-4 outline-offset-0 outline-transparent transition-[outline-color] group-hover/card-image:outline-primary/70 group-focus-within/card-image:outline-primary"
      finish={getPreferredCardFinish(variant.finishes)}
      imageSize="grid"
      imageUrl={variant.imageUrl}
      noImageLabel={noImageLabel}
      scryfallId={getCardScryfallId(variant)}
    />
    <div className="mt-2 min-w-0">
      {variant.cardSet?.name && (
        <p className="line-clamp-2 text-sm font-medium">
          {variant.cardSet.name}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className="text-xs text-muted-foreground">
          {listingCountLabel}
        </span>
        {lowestPriceLabel && (
          <span className="text-sm font-semibold tabular-nums">
            {lowestPriceLabel}
          </span>
        )}
      </div>
    </div>
  </Link>
);

export const CardVariantsPage = () => {
  const { i18n, t } = useTranslation(["card", "common"]);
  const { convertAmountToLocalCurrency, currency } = usePricingSettings();
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const { cardId = "" } = useParams();
  const { data, error, loading } = useCardByIdQuery({
    variables: { cardId },
    skip: !cardId,
  });
  const card = data?.cardsCollection?.edges[0]?.node;
  const variants = useAllCardVariants({ cardName: card?.name || "" });
  const { data: listingCountData, loading: isListingCountLoading } =
    useCardListingCountByNameQuery({
      context: publicGraphqlRequestContext,
      variables: { cardName: card?.name || "" },
      skip: !card?.name,
    });
  const listingCount = listingCountData?.binderCardsCollection?.totalCount;
  const displayedVariants = showOnlyAvailable
    ? variants.variants.filter(
        (variant) => (variant.publicBinderCards?.totalCount || 0) > 0
      )
    : variants.variants;

  if ((loading && !data) || (card && variants.isLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loading />
      </div>
    );
  }

  if (error && !card) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:px-20">
        <p className="rounded-md border border-destructive/30 bg-card p-6 text-center text-destructive">
          {t("card:variants_load_error")}
        </p>
      </div>
    );
  }

  if (!card) return <NotFound />;

  return (
    <div className="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 lg:px-20 lg:py-10">
      <Button asChild variant="link" size="link">
        <Link to={`/card/${card.id}`}>
          <ArrowLeft className="size-4" />
          {t("card:back_to_card")}
        </Link>
      </Button>

      <header className="mt-5 border-b border-border pb-6">
        <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
          {t("card:variants_title", { name: card.name })}
        </h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {variants.totalCount !== undefined && (
              <p className="text-sm text-muted-foreground">
                {t("card:variant_count", { count: variants.totalCount })}
              </p>
            )}
            <Button asChild variant="link" size="link">
              <Link to={`/card/${card.id}/listings`}>
                {isListingCountLoading || listingCount === undefined
                  ? t("card:view_all_listings_loading")
                  : t("card:view_all_listings", { count: listingCount })}
              </Link>
            </Button>
          </div>
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm">
            <Switch
              checked={showOnlyAvailable}
              onCheckedChange={setShowOnlyAvailable}
              aria-label={t("card:show_only_available")}
            />
            <span>{t("card:show_only_available")}</span>
          </label>
        </div>
      </header>

      {displayedVariants.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {displayedVariants.map((variant) => {
            const lowestConvertedPrice = getLowestConvertedBinderCardPrice(
              [
                variant.lowestUsdBinderCards?.edges[0]?.node,
                variant.lowestThbBinderCards?.edges[0]?.node,
                variant.lowestEurBinderCards?.edges[0]?.node,
                variant.lowestGbpBinderCards?.edges[0]?.node,
                variant.lowestJpyBinderCards?.edges[0]?.node,
              ],
              convertAmountToLocalCurrency
            );
            const lowestPrice =
              lowestConvertedPrice === null
                ? null
                : formatCurrency(lowestConvertedPrice, currency, i18n.language);

            return (
              <CardVariantTile
                key={variant.id}
                listingCountLabel={t("card:variant_available", {
                  count: variant.publicBinderCards?.totalCount || 0,
                })}
                lowestPriceLabel={
                  lowestPrice
                    ? t("card:from_price", { price: lowestPrice })
                    : null
                }
                noImageLabel={t("common:card_search.no_image")}
                variant={variant}
              />
            );
          })}
        </div>
      )}

      {variants.isLoadingAll && (
        <div className="mt-8 flex justify-center">
          <Loading />
        </div>
      )}
      {(variants.error || variants.loadMoreError) && (
        <p className="mt-6 rounded-md border border-destructive/30 bg-card p-4 text-center text-sm text-destructive">
          {t("card:variants_load_error")}
        </p>
      )}
    </div>
  );
};
