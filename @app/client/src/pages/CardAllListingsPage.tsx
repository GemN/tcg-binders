import {
  type BinderCardsFilter,
  useCardByIdQuery,
  useCardLatestVariantByNameQuery,
} from "@app/graphql";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { CardDetailImagePreview } from "@/components/CardDetailImagePreview";
import { CardDetailTextPanel } from "@/components/CardDetailTextPanel";
import { CardListingsSection } from "@/components/CardListingsSection";
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
  const { i18n, t } = useTranslation(["card", "common"]);
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
    filter: baseListingFilter,
    skip: !card?.name,
  });
  const sellerCount = useMemo(
    () =>
      new Set(
        listingPrices.prices
          .map((listing) => listing.binder?.ownerId)
          .filter((ownerId): ownerId is string => !!ownerId)
      ).size,
    [listingPrices.prices]
  );
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
        "mx-auto w-full max-w-[1720px] px-4 pb-6 sm:px-6 lg:px-[60px]",
        NAVBAR_CONTENT_OFFSET_CLASS_NAME
      )}
    >
      <Seo metadata={seoMetadata} />
      <div className="pt-6 lg:pt-10">
        <nav aria-label={t("card:all_listings_page.breadcrumb_label")}>
          <ol className="flex min-w-0 items-center gap-2 text-sm">
            <li className="min-w-0">
              <Link
                to={`/card/${card.id}`}
                className="block truncate text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {card.name}
              </Link>
            </li>
            <li aria-hidden="true" className="shrink-0 text-muted-foreground">
              <ChevronRight className="size-4" />
            </li>
            <li
              aria-current="page"
              className="shrink-0 text-error underline underline-offset-4"
            >
              {t("card:all_listings_page.breadcrumb")}
            </li>
          </ol>
        </nav>

        <div className="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="mx-auto w-full min-w-0 max-w-[240px] lg:mx-0">
            <div className="flex flex-col gap-4">
              <div className="mx-auto w-full max-w-[240px]">
                <CardDetailImagePreview
                  finish={displayedFinish}
                  imageAlt={mostRecentCard.name}
                  imageUrl={mostRecentCard.imageUrl}
                  noImageLabel={t("common:card_search.no_image")}
                  scryfallId={getCardScryfallId(mostRecentCard)}
                />
              </div>
              <Button
                asChild
                variant="link"
                size="link"
                className="h-auto min-w-0 whitespace-normal py-1 text-center"
              >
                <Link to={`/card/${card.id}/printings`}>
                  {variants.totalCount === undefined
                    ? t("card:view_all_variants_loading")
                    : t("card:view_all_variants", {
                        count: variants.totalCount,
                      })}
                </Link>
              </Button>
            </div>
          </aside>

          <main className="min-w-0">
            <header>
              <CardDetailTextPanel
                card={mostRecentCard}
                detail={mostRecentCard.mtgCardDetail}
                title={card.name}
                titleAs="h1"
              />
            </header>

            <div className="max-w-[760px] pt-6 lg:pt-10">
              <CardPriceStats
                isListingPricesLoading={listingPrices.isLoading}
                isMarketLowestLoading={variants.isLoadingAll}
                leadingStat={{
                  description:
                    listingPrices.error || listingPrices.loadMoreError
                      ? null
                      : t("card:all_listings_page.seller_count", {
                          count: sellerCount,
                        }),
                  isLoading: listingPrices.isLoading,
                  title: t("card:all_listings_page.total_listings"),
                  value:
                    listingPrices.totalCount === undefined
                      ? null
                      : listingPrices.totalCount.toLocaleString(i18n.language),
                }}
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
          </main>
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
      </div>
    </div>
  );
};
