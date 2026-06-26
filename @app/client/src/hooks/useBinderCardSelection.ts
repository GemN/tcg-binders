import { useCallback, useMemo, useState } from "react";

import type { BinderCardRecord } from "@/lib/binderCardPricing";

export const useBinderCardSelection = () => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedBinderCardsById, setSelectedBinderCardsById] = useState<
    Map<string, BinderCardRecord>
  >(() => new Map());

  const selectedBinderCards = useMemo(
    () => Array.from(selectedBinderCardsById.values()),
    [selectedBinderCardsById]
  );
  const selectedBinderCardIds = useMemo(
    () => new Set(selectedBinderCardsById.keys()),
    [selectedBinderCardsById]
  );

  const clearCardSelection = useCallback(() => {
    setSelectedBinderCardsById(new Map());
  }, []);

  const handleSelectionModeChange = useCallback(
    (nextIsSelectionMode: boolean) => {
      setIsSelectionMode(nextIsSelectionMode);
      clearCardSelection();
    },
    [clearCardSelection]
  );

  const resetCardSelection = useCallback(() => {
    setIsSelectionMode(false);
    clearCardSelection();
  }, [clearCardSelection]);

  const handleToggleCardSelection = useCallback(
    (binderCard: BinderCardRecord) => {
      setSelectedBinderCardsById((currentSelectedBinderCardsById) => {
        const nextSelectedBinderCardsById = new Map(
          currentSelectedBinderCardsById
        );

        if (nextSelectedBinderCardsById.has(binderCard.id)) {
          nextSelectedBinderCardsById.delete(binderCard.id);
        } else {
          nextSelectedBinderCardsById.set(binderCard.id, binderCard);
        }

        return nextSelectedBinderCardsById;
      });
    },
    []
  );

  const handleSelectBinderCards = useCallback(
    (binderCards: BinderCardRecord[]) => {
      setSelectedBinderCardsById((currentSelectedBinderCardsById) => {
        const nextSelectedBinderCardsById = new Map(
          currentSelectedBinderCardsById
        );

        binderCards.forEach((binderCard) => {
          nextSelectedBinderCardsById.set(binderCard.id, binderCard);
        });

        return nextSelectedBinderCardsById;
      });
    },
    []
  );

  const removeSelectedBinderCard = useCallback((binderCardId: string) => {
    setSelectedBinderCardsById((currentSelectedBinderCardsById) => {
      if (!currentSelectedBinderCardsById.has(binderCardId)) {
        return currentSelectedBinderCardsById;
      }

      const nextSelectedBinderCardsById = new Map(
        currentSelectedBinderCardsById
      );
      nextSelectedBinderCardsById.delete(binderCardId);
      return nextSelectedBinderCardsById;
    });
  }, []);

  return {
    clearCardSelection,
    handleSelectBinderCards,
    handleSelectionModeChange,
    handleToggleCardSelection,
    isSelectionMode,
    removeSelectedBinderCard,
    resetCardSelection,
    selectedBinderCardCount: selectedBinderCards.length,
    selectedBinderCardIds,
    selectedBinderCards,
  };
};
