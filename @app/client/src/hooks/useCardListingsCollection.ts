import {
  type BinderCardsFilter,
  BinderVisibility,
  useCardListingsQuery,
  useUserProfilesByIdsQuery,
} from "@app/graphql";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  type CardListingSellerProfile,
  type FormatCardListingPrice,
} from "@/components/CardListingsTable";
import { publicGraphqlRequestContext } from "@/lib/apollo";
import {
  type BinderCardPriceInput,
  formatBinderCardPrice,
} from "@/lib/binderCardPricing";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

const LISTINGS_PER_PAGE = 50;
const SELLER_PROFILES_PER_PAGE = 100;

interface SellerProfilePagination {
  ownerIdsKey: string;
  requestedCursors: Set<string>;
}

interface UseCardListingsCollectionParams {
  filter: BinderCardsFilter;
  skip?: boolean;
}

export const useCardListingsCollection = ({
  filter,
  skip = false,
}: UseCardListingsCollectionParams) => {
  const { i18n, t } = useTranslation(["card"]);
  const { convertAmountToLocalCurrency, currency } = usePricingSettings();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const { data, error, fetchMore, loading } = useCardListingsQuery({
    context: publicGraphqlRequestContext,
    variables: {
      after: null,
      filter,
      first: LISTINGS_PER_PAGE,
    },
    skip,
  });
  const listings = useMemo(
    () =>
      data?.binderCardsCollection?.edges
        .map(({ node }) => node)
        .filter(
          (listing) => listing.binder?.visibility === BinderVisibility.Listed
        ) || [],
    [data?.binderCardsCollection?.edges]
  );
  const ownerIds = useMemo(
    () =>
      [
        ...new Set(
          listings
            .map((listing) => listing.binder?.ownerId)
            .filter((ownerId): ownerId is string => !!ownerId)
        ),
      ].sort(),
    [listings]
  );
  const ownerIdsKey = ownerIds.join(",");
  const [sellerLoadMoreError, setSellerLoadMoreError] = useState(false);
  const sellerProfilePaginationRef = useRef<SellerProfilePagination>({
    ownerIdsKey,
    requestedCursors: new Set(),
  });

  if (sellerProfilePaginationRef.current.ownerIdsKey !== ownerIdsKey) {
    sellerProfilePaginationRef.current = {
      ownerIdsKey,
      requestedCursors: new Set(),
    };
  }

  const {
    data: sellerProfilesData,
    error: sellerProfilesError,
    fetchMore: fetchMoreSellerProfiles,
    loading: isSellerBaseLoading,
  } = useUserProfilesByIdsQuery({
    fetchPolicy: "cache-and-network",
    variables: {
      after: null,
      first: SELLER_PROFILES_PER_PAGE,
      ids: ownerIds,
    },
    skip: ownerIds.length === 0,
  });
  const sellerProfilesPageInfo =
    sellerProfilesData?.userProfilesCollection?.pageInfo;
  const sellerProfilesEndCursor = sellerProfilesPageInfo?.endCursor;
  const sellerProfilesHaveNextPage = !!sellerProfilesPageInfo?.hasNextPage;

  useEffect(() => {
    setSellerLoadMoreError(false);
  }, [ownerIdsKey]);

  useEffect(() => {
    if (
      isSellerBaseLoading ||
      !sellerProfilesHaveNextPage ||
      !sellerProfilesEndCursor ||
      sellerLoadMoreError ||
      sellerProfilesError ||
      sellerProfilePaginationRef.current.requestedCursors.has(
        sellerProfilesEndCursor
      )
    ) {
      return;
    }

    const requestedOwnerIdsKey = ownerIdsKey;
    sellerProfilePaginationRef.current.requestedCursors.add(
      sellerProfilesEndCursor
    );

    void fetchMoreSellerProfiles({
      variables: { after: sellerProfilesEndCursor },
      updateQuery: (previous, { fetchMoreResult }) => {
        if (
          sellerProfilePaginationRef.current.ownerIdsKey !==
          requestedOwnerIdsKey
        ) {
          return previous;
        }

        const previousProfiles = previous.userProfilesCollection;
        const nextProfiles = fetchMoreResult.userProfilesCollection;

        if (!previousProfiles || !nextProfiles) return previous;

        return {
          ...fetchMoreResult,
          userProfilesCollection: {
            ...nextProfiles,
            edges: [...previousProfiles.edges, ...nextProfiles.edges],
          },
        };
      },
    }).catch(() => {
      if (
        sellerProfilePaginationRef.current.ownerIdsKey === requestedOwnerIdsKey
      ) {
        setSellerLoadMoreError(true);
      }
    });
  }, [
    fetchMoreSellerProfiles,
    isSellerBaseLoading,
    ownerIdsKey,
    sellerLoadMoreError,
    sellerProfilesEndCursor,
    sellerProfilesError,
    sellerProfilesHaveNextPage,
  ]);
  const isSellerLoading =
    ownerIds.length > 0 &&
    (isSellerBaseLoading ||
      sellerProfilesHaveNextPage ||
      !!sellerProfilesError ||
      sellerLoadMoreError);
  const sellerProfilesById = useMemo(() => {
    const profiles =
      sellerProfilesData?.userProfilesCollection?.edges.map(
        ({ node }) => node
      ) || [];

    return new Map<string, CardListingSellerProfile>(
      profiles.map((profile) => [profile.id, profile])
    );
  }, [sellerProfilesData?.userProfilesCollection?.edges]);
  const formatPrice = useCallback<FormatCardListingPrice>(
    (listing) => {
      const original =
        formatBinderCardPrice({
          amount: listing.priceAmount,
          convertAmountToLocalCurrency,
          displayCurrency: currency,
          locale: i18n.language,
          shouldConvert: false,
          sourceCurrency: listing.priceCurrency,
        }) || t("card:no_price");
      const converted =
        listing.priceCurrency && listing.priceCurrency !== currency
          ? formatBinderCardPrice({
              amount: listing.priceAmount,
              convertAmountToLocalCurrency,
              displayCurrency: currency,
              locale: i18n.language,
              shouldConvert: true,
              sourceCurrency: listing.priceCurrency,
            })
          : null;

      return { converted, original };
    },
    [convertAmountToLocalCurrency, currency, i18n.language, t]
  );
  const formatMarketPrice = useCallback(
    ({ amount, shouldConvert, sourceCurrency }: BinderCardPriceInput) =>
      formatBinderCardPrice({
        amount,
        convertAmountToLocalCurrency,
        displayCurrency: currency,
        locale: i18n.language,
        shouldConvert,
        sourceCurrency,
      }) || "-",
    [convertAmountToLocalCurrency, currency, i18n.language]
  );
  const pageInfo = data?.binderCardsCollection?.pageInfo;

  const loadMore = async () => {
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setLoadMoreError(false);

    try {
      await fetchMore({
        variables: { after: pageInfo.endCursor },
        updateQuery: (previous, { fetchMoreResult }) => {
          const previousListings = previous.binderCardsCollection;
          const nextListings = fetchMoreResult.binderCardsCollection;

          if (!previousListings || !nextListings) return previous;

          return {
            ...fetchMoreResult,
            binderCardsCollection: {
              ...nextListings,
              edges: [...previousListings.edges, ...nextListings.edges],
            },
          };
        },
      });
    } catch {
      setLoadMoreError(true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    error,
    formatMarketPrice,
    formatPrice,
    hasNextPage: !!pageInfo?.hasNextPage,
    isLoading: loading && !data,
    isLoadingMore,
    isSellerLoading,
    listingCount: data?.binderCardsCollection?.totalCount || 0,
    listings,
    loadMore,
    loadMoreError,
    sellerProfilesById,
  };
};
