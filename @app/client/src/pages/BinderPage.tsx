import { NetworkStatus } from "@apollo/client";
import {
  useAddBinderCardMutation,
  useBinderByShortIdQuery,
  useDeleteBinderCardMutation,
} from "@app/graphql";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { toast } from "sonner";

import type { BinderCardViewMode } from "@/components/BinderCard";
import { BinderCardViewPanel } from "@/components/BinderCardViewPanel";
import { BinderPageControls } from "@/components/BinderPageControls";
import { BinderPageHeader } from "@/components/BinderPageHeader";
import { Loading } from "@/components/Loading";
import { ModalBinderCardDetail } from "@/components/ModalBinderCardDetail";
import { ModalBulkBinderCardPrice } from "@/components/ModalBulkBinderCardPrice";
import { useBinderCardDetailNavigation } from "@/hooks/useBinderCardDetailNavigation";
import { useBinderCardSelection } from "@/hooks/useBinderCardSelection";
import type { DraftCardSnapshot } from "@/hooks/useDraftBinder";
import { useIsMobile } from "@/hooks/useMobile";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import {
  type BinderSortMode,
  getBinderCardOrderBy,
  getBinderCardsPerPage,
  getDefaultFinish,
  MOBILE_CARD_LIMIT,
  PRELOAD_PAGE_COUNT,
} from "@/lib/binderPage";
import { handleError } from "@/lib/error";
import { NotFound } from "@/pages/NotFound";
import { useSession } from "@/providers/SessionContext";

