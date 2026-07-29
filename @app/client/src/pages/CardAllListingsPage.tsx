import {
  type BinderCardsFilter,
  useCardByIdQuery,
  useCardLatestVariantByNameQuery,
} from "@app/graphql";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { CardDetailImagePreview } from "@/components/CardDetailImagePreview";
import { CardDetailTextPanel } from "@/components/CardDetailTextPanel";
import { CardListingsSection } from "@/components/CardListingsSection";
import { CardMarketPriceButtons } from "@/components/CardMarketPriceButtons";
import { CardPriceStats } from "@/components/CardPriceStats";
import { Loading } from "@/components/Loading";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/Button";
import { getPreferredCardFinish } from "@/config/card";
import { NAVBAR_CONTENT_OFFSET_CLASS_NAME } from "@/config/layout";
import { useAllCardListingPrices } from "@/hooks/useAllCardListingPrices";
import { useAllCardVariants } from "@/hooks/useAllCardVariants";
import { useCardListingFilters } from "@/hooks/useCardListingFilters";
import { useCardListingsCollection } from "@/hooks/useCardListingsCollection";
import { getMarketPriceBySourceAndFinish } from "@/lib/binderCardPricing";
import { getCardScryfallId } from "@/lib/cardImageUrl";
import type { SeoProductInput } from "@/lib/jsonLd";
import type { SeoMetadata } from "@/lib/seoMetadata";
import { cn } from "@/lib/utils";
import { NotFound } from "@/pages/NotFound";
import { supportedPriceSources } from "@/providers/PricingSettingsContext";

import { createCardAllListingsPageJsonLd } from "./CardAllListingsPage.jsonLd";

