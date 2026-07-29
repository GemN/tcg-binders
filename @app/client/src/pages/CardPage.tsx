import {
  type BinderCardsFilter,
  useCardByIdQuery,
  useCardListingCountByNameQuery,
  useCardVariantCountByNameQuery,
} from "@app/graphql";
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
import { useAllCardListingPrices } from "@/hooks/useAllCardListingPrices";
import { useCardListingFilters } from "@/hooks/useCardListingFilters";
import { useCardListingsCollection } from "@/hooks/useCardListingsCollection";
import { publicGraphqlRequestContext } from "@/lib/apollo";
import { getCardScryfallId } from "@/lib/cardImageUrl";
import {
  getCardPrintLabel,
  isSeoQueryResolved,
} from "@/lib/seoMetadata";
import { NotFound } from "@/pages/NotFound";

import {
  type CardSeoProduct,
  createCardSeoMetadata,
} from "./CardPage.seo";

export const CardPage = () => {
  const { t } = useTranslation(["card", "common"]);
  const { cardId = "" } = useParams();
  const { data, error, loading } = useCardByIdQuery({
    variables: { cardId },
    skip: !cardId,
  });
  const card = data?.cardsCollection?.edges[0]?.node;
  const baseListingFilter = useMemo<BinderCardsFilter>(
    () => ({ cardId: { eq: cardId } }),
    [cardId]
  );
  const listingFilters = useCardListingFilters({
    baseFilter: baseListingFilter,
  });
  const listingCollection = useCardListingsCollection({
    filter: listingFilters.filter,
    skip: !cardId,
  });
  const listingPrices = useAllCardListingPrices({
    filter: listingFilters.filter,
    skip: !cardId,
  });
  const { data: variantCountData, loading: isVariantCountLoading } =
    useCardVariantCountByNameQuery({
      fetchPolicy: "cache-and-network",
      variables: { cardName: card?.name || "" },
      skip: !card?.name,
    });
  const { data: familyListingCountData, loading: isFamilyListingCountLoading } =
    useCardListingCountByNameQuery({
      context: publicGraphqlRequestContext,
      variables: { cardName: card?.name || "" },
      skip: !card?.name,
    });
  const seoCard: CardSeoProduct | undefined = card
    ? {
        collectorNumber: card.collectorNumber,
        id: card.id,
        imageUrl: card.imageUrl,
        name: card.name,
        setCode: card.cardSet?.code,
        setName: card.cardSet?.name,
      }
    : undefined;
  const isCardQueryResolved = isSeoQueryResolved({
    hasError: !!error,
    hasResponse: !!data,
    isLoading: loading,
  });
  const seoCanonicalPath = `/card/${encodeURIComponent(cardId)}`;
  const seoPrintLabel = seoCard ? getCardPrintLabel(seoCard) : null;
  const seoShortTitle = seoCard
    ? t("card:seo.detail.short_title", { name: seoCard.name })
    : t("card:seo.detail.fallback_title");
  const seoFullTitle =
    seoCard && seoPrintLabel
      ? t("card:seo.detail.title", {
          name: seoCard.name,
          print: seoPrintLabel,
        })
      : seoShortTitle;
  const seoDescription = seoCard
    ? seoCard.setName && seoPrintLabel
      ? t("card:seo.detail.description", {
          name: seoCard.name,
          print: seoPrintLabel,
          set: seoCard.setName,
        })
      : t("card:seo.detail.fallback_description", {
          name: seoCard.name,
        })
    : undefined;
  const seoMetadata = createCardSeoMetadata({
    canonicalPath: seoCanonicalPath,
    content: {
      description: seoDescription,
      notFoundTitle: t("common:seo.not_found.title"),
      shortTitle: seoShortTitle,
      title: seoFullTitle,
    },
    isResolved: isCardQueryResolved,
    product: seoCard,
  });

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loading />
      </div>
    );
  }

  if (error && !card) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:px-20">
        <Seo metadata={seoMetadata} />
        <p className="rounded-md border border-destructive/30 bg-card p-6 text-center text-destructive">
          {t("card:load_error")}
        </p>
      </div>
    );
  }

  if (!card) {
    return <NotFound metadata={seoMetadata} />;
  }

  const displayedFinish = getPreferredCardFinish(card.finishes);
  const variantCount = variantCountData?.cardsCollection?.totalCount;
  const familyListingCount =
    familyListingCountData?.binderCardsCollection?.totalCount;

  return (
    <div className="mx-auto grid w-full max-w-[96rem] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(15rem,22rem)_minmax(0,1fr)] lg:gap-10 lg:px-20 lg:py-10">
      <Seo metadata={seoMetadata} />
      <aside className="mx-auto w-full max-w-sm lg:mx-0">
        <div className="flex flex-col gap-3 lg:sticky lg:top-20">
          <CardDetailImagePreview
            finish={displayedFinish}
            imageAlt={card.name}
            imageUrl={card.imageUrl}
            noImageLabel={t("common:card_search.no_image")}
            scryfallId={getCardScryfallId(card)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              asChild
              variant="link"
              size="link"
              className="h-auto min-w-0 whitespace-normal py-1 text-center"
            >
              <Link to={`/card/${card.id}/variants`}>
                {isVariantCountLoading || variantCount === undefined
                  ? t("card:view_all_variants_loading")
                  : t("card:view_all_variants", {
                      count: variantCount,
                    })}
              </Link>
            </Button>
            <Button
              asChild
              variant="link"
              size="link"
              className="h-auto min-w-0 whitespace-normal py-1 text-center"
            >
              <Link to={`/card/${card.id}/listings`}>
                {isFamilyListingCountLoading || familyListingCount === undefined
                  ? t("card:view_all_listings_loading")
                  : t("card:view_all_listings", {
                      count: familyListingCount,
                    })}
              </Link>
            </Button>
          </div>
          <CardMarketPriceButtons
            formatPrice={listingCollection.formatMarketPrice}
            marketPrices={card.marketPrices?.edges.map(({ node }) => node)}
            preferredFinishes={[displayedFinish, "normal"]}
            showConvertedMarketPrices
          />
        </div>
      </aside>

      <main className="min-w-0">
        <header className="flex flex-col gap-4 border-b border-border pb-6">
          <CardDetailTextPanel
            card={card}
            detail={card.mtgCardDetail}
            title={card.name}
            titleAs="h1"
          />
        </header>

        <div className="pt-6">
          <CardPriceStats
            isListingPricesLoading={listingPrices.isLoading}
            listingPrices={listingPrices.prices}
            marketPrices={card.marketPrices?.edges.map(({ node }) => node)}
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
          onClearFilters={listingFilters.clearFilters}
          onFilterStateChange={listingFilters.setFilterState}
          onLoadMore={listingCollection.loadMore}
        />
      </main>
    </div>
  );
};