export const BinderPage = () => {
  const { t } = useTranslation(["binder", "common"]);
  const { session } = useSession();
  const { shortId = "" } = useParams();
  const isMobile = useIsMobile();
  const [sortMode, setSortMode] = useState<BinderSortMode>("seller_order");
  const [viewMode, setViewMode] = useState<BinderCardViewMode>("grid");
  const [showConvertedMarketPrices, setShowConvertedMarketPrices] =
    useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [isDeletingSelectedBinderCards, setIsDeletingSelectedBinderCards] =
    useState(false);
  const cardsPerPage = getBinderCardsPerPage(viewMode);
  const cardOffset = isMobile ? 0 : pageIndex * cardsPerPage;
  const cardFirst = isMobile
    ? MOBILE_CARD_LIMIT
    : (PRELOAD_PAGE_COUNT + 1) * cardsPerPage;
  const cardOrderBy = useMemo(() => getBinderCardOrderBy(sortMode), [sortMode]);
  const { data, loading, networkStatus, refetch } = useBinderByShortIdQuery({
    variables: { shortId, cardFirst, cardOffset, cardOrderBy },
    skip: !shortId,
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  });
  const [addBinderCard, { loading: isAddingCard }] = useAddBinderCardMutation();
  const [deleteBinderCard, { loading: isDeletingCard }] =
    useDeleteBinderCardMutation();

  const binder = data?.binderByShortId;
  const binderCards = useMemo(() => {
    return (
      data?.binderCardsByShortId?.edges
        .map(({ node }) => node)
        .filter((binderCard) => !!binderCard.card) || []
    );
  }, [data?.binderCardsByShortId?.edges]);
  const visibleBinderCards = isMobile
    ? binderCards
    : binderCards.slice(0, cardsPerPage);
  const totalBinderCards = data?.binderCardCountByShortId ?? binderCards.length;
  const totalPages = Math.max(Math.ceil(totalBinderCards / cardsPerPage), 1);
  const canTurnPreviousPage = !isMobile && pageIndex > 0;
  const canTurnNextPage = !isMobile && pageIndex + 1 < totalPages;
  const isPageLoading =
    !isMobile && networkStatus === NetworkStatus.setVariables;
  const {
    clearCardSelection,
    handleSelectBinderCards,
    handleSelectionModeChange: setCardSelectionMode,
    handleToggleCardSelection,
    isSelectionMode,
    removeSelectedBinderCard,
    resetCardSelection,
    selectedBinderCardCount,
    selectedBinderCardIds,
    selectedBinderCards,
  } = useBinderCardSelection();
  const {
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
  } = useBinderCardDetailNavigation({
    binderCards,
    cardOffset,
    cardOrderBy,
    shortId,
    totalBinderCards,
  });

  useEffect(() => {
    setPageIndex(0);
    clearSelectedBinderCard();
    resetCardSelection();
  }, [clearSelectedBinderCard, isMobile, resetCardSelection, shortId]);

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!binder) {
    return <NotFound />;
  }

  const isOwner = !!session?.user.id && session.user.id === binder.ownerId;

  const handleAddCard = async (card: DraftCardSnapshot) => {
    try {
      await addBinderCard({
        variables: {
          binderId: binder.id,
          cardId: card.id,
          finish: getDefaultFinish(card),
          position: 0,
          tcgId: binder.tcgId,
        },
      });
      await refetch();
    } catch (error) {
      handleError(error, t("binder:add_card_error"));
    }
  };

  const handleSelectionModeChange = (nextIsSelectionMode: boolean) => {
    setCardSelectionMode(nextIsSelectionMode);
    clearSelectedBinderCard();
  };

  const handleSelectVisibleBinderCards = () => {
    handleSelectBinderCards(visibleBinderCards);
  };

  const handleBulkPriceApplied = async () => {
    handleSelectionModeChange(false);
    await refetch();
  };

  const handleDeleteCard = async (binderCard: BinderCardRecord) => {
    try {
      await deleteBinderCard({
        variables: { id: binderCard.id },
      });

      if (selectedBinderCard?.id === binderCard.id) {
        clearSelectedBinderCard();
      }
      removeSelectedBinderCard(binderCard.id);

      const nextTotalBinderCards = Math.max(totalBinderCards - 1, 0);
      const nextLastPageIndex = Math.max(
        Math.ceil(nextTotalBinderCards / cardsPerPage) - 1,
        0
      );
      setPageIndex((currentPageIndex) =>
        Math.min(currentPageIndex, nextLastPageIndex)
      );

      await refetch();
    } catch (error) {
      handleError(error, t("binder:delete_card_error"));
    }
  };

  const handleDeleteSelectedBinderCards = async () => {
    const binderCardsToDelete = selectedBinderCards;

    if (binderCardsToDelete.length === 0 || isDeletingSelectedBinderCards) {
      return;
    }

    setIsDeletingSelectedBinderCards(true);

    try {
      const deleteResults = await Promise.allSettled(
        binderCardsToDelete.map(async (binderCard) => {
          const result = await deleteBinderCard({
            variables: { id: binderCard.id },
          });

          return {
            affectedCount:
              result.data?.deleteFromBinderCardsCollection?.affectedCount ?? 0,
            binderCardId: binderCard.id,
          };
        })
      );
      const deletedBinderCardIds = new Set<string>();
      let failedCount = 0;

      deleteResults.forEach((deleteResult) => {
        if (
          deleteResult.status === "rejected" ||
          deleteResult.value.affectedCount < 1
        ) {
          if (deleteResult.status === "rejected") {
            console.error(deleteResult.reason);
          }

          failedCount += 1;
          return;
        }

        deletedBinderCardIds.add(deleteResult.value.binderCardId);
      });

      const deletedCount = deletedBinderCardIds.size;

      if (deletedCount === 0) {
        toast.error(
          t("binder:bulk_delete.failed", {
            count: failedCount,
          })
        );
        return;
      }

      if (
        selectedBinderCard &&
        deletedBinderCardIds.has(selectedBinderCard.id)
      ) {
        clearSelectedBinderCard();
      }

      const nextTotalBinderCards = Math.max(
        totalBinderCards - deletedCount,
        0
      );
      const nextLastPageIndex = Math.max(
        Math.ceil(nextTotalBinderCards / cardsPerPage) - 1,
        0
      );

      setPageIndex((currentPageIndex) =>
        Math.min(currentPageIndex, nextLastPageIndex)
      );
      resetCardSelection();
      await refetch();

      if (failedCount > 0) {
        toast.error(
          t("binder:bulk_delete.partial", {
            count: deletedCount,
            failed: failedCount,
          })
        );
      } else {
        toast.success(
          t("binder:bulk_delete.success", {
            count: deletedCount,
          })
        );
      }
    } finally {
      setIsDeletingSelectedBinderCards(false);
    }
  };

  const handleOpenCard = (binderCard: BinderCardRecord, index: number) => {
    if (isSelectionMode) {
      handleToggleCardSelection(binderCard);
      return;
    }

    openBinderCard(binderCard, index);
  };

  const handleDetailOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;

    if (selectedCardIndex !== null && !isMobile) {
      setPageIndex(Math.floor(selectedCardIndex / cardsPerPage));
    }

    clearSelectedBinderCard();
  };

  const handleSortChange = (value: string) => {
    setSortMode(value as BinderSortMode);
    setPageIndex(0);
    clearSelectedBinderCard();
  };

  const handleViewChange = (value: BinderCardViewMode) => {
    setViewMode(value);
    setPageIndex(0);
    clearSelectedBinderCard();
  };

  const handlePreviousPage = () => {
    setPageIndex((currentPage) => Math.max(currentPage - 1, 0));
  };

  const handleNextPage = () => {
    if (!canTurnNextPage) return;

    setPageIndex((currentPage) => currentPage + 1);
  };

  return (
    <div className="relative isolate flex min-h-[calc(100svh-3.5rem)] w-full flex-1 overflow-y-auto bg-background text-foreground md:overflow-hidden">
      <div className="relative z-10 flex min-h-[calc(100svh-3.5rem)] w-full flex-col gap-5 px-4 pb-4 sm:px-6 lg:px-20">
        <BinderPageHeader
          binderId={binder.id}
          binderName={binder.name}
          binderNote={binder.note}
          binderTcgId={binder.tcgId}
          isOwner={isOwner}
          showConvertedMarketPrices={showConvertedMarketPrices}
          onAddCard={handleAddCard}
          onBinderChanged={refetch}
          onShowConvertedMarketPricesChange={setShowConvertedMarketPrices}
        />

        <BinderPageControls
          isMobile={isMobile}
          isOwner={isOwner}
          isPageLoading={isPageLoading}
          isSelectionMode={isSelectionMode}
          isDeletingSelectedBinderCards={isDeletingSelectedBinderCards}
          pageIndex={pageIndex}
          selectedBinderCardCount={selectedBinderCardCount}
          sortMode={sortMode}
          totalBinderCards={totalBinderCards}
          totalPages={totalPages}
          viewMode={viewMode}
          visibleBinderCardCount={visibleBinderCards.length}
          onClearCardSelection={clearCardSelection}
          onDeleteSelectedBinderCards={handleDeleteSelectedBinderCards}
          onOpenBulkPrice={() => setIsBulkPriceOpen(true)}
          onSelectVisibleBinderCards={handleSelectVisibleBinderCards}
          onSelectionModeChange={handleSelectionModeChange}
          onSortChange={handleSortChange}
          onViewChange={handleViewChange}
        />

        {isAddingCard && (
          <p className="shrink-0 text-sm text-muted-foreground">
            {t("binder:adding_card")}
          </p>
        )}

        <BinderCardViewPanel
          binderCards={visibleBinderCards}
          canTurnNextPage={canTurnNextPage}
          canTurnPreviousPage={canTurnPreviousPage}
          cardsPerPage={cardsPerPage}
          isDeletingCard={isDeletingCard || isDeletingSelectedBinderCards}
          isDetailOpen={selectedCardIndex !== null}
          isMobile={isMobile}
          isPageLoading={isPageLoading}
          isSelectionMode={isSelectionMode}
          selectedBinderCardIds={selectedBinderCardIds}
          showConvertedMarketPrices={showConvertedMarketPrices}
          viewMode={viewMode}
          onDeleteCard={isOwner ? handleDeleteCard : undefined}
          onNextPage={handleNextPage}
          onOpenCard={handleOpenCard}
          onPreviousPage={handlePreviousPage}
          onToggleCardSelection={handleToggleCardSelection}
        />
      </div>
      <ModalBinderCardDetail
        binderCard={selectedBinderCard}
        canGoNext={canGoNextDetailCard}
        canGoPrevious={canGoPreviousDetailCard}
        currentIndex={selectedCardIndex}
        isEditable={isOwner}
        isLoading={isDetailLoading}
        open={selectedCardIndex !== null}
        showConvertedMarketPrices={showConvertedMarketPrices}
        totalCards={totalBinderCards}
        onBinderCardUpdated={(binderCard) => {
          setSelectedBinderCard(binderCard);
          void refetch();
        }}
        onGoNext={goToNextDetailCard}
        onGoPrevious={goToPreviousDetailCard}
        onOpenChange={handleDetailOpenChange}
      />
      <ModalBulkBinderCardPrice
        binderCards={selectedBinderCards}
        open={isBulkPriceOpen}
        onApplied={handleBulkPriceApplied}
        onOpenChange={setIsBulkPriceOpen}
      />
    </div>
  );
};