export const CardAllListingsPage = () => {
  const { t } = useTranslation(["card", "common"]);
  const { cardId = "" } = useParams();
  const { data, error, loading } = useCardByIdQuery({
    variables: { cardId },
    skip: !cardId,
  });
  const card = data?.cardsCollection?.edges[0]?.node;
  const { data: latestVariantData, loading: isLatestVariantLoading } =
    useCardLatestVariantByNameQuery({
      variables: { cardName: card?.name || "" },
      skip: !card?.name,
    });
  const baseListingFilter = useMemo<BinderCardsFilter>(
    () =>
      card?.name
        ? { cardName: { eq: card.name }, tcgId: { eq: "mtg" } }
        : { cardId: { eq: cardId } },
    [card?.name, cardId]
  );
  const listingFilters = useCardListingFilters({
    baseFilter: baseListingFilter,
  });
  const listingCollection = useCardListingsCollection({
    filter: listingFilters.filter,
    skip: !card?.name,
  });
  const listingPrices = useAllCardListingPrices({
    filter: listingFilters.filter,
    skip: !card?.name,
  });
  const variants = useAllCardVariants({ cardName: card?.name || "" });
  const variantMarketPrices = useMemo(
    () =>
      variants.variants.flatMap((variant) => {
        const marketPrices = variant.marketPrices?.edges.map(
          ({ node }) => node
        );
        const preferredFinishes = [
          getPreferredCardFinish(variant.finishes),
          "normal",
        ];

        return supportedPriceSources.flatMap((source) => {
          const marketPrice = getMarketPriceBySourceAndFinish(
            marketPrices,
            source,
            preferredFinishes
          );

          return marketPrice ? [marketPrice] : [];
        });
      }),
    [variants.variants]
  );
  const seoCanonicalPath = `/card/${encodeURIComponent(cardId)}/listings`;
  const unresolvedSeoMetadata: SeoMetadata = {
    canonicalPath: seoCanonicalPath,
    robots: "noindex,follow",
    title: t("card:seo.listings.fallback_title"),
  };

  if ((loading && !data) || (card && isLatestVariantLoading)) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center justify-center p-6",
          NAVBAR_CONTENT_OFFSET_CLASS_NAME
        )}
      >
        <Loading />
      </div>
    );
  }

  if (error && !card) {
    return (
      <div
        className={cn(
          "mx-auto w-full max-w-7xl p-4 sm:p-6 lg:px-20",
          NAVBAR_CONTENT_OFFSET_CLASS_NAME
        )}
      >
        <Seo metadata={unresolvedSeoMetadata} />
        <p className="rounded-md border border-destructive/30 bg-card p-6 text-center text-destructive">
          {t("card:load_error")}
        </p>
      </div>
    );
  }

  if (!card) return <NotFound />;

  const mostRecentCard =
    latestVariantData?.cardsCollection?.edges[0]?.node || card;
  const displayedFinish = getPreferredCardFinish(mostRecentCard.finishes);
  const seoProducts: SeoProductInput[] = variants.variants.map((variant) => ({
    collectorNumber: variant.collectorNumber,
    id: variant.id,
    imageUrl: variant.imageUrl,
    name: variant.name,
    setCode: variant.cardSet?.code,
  }));
  const seoTitle = t("card:seo.listings.title", { name: card.name });
  const seoDescription = t("card:seo.listings.description", {
    count: listingCollection.listingCount ?? 0,
    name: card.name,
  });
  const seoMetadata: SeoMetadata = {
    canonicalPath: seoCanonicalPath,
    description: seoDescription,
    jsonLd: seoProducts.length
      ? createCardAllListingsPageJsonLd({
          description: seoDescription,
          products: seoProducts,
        })
      : undefined,
    robots: "noindex,follow",
    title: seoTitle,
  };

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[96rem] px-4 pb-6 sm:px-6 lg:px-20",
        NAVBAR_CONTENT_OFFSET_CLASS_NAME
      )}
    >
      <Seo metadata={seoMetadata} />
      <div className="mt-6">
        <Button asChild variant="link" size="link">
          <Link to={`/card/${card.id}`}>
            <ArrowLeft className="size-4" />
            {t("card:back_to_card")}
          </Link>
        </Button>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(15rem,22rem)_minmax(0,1fr)] lg:gap-10">
        <aside className="mx-auto w-full max-w-sm lg:sticky lg:top-20 lg:mx-0 lg:self-start">
          <div className="flex flex-col gap-3">
            <CardDetailImagePreview
              finish={displayedFinish}
              imageAlt={mostRecentCard.name}
              imageUrl={mostRecentCard.imageUrl}
              noImageLabel={t("common:card_search.no_image")}
              scryfallId={getCardScryfallId(mostRecentCard)}
            />
            <Button
              asChild
              variant="link"
              size="link"
              className="h-auto min-w-0 whitespace-normal py-1 text-center"
            >
              <Link to={`/card/${card.id}/variants`}>
                {variants.totalCount === undefined
                  ? t("card:view_all_variants_loading")
                  : t("card:view_all_variants", {
                      count: variants.totalCount,
                    })}
              </Link>
            </Button>
            <CardMarketPriceButtons
              formatPrice={listingCollection.formatMarketPrice}
              marketPrices={mostRecentCard.marketPrices?.edges.map(
                ({ node }) => node
              )}
              preferredFinishes={[displayedFinish, "normal"]}
              showConvertedMarketPrices
            />
          </div>
        </aside>

        <main className="min-w-0">
          <header className="flex flex-col gap-4 border-b border-border pb-6">
            <CardDetailTextPanel
              card={mostRecentCard}
              detail={mostRecentCard.mtgCardDetail}
              title={card.name}
              titleAs="h1"
            />
          </header>

          <div className="pt-6">
            <CardPriceStats
              isListingPricesLoading={listingPrices.isLoading}
              isMarketLowestLoading={variants.isLoadingAll}
              listingPrices={listingPrices.prices}
              marketLowestPrices={
                variants.error || variants.loadMoreError
                  ? []
                  : variantMarketPrices
              }
              marketPrices={mostRecentCard.marketPrices?.edges.map(
                ({ node }) => node
              )}
              preferredFinishes={[displayedFinish, "normal"]}
            />
          </div>

          <CardListingsSection
            activeFilterCount={listingFilters.activeFilterCount}
            filterState={listingFilters.filterState}
            formatPrice={listingCollection.formatPrice}
            hasNextPage={listingCollection.hasNextPage}
            hasError={!!listingCollection.error}
            isLoading={listingCollection.isLoading}
            isLoadingMore={listingCollection.isLoadingMore}
            isSellerLoading={listingCollection.isSellerLoading}
            listingCount={listingCollection.listingCount}
            listings={listingCollection.listings}
            loadMoreError={listingCollection.loadMoreError}
            sellerProfilesById={listingCollection.sellerProfilesById}
            showCardPreview
            onClearFilters={listingFilters.clearFilters}
            onFilterStateChange={listingFilters.setFilterState}
            onLoadMore={listingCollection.loadMore}
          />
        </main>
      </div>
    </div>
  );
};
