import { NetworkStatus, useApolloClient } from "@apollo/client";
import {
  BinderCardFilteredCountDocument,
  type BinderCardFilteredCountQuery,
  type BinderCardFilteredCountQueryVariables,
  useAddBinderCardMutation,
  useBinderByShortIdQuery,
  useDeleteBinderCardMutation,
} from "@app/graphql";
import { Eye, Pencil, Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

import type { BinderCardViewMode } from "@/components/BinderCard";
import { BinderPageView } from "@/components/BinderPageView";
import { Loading } from "@/components/Loading";
import { ModalBinderShare } from "@/components/ModalBinderShare";
import { Button } from "@/components/ui/Button";
import { useBinderCardDetailNavigation } from "@/hooks/useBinderCardDetailNavigation";
import { useBinderCardSelection } from "@/hooks/useBinderCardSelection";
import { useDebounce } from "@/hooks/useDebounce";
import type { DraftCardSnapshot } from "@/hooks/useDraftBinder";
import { useIsMobile } from "@/hooks/useMobile";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import {
  defaultBinderCardFilterState,
  FILTERED_COUNT_PAGE_SIZE,
  type BinderCardFilterState,
  type BinderSortMode,
  getBinderCardActiveFilterCount,
  getBinderCardFilterKey,
  getBinderCardOrderBy,
  getBinderCardFilterSearchParams,
  getBinderCardFilterStateFromSearchParams,
  getBinderCardsPerPage,
  getBinderCardsFilter,
  getDefaultFinish,
  MOBILE_CARD_LIMIT,
  PRELOAD_PAGE_COUNT,
} from "@/lib/binderPage";
import { handleError } from "@/lib/error";
import { NotFound } from "@/pages/NotFound";
import { useSession } from "@/providers/SessionContext";

interface FilteredBinderCardCountState {
  count: number;
  filterKey: string;
  shortId: string;
}

export const BinderPage = () => {
  const { t } = useTranslation(["binder", "common"]);
  const client = useApolloClient();
  const { session } = useSession();
  const { shortId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const isPublicPreview = searchParams.get("public") === "true";
  const searchParamFilterState = useMemo(
    () => getBinderCardFilterStateFromSearchParams(searchParams),
    [searchParams]
  );
  const filterState = searchParamFilterState;
  const debouncedFilterState = useDebounce(filterState, 250);
  const debouncedFilterKey = useMemo(
    () => getBinderCardFilterKey(debouncedFilterState),
    [debouncedFilterState]
  );
  const activeFilterCount = useMemo(
    () => getBinderCardActiveFilterCount(filterState),
    [filterState]
  );
  const debouncedActiveFilterCount = useMemo(
    () => getBinderCardActiveFilterCount(debouncedFilterState),
    [debouncedFilterState]
  );
  const cardFilter = useMemo(
    () => getBinderCardsFilter(debouncedFilterState),
    [debouncedFilterState]
  );
  const isFiltered = debouncedActiveFilterCount > 0;
  const [sortMode, setSortMode] = useState<BinderSortMode>("seller_order");
  const [viewMode, setViewMode] = useState<BinderCardViewMode>("grid");
  const [showConvertedMarketPrices, setShowConvertedMarketPrices] =
    useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [isDeletingSelectedBinderCards, setIsDeletingSelectedBinderCards] =
    useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [filteredBinderCardCount, setFilteredBinderCardCount] =
    useState<FilteredBinderCardCountState | null>(null);
  const [
    filteredBinderCardCountRefreshKey,
    setFilteredBinderCardCountRefreshKey,
  ] = useState(0);
  const cardsPerPage = getBinderCardsPerPage(viewMode);
  const cardOffset = isMobile ? 0 : pageIndex * cardsPerPage;
  const cardFirst = isMobile
    ? MOBILE_CARD_LIMIT
    : (PRELOAD_PAGE_COUNT + 1) * cardsPerPage;
  const cardOrderBy = useMemo(() => getBinderCardOrderBy(sortMode), [sortMode]);
  const { data, loading, networkStatus, refetch } = useBinderByShortIdQuery({
    variables: {
      shortId,
      cardFirst,
      cardOffset,
      cardFilter,
      cardOrderBy,
    },
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
  const currentFilteredCardCount =
    cardOffset +
    binderCards.length +
    (data?.binderCardsByShortId?.pageInfo.hasNextPage ? 1 : 0);
  const exactFilteredBinderCardCount =
    filteredBinderCardCount?.filterKey === debouncedFilterKey &&
    filteredBinderCardCount.shortId === shortId
      ? filteredBinderCardCount.count
      : null;
  const hasExactFilteredBinderCardCount =
    isFiltered && exactFilteredBinderCardCount !== null;
  const totalBinderCards = isFiltered
    ? (exactFilteredBinderCardCount ?? currentFilteredCardCount)
    : (data?.binderCardCountByShortId ?? binderCards.length);
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
    cardFilter,
    cardOrderBy,
    shortId,
    totalBinderCards,
  });
  const selectedBinderCardIdRef = useRef<string | null>(null);

  useEffect(() => {
    setPageIndex(0);
    setIsBulkPriceOpen(false);
    clearSelectedBinderCard();
    resetCardSelection();
  }, [
    clearSelectedBinderCard,
    debouncedFilterKey,
    isMobile,
    isPublicPreview,
    resetCardSelection,
    shortId,
  ]);

  useEffect(() => {
    selectedBinderCardIdRef.current = selectedBinderCard?.id ?? null;
  }, [selectedBinderCard?.id]);

  const refreshFilteredBinderCardCount = useCallback(() => {
    setFilteredBinderCardCountRefreshKey((refreshKey) => refreshKey + 1);
  }, []);

  useEffect(() => {
    if (!shortId || !isFiltered || !cardFilter) {
      setFilteredBinderCardCount(null);
      return;
    }

    let isCurrent = true;

    const countFilteredBinderCards = async () => {
      let cardOffsetForCount = 0;
      let nextFilteredBinderCardCount = 0;

      setFilteredBinderCardCount(null);

      try {
        while (isCurrent) {
          const { data: countData } = await client.query<
            BinderCardFilteredCountQuery,
            BinderCardFilteredCountQueryVariables
          >({
            query: BinderCardFilteredCountDocument,
            variables: {
              shortId,
              cardFirst: FILTERED_COUNT_PAGE_SIZE,
              cardOffset: cardOffsetForCount,
              cardOrderBy,
              cardFilter,
            },
            fetchPolicy: "no-cache",
          });

          const countConnection = countData.binderCardsByShortId;
          const fetchedCardCount = countConnection?.edges.length ?? 0;

          nextFilteredBinderCardCount += fetchedCardCount;

          if (
            !countConnection?.pageInfo.hasNextPage ||
            fetchedCardCount === 0
          ) {
            break;
          }

          cardOffsetForCount += fetchedCardCount;
        }

        if (isCurrent) {
          setFilteredBinderCardCount({
            count: nextFilteredBinderCardCount,
            filterKey: debouncedFilterKey,
            shortId,
          });
        }
      } catch (error) {
        if (isCurrent) {
          console.error(error);
          setFilteredBinderCardCount(null);
        }
      }
    };

    void countFilteredBinderCards();

    return () => {
      isCurrent = false;
    };
  }, [
    cardFilter,
    cardOrderBy,
    client,
    debouncedFilterKey,
    filteredBinderCardCountRefreshKey,
    isFiltered,
    shortId,
  ]);

  const handleDeleteCard = useCallback(
    async (binderCard: BinderCardRecord) => {
      try {
        await deleteBinderCard({
          variables: { id: binderCard.id },
        });

        if (selectedBinderCardIdRef.current === binderCard.id) {
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
        refreshFilteredBinderCardCount();
      } catch (error) {
        handleError(error, t("binder:delete_card_error"));
      }
    },
    [
      cardsPerPage,
      clearSelectedBinderCard,
      deleteBinderCard,
      refetch,
      removeSelectedBinderCard,
      refreshFilteredBinderCardCount,
      t,
      totalBinderCards,
    ]
  );

  const handleOpenCard = useCallback(
    (binderCard: BinderCardRecord, index: number) => {
      if (!isPublicPreview && isSelectionMode) {
        handleToggleCardSelection(binderCard);
        return;
      }

      openBinderCard(binderCard, index);
    },
    [
      handleToggleCardSelection,
      isPublicPreview,
      isSelectionMode,
      openBinderCard,
    ]
  );

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
  const canEditBinder = isOwner && !isPublicPreview;
  const canSelectBinderCards = canEditBinder && isSelectionMode;
  const ownerBinderUrl = `/binder/${binder.shortId}`;
  const publicPreviewUrl = `${ownerBinderUrl}?public=true`;
  const binderShareUrl =
    typeof window === "undefined"
      ? `/binder/${binder.shortId}`
      : `${window.location.origin}/binder/${binder.shortId}`;
  const shareButton = session ? (
    <Button
      type="button"
      variant="outline"
      onClick={() => setIsShareDialogOpen(true)}
    >
      <Share2 className="size-4" />
      {t("binder:share.button")}
    </Button>
  ) : undefined;
  const headerAction = isOwner
    ? isPublicPreview
      ? undefined
      : shareButton
    : shareButton;
  const titleAction = isOwner ? (
    isPublicPreview ? (
      <Link
        to={ownerBinderUrl}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-binder-toolbar-foreground/80 underline-offset-4 hover:text-binder-toolbar-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-binder-toolbar-foreground/40"
      >
        <Pencil className="size-4" />
        {t("binder:public_preview.owner_view")}
      </Link>
    ) : (
      <Link
        to={publicPreviewUrl}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-binder-toolbar-foreground/80 underline-offset-4 hover:text-binder-toolbar-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-binder-toolbar-foreground/40"
      >
        <Eye className="size-4" />
        {t("binder:public_preview.button")}
      </Link>
    )
  ) : undefined;

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
      refreshFilteredBinderCardCount();
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

  const handleFilterStateChange = (nextFilterState: BinderCardFilterState) => {
    setSearchParams(
      getBinderCardFilterSearchParams(searchParams, nextFilterState),
      { replace: true }
    );
  };

  const handleClearFilters = () => {
    setSearchParams(
      getBinderCardFilterSearchParams(
        searchParams,
        defaultBinderCardFilterState
      ),
      { replace: true }
    );
  };

  const handleBulkPriceApplied = async () => {
    handleSelectionModeChange(false);
    await refetch();
    refreshFilteredBinderCardCount();
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

      const nextTotalBinderCards = Math.max(totalBinderCards - deletedCount, 0);
      const nextLastPageIndex = Math.max(
        Math.ceil(nextTotalBinderCards / cardsPerPage) - 1,
        0
      );

      setPageIndex((currentPageIndex) =>
        Math.min(currentPageIndex, nextLastPageIndex)
      );
      resetCardSelection();
      await refetch();
      refreshFilteredBinderCardCount();

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
    <>
      <BinderPageView
        activeFilterCount={activeFilterCount}
        binderId={binder.id}
        binderName={binder.name}
        binderNote={binder.note}
        binderTcgId={binder.tcgId}
        canGoNextDetailCard={canGoNextDetailCard}
        canGoPreviousDetailCard={canGoPreviousDetailCard}
        canTurnNextPage={canTurnNextPage}
        canTurnPreviousPage={canTurnPreviousPage}
        cardsPerPage={cardsPerPage}
        headerAction={headerAction}
        isAddingCard={isAddingCard}
        isDeletingCard={isDeletingCard}
        isDeletingSelectedBinderCards={isDeletingSelectedBinderCards}
        isDetailLoading={isDetailLoading}
        isFiltered={isFiltered}
        isFilteredCountExact={hasExactFilteredBinderCardCount}
        isMobile={isMobile}
        isOwner={canEditBinder}
        isPageLoading={isPageLoading}
        isSelectionMode={canSelectBinderCards}
        isBulkPriceOpen={canEditBinder && isBulkPriceOpen}
        pageIndex={pageIndex}
        selectedBinderCard={selectedBinderCard}
        selectedBinderCardCount={selectedBinderCardCount}
        selectedBinderCardIds={selectedBinderCardIds}
        selectedBinderCards={selectedBinderCards}
        selectedCardIndex={selectedCardIndex}
        showConvertedMarketPrices={showConvertedMarketPrices}
        sortMode={sortMode}
        filterState={filterState}
        titleAction={titleAction}
        totalBinderCards={totalBinderCards}
        totalPages={totalPages}
        viewMode={viewMode}
        visibleBinderCards={visibleBinderCards}
        onAddCard={handleAddCard}
        onBinderCardUpdated={(binderCard) => {
          setSelectedBinderCard(binderCard);
          void refetch();
          refreshFilteredBinderCardCount();
        }}
        onBinderChanged={refetch}
        onBulkPriceApplied={handleBulkPriceApplied}
        onBulkPriceOpenChange={setIsBulkPriceOpen}
        onClearCardSelection={clearCardSelection}
        onClearFilters={handleClearFilters}
        onDeleteCard={canEditBinder ? handleDeleteCard : undefined}
        onDeleteSelectedBinderCards={handleDeleteSelectedBinderCards}
        onDetailOpenChange={handleDetailOpenChange}
        onFilterStateChange={handleFilterStateChange}
        onGoNextDetailCard={goToNextDetailCard}
        onGoPreviousDetailCard={goToPreviousDetailCard}
        onNextPage={handleNextPage}
        onOpenBulkPrice={() => setIsBulkPriceOpen(true)}
        onOpenCard={handleOpenCard}
        onPreviousPage={handlePreviousPage}
        onSelectVisibleBinderCards={handleSelectVisibleBinderCards}
        onSelectionModeChange={handleSelectionModeChange}
        onShowConvertedMarketPricesChange={setShowConvertedMarketPrices}
        onSortChange={handleSortChange}
        onToggleCardSelection={handleToggleCardSelection}
        onViewChange={handleViewChange}
      />
      <ModalBinderShare
        binderName={binder.name}
        open={isShareDialogOpen}
        shareUrl={binderShareUrl}
        onOpenChange={setIsShareDialogOpen}
      />
    </>
  );
};
