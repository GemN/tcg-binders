import {
  type CardVariantsByNameQuery,
  useCardVariantsByNameQuery,
} from "@app/graphql";
import { useEffect, useRef, useState } from "react";

import { publicGraphqlRequestContext } from "@/lib/apollo";

const VARIANTS_PER_PAGE = 100;

export type CardVariant = NonNullable<
  CardVariantsByNameQuery["cardsCollection"]
>["edges"][number]["node"];

interface UseAllCardVariantsParams {
  cardName: string;
}

export const useAllCardVariants = ({ cardName }: UseAllCardVariantsParams) => {
  const [loadMoreError, setLoadMoreError] = useState(false);
  const requestedCursorsRef = useRef(new Set<string>());
  const { data, error, fetchMore, loading } = useCardVariantsByNameQuery({
    context: publicGraphqlRequestContext,
    variables: {
      after: null,
      cardName,
      first: VARIANTS_PER_PAGE,
    },
    skip: !cardName,
  });
  const collection = data?.cardsCollection;
  const endCursor = collection?.pageInfo.endCursor;
  const hasNextPage = !!collection?.pageInfo.hasNextPage;

  useEffect(() => {
    requestedCursorsRef.current.clear();
    setLoadMoreError(false);
  }, [cardName]);

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
        const previousVariants = previous.cardsCollection;
        const nextVariants = fetchMoreResult.cardsCollection;

        if (!previousVariants || !nextVariants) return previous;

        return {
          ...fetchMoreResult,
          cardsCollection: {
            ...nextVariants,
            edges: [...previousVariants.edges, ...nextVariants.edges],
          },
        };
      },
    }).catch(() => setLoadMoreError(true));
  }, [endCursor, fetchMore, hasNextPage, loadMoreError]);

  return {
    error,
    isLoading: loading && !data,
    isLoadingAll: loading || (hasNextPage && !loadMoreError),
    loadMoreError,
    totalCount: collection?.totalCount,
    variants: collection?.edges.map(({ node }) => node) || [],
  };
};
