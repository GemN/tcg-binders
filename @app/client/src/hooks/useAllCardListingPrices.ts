import {
  type BinderCardsFilter,
  type CardListingPricesQuery,
  useCardListingPricesQuery,
} from "@app/graphql";
import { useEffect, useRef, useState } from "react";

import { publicGraphqlRequestContext } from "@/lib/apollo";

const LISTING_PRICES_PER_PAGE = 250;

export type CardListingPrice = NonNullable<
  CardListingPricesQuery["binderCardsCollection"]
>["edges"][number]["node"];

interface UseAllCardListingPricesParams {
  filter: BinderCardsFilter;
  skip?: boolean;
}

export const useAllCardListingPrices = ({
  filter,
  skip = false,
}: UseAllCardListingPricesParams) => {
  const [loadMoreError, setLoadMoreError] = useState(false);
  const requestedCursorsRef = useRef(new Set<string>());
  const { data, error, fetchMore, loading } = useCardListingPricesQuery({
    context: publicGraphqlRequestContext,
    variables: {
      after: null,
      filter,
      first: LISTING_PRICES_PER_PAGE,
    },
    skip,
  });
  const collection = data?.binderCardsCollection;
  const endCursor = collection?.pageInfo.endCursor;
  const hasNextPage = !!collection?.pageInfo.hasNextPage;

  useEffect(() => {
    requestedCursorsRef.current.clear();
    setLoadMoreError(false);
  }, [filter]);

  useEffect(() => {
    if (
      !hasNextPage ||
      !endCursor ||
      loadMoreError ||
      requestedCursorsRef.current.has(endCursor)
    ) {
      return;
    }

    requestedCursorsRef.current.add(endCursor);

    void fetchMore({
      variables: { after: endCursor },
      updateQuery: (previous, { fetchMoreResult }) => {
        const previousPrices = previous.binderCardsCollection;
        const nextPrices = fetchMoreResult.binderCardsCollection;

        if (!previousPrices || !nextPrices) return previous;

        return {
          ...fetchMoreResult,
          binderCardsCollection: {
            ...nextPrices,
            edges: [...previousPrices.edges, ...nextPrices.edges],
          },
        };
      },
    }).catch(() => setLoadMoreError(true));
  }, [endCursor, fetchMore, hasNextPage, loadMoreError]);

  return {
    error,
    isLoading: loading || (hasNextPage && !loadMoreError),
    loadMoreError,
    prices:
      error || loadMoreError
        ? []
        : collection?.edges.map(({ node }) => node) || [],
  };
};
