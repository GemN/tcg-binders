import {
  type BinderCardsOrderBy,
  useBinderCardDetailWindowQuery,
} from "@app/graphql";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  BinderCardDetailRecord,
  BinderCardRecord,
} from "@/lib/binderCardPricing";
import {
  DETAIL_WINDOW_BEFORE_COUNT,
  DETAIL_WINDOW_CARD_COUNT,
} from "@/lib/binderPage";

interface UseBinderCardDetailNavigationParams {
  binderCards: BinderCardRecord[];
  cardOffset: number;
  cardOrderBy: BinderCardsOrderBy[];
  shortId: string;
  totalBinderCards: number;
}

export const useBinderCardDetailNavigation = ({
  binderCards,
  cardOffset,
  cardOrderBy,
  shortId,
  totalBinderCards,
}: UseBinderCardDetailNavigationParams) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );
  const [selectedBinderCard, setSelectedBinderCard] = useState<
    BinderCardRecord | BinderCardDetailRecord | null
  >(null);
  const detailCardOffset =
    selectedCardIndex === null
      ? 0
      : Math.max(selectedCardIndex - DETAIL_WINDOW_BEFORE_COUNT, 0);
  const { data: detailData, loading: isDetailLoading } =
    useBinderCardDetailWindowQuery({
      variables: {
        shortId,
        cardFirst: DETAIL_WINDOW_CARD_COUNT,
        cardOffset: detailCardOffset,
        cardOrderBy,
      },
      skip: !shortId || selectedCardIndex === null,
      notifyOnNetworkStatusChange: true,
      returnPartialData: true,
    });
  const detailBinderCards = useMemo(() => {
    return (
      detailData?.binderCardsByShortId?.edges
        .map(({ node }) => node)
        .filter((binderCard) => !!binderCard.card) || []
    );
  }, [detailData?.binderCardsByShortId?.edges]);
  const canGoPreviousDetailCard =
    selectedCardIndex !== null && selectedCardIndex > 0;
  const canGoNextDetailCard =
    selectedCardIndex !== null && selectedCardIndex + 1 < totalBinderCards;

  useEffect(() => {
    if (selectedCardIndex === null || isDetailLoading) return;

    const detailWindowIndex = selectedCardIndex - detailCardOffset;
    const nextSelectedBinderCard = detailBinderCards[detailWindowIndex];
    if (nextSelectedBinderCard) {
      setSelectedBinderCard(nextSelectedBinderCard);
    }
  }, [detailBinderCards, detailCardOffset, isDetailLoading, selectedCardIndex]);

  const clearSelectedBinderCard = useCallback(() => {
    setSelectedCardIndex(null);
    setSelectedBinderCard(null);
  }, []);

  const getLoadedBinderCardByIndex = useCallback(
    (
      nextCardIndex: number
    ): BinderCardRecord | BinderCardDetailRecord | null => {
      const detailWindowIndex = nextCardIndex - detailCardOffset;
      if (
        detailWindowIndex >= 0 &&
        detailWindowIndex < detailBinderCards.length
      ) {
        return detailBinderCards[detailWindowIndex];
      }

      const pageWindowIndex = nextCardIndex - cardOffset;
      if (pageWindowIndex >= 0 && pageWindowIndex < binderCards.length) {
        return binderCards[pageWindowIndex];
      }

      return null;
    },
    [binderCards, cardOffset, detailBinderCards, detailCardOffset]
  );

  const openBinderCard = useCallback(
    (binderCard: BinderCardRecord, index: number) => {
      setSelectedCardIndex(cardOffset + index);
      setSelectedBinderCard(binderCard);
    },
    [cardOffset]
  );

  const goToDetailCard = useCallback(
    (nextCardIndex: number) => {
      if (nextCardIndex < 0 || nextCardIndex >= totalBinderCards) return;

      setSelectedCardIndex(nextCardIndex);
      setSelectedBinderCard(getLoadedBinderCardByIndex(nextCardIndex));
    },
    [getLoadedBinderCardByIndex, totalBinderCards]
  );

  const goToNextDetailCard = useCallback(() => {
    if (selectedCardIndex === null) return;
    goToDetailCard(selectedCardIndex + 1);
  }, [goToDetailCard, selectedCardIndex]);

  const goToPreviousDetailCard = useCallback(() => {
    if (selectedCardIndex === null) return;
    goToDetailCard(selectedCardIndex - 1);
  }, [goToDetailCard, selectedCardIndex]);

  return {
    canGoNextDetailCard,
    canGoPreviousDetailCard,
    clearSelectedBinderCard,
    goToNextDetailCard,
    goToPreviousDetailCard,
    isDetailLoading,
    openBinderCard,
    selectedBinderCard,
    selectedCardIndex,
    setSelectedBinderCard,
  };
};
