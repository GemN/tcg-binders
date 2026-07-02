import {
  useAddBinderCardsMutation,
  useCreateBinderMutation,
  useDeleteBinderMutation,
} from "@app/graphql";
import { Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import type { BinderCardViewMode } from "@/components/BinderCard";
import { BinderPageView } from "@/components/BinderPageView";
import type { ImportBinderCardsHandler } from "@/components/ButtonImportBinder";
import {
  ModalDraftBinderShare,
  type DraftBinderShareStatus,
} from "@/components/ModalDraftBinderShare";
import type { UpdateBinderCardHandler } from "@/components/ModalBinderCardDetail/types";
import type { UpdateBulkBinderCardPrice } from "@/components/ModalBulkBinderCardPrice";
import { Button } from "@/components/ui/Button";
import { useBinderCardSelection } from "@/hooks/useBinderCardSelection";
import {
  createDraftCardSnapshot,
  useDraftBinder,
} from "@/hooks/useDraftBinder";
import { useIsMobile } from "@/hooks/useMobile";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import {
  binderCardsUpdateInputToDraftPatch,
  draftBinderCardToBinderCardRecord,
  draftBinderCardToInsertInput,
  draftBinderCardsToBinderCardRecords,
  sortDraftBinderCards,
} from "@/lib/draftBinder";
import {
  defaultBinderCardFilterState,
  type BinderCardFilterState,
  type BinderSortMode,
  doesBinderCardMatchFilter,
  getBinderCardActiveFilterCount,
  getBinderCardFilterKey,
  getBinderCardFilterSearchParams,
  getBinderCardFilterStateFromSearchParams,
  getBinderCardsPerPage,
} from "@/lib/binderPage";
import { handleError } from "@/lib/error";
import { useSession } from "@/providers/SessionContext";

const DRAFT_BINDER_ID = "draft";

export const BinderDraft = () => {
  const { t } = useTranslation(["binder", "common"]);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useSession();
  const isMobile = useIsMobile();
  const filterState = useMemo(
    () => getBinderCardFilterStateFromSearchParams(searchParams),
    [searchParams]
  );
  const filterKey = useMemo(
    () => getBinderCardFilterKey(filterState),
    [filterState]
  );
  const activeFilterCount = useMemo(
    () => getBinderCardActiveFilterCount(filterState),
    [filterState]
  );
  const isFiltered = activeFilterCount > 0;
  const didShareAfterLoginRef = useRef(false);
  const {
    addCard,
    addCards,
    clearDraft,
    draftBinder,
    removeCard,
    removeCards,
    setName,
    setNote,
    updateCard,
  } = useDraftBinder();
  const [createBinder, { loading: isCreatingBinder }] =
    useCreateBinderMutation();
  const [addBinderCards, { loading: isAddingBinderCards }] =
    useAddBinderCardsMutation();
  const [deleteBinder] = useDeleteBinderMutation();
  const [sortMode, setSortMode] = useState<BinderSortMode>("seller_order");
  const [viewMode, setViewMode] = useState<BinderCardViewMode>("grid");
  const [showConvertedMarketPrices, setShowConvertedMarketPrices] =
    useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedBinderCardId, setSelectedBinderCardId] = useState<
    string | null
  >(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareStatus, setShareStatus] =
    useState<DraftBinderShareStatus>("idle");
  const [shareBinderName, setShareBinderName] = useState("");
  const [shareCardCount, setShareCardCount] = useState(0);
  const [shareBinderUrl, setShareBinderUrl] = useState("");
  const [shareBinderShortId, setShareBinderShortId] = useState("");
  const [isDeletingSelectedBinderCards, setIsDeletingSelectedBinderCards] =
    useState(false);
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const cardsPerPage = getBinderCardsPerPage(viewMode);
  const cardOffset = isMobile ? 0 : pageIndex * cardsPerPage;
  const sortedDraftCards = useMemo(
    () => sortDraftBinderCards(draftBinder.cards, sortMode),
    [draftBinder.cards, sortMode]
  );
  const binderCards = useMemo(
    () =>
      draftBinderCardsToBinderCardRecords(sortedDraftCards).filter(
        (binderCard) =>
          !isFiltered || doesBinderCardMatchFilter(binderCard, filterState)
      ),
    [filterState, isFiltered, sortedDraftCards]
  );
  const visibleBinderCards = isMobile
    ? binderCards
    : binderCards.slice(cardOffset, cardOffset + cardsPerPage);
  const totalBinderCards = binderCards.length;
  const totalPages = Math.max(Math.ceil(totalBinderCards / cardsPerPage), 1);
  const canTurnPreviousPage = !isMobile && pageIndex > 0;
  const canTurnNextPage = !isMobile && pageIndex + 1 < totalPages;
  const selectedCardIndex = useMemo(() => {
    if (!selectedBinderCardId) return null;

    const cardIndex = binderCards.findIndex(
      (binderCard) => binderCard.id === selectedBinderCardId
    );

    return cardIndex >= 0 ? cardIndex : null;
  }, [binderCards, selectedBinderCardId]);
  const selectedBinderCard =
    selectedCardIndex === null ? null : binderCards[selectedCardIndex] || null;
  const shouldShareAfterLogin = searchParams.get("share") === "1";
  const canGoPreviousDetailCard =
    selectedCardIndex !== null && selectedCardIndex > 0;
  const canGoNextDetailCard =
    selectedCardIndex !== null && selectedCardIndex + 1 < totalBinderCards;
  const isShareInProgress =
    shareStatus === "creating" || shareStatus === "adding";
  const isSharing =
    isCreatingBinder || isAddingBinderCards || isShareInProgress;
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

  useEffect(() => {
    setPageIndex(0);
    setIsBulkPriceOpen(false);
    setSelectedBinderCardId(null);
    resetCardSelection();
  }, [filterKey, isMobile, resetCardSelection]);

  useEffect(() => {
    if (selectedBinderCardId && selectedCardIndex === null) {
      setSelectedBinderCardId(null);
    }
  }, [selectedBinderCardId, selectedCardIndex]);

  useEffect(() => {
    setPageIndex((currentPageIndex) =>
      Math.min(currentPageIndex, totalPages - 1)
    );
  }, [totalPages]);

  const handleSelectionModeChange = (nextIsSelectionMode: boolean) => {
    setCardSelectionMode(nextIsSelectionMode);
    setSelectedBinderCardId(null);
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

  const handleOpenCard = (binderCard: BinderCardRecord) => {
    if (isSelectionMode) {
      handleToggleCardSelection(binderCard);
      return;
    }

    setSelectedBinderCardId(binderCard.id);
  };

  const handleDeleteCard = (binderCard: BinderCardRecord) => {
    removeCard(binderCard.id);
    removeSelectedBinderCard(binderCard.id);

    if (selectedBinderCard?.id === binderCard.id) {
      setSelectedBinderCardId(null);
    }
  };

  const handleDeleteSelectedBinderCards = () => {
    const binderCardIds = selectedBinderCards.map(
      (binderCard) => binderCard.id
    );

    if (binderCardIds.length === 0 || isDeletingSelectedBinderCards) {
      return;
    }

    setIsDeletingSelectedBinderCards(true);

    try {
      removeCards(binderCardIds);

      if (selectedBinderCard && binderCardIds.includes(selectedBinderCard.id)) {
        setSelectedBinderCardId(null);
      }

      resetCardSelection();
      toast.success(
        t("binder:bulk_delete.success", {
          count: binderCardIds.length,
        })
      );
    } finally {
      setIsDeletingSelectedBinderCards(false);
    }
  };

  const handleDetailOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;

    if (selectedCardIndex !== null && !isMobile) {
      setPageIndex(Math.floor(selectedCardIndex / cardsPerPage));
    }

    setSelectedBinderCardId(null);
  };

  const handleSortChange = (value: string) => {
    setSortMode(value as BinderSortMode);
    setPageIndex(0);
    setSelectedBinderCardId(null);
  };

  const handleViewChange = (value: BinderCardViewMode) => {
    setViewMode(value);
    setPageIndex(0);
    setSelectedBinderCardId(null);
  };

  const handlePreviousPage = () => {
    setPageIndex((currentPage) => Math.max(currentPage - 1, 0));
  };

  const handleNextPage = () => {
    if (!canTurnNextPage) return;

    setPageIndex((currentPage) => currentPage + 1);
  };

  const handleUpdateBinderCard: UpdateBinderCardHandler = (
    binderCard,
    set,
    context
  ) => {
    const patch = binderCardsUpdateInputToDraftPatch(set);

    if (set.cardId && context?.variant) {
      const card = createDraftCardSnapshot(context.variant);
      patch.card = card;
      patch.cardId = card.id;
    }

    const updatedDraftCard = updateCard(binderCard.id, patch);
    if (!updatedDraftCard) {
      throw new Error(t("binder:detail.update_error"));
    }

    return draftBinderCardToBinderCardRecord(updatedDraftCard);
  };

  const handleUpdateBinderCardPrice: UpdateBulkBinderCardPrice = (
    binderCard,
    update
  ) => {
    return !!updateCard(binderCard.id, update);
  };

  const handleBulkPriceApplied = () => {
    handleSelectionModeChange(false);
  };

  const handleImportCards: ImportBinderCardsHandler = ({
    items,
    onProgress,
  }) => {
    addCards(
      items.map(({ card, finish, item }) => ({
        card: createDraftCardSnapshot(card),
        options: {
          condition: item.condition,
          finish,
          language: item.language,
          priceAmount: item.priceAmount ?? null,
          priceCurrency: item.priceCurrency,
          quantity: item.quantity,
        },
      }))
    );
    onProgress(items.length);

    return {
      failedInsertCount: 0,
      importedCount: items.length,
    };
  };

  const handleShare = useCallback(async () => {
    if (isShareInProgress) return;

    if (!session) {
      navigate(
        `/login?next=${encodeURIComponent(`${location.pathname}?share=1`)}`
      );
      return;
    }

    const name = draftBinder.name.trim() || t("binder:draft.untitled_name");
    const cardCount = draftBinder.cards.length;
    let createdBinderId: string | null = null;

    setShareBinderName(name);
    setShareCardCount(cardCount);
    setShareBinderUrl("");
    setShareBinderShortId("");
    setShareStatus("creating");
    setShareDialogOpen(true);

    try {
      const result = await createBinder({
        variables: {
          name,
          tcgId: draftBinder.tcgId,
        },
      });
      const binder =
        result.data?.insertIntoBindersCollection?.records[0] || null;

      if (!binder?.id || !binder.shortId) {
        throw new Error(t("binder:draft.share_error"));
      }

      createdBinderId = binder.id;

      const objects = draftBinder.cards.map((draftCard) =>
        draftBinderCardToInsertInput(binder.id, draftCard)
      );

      if (objects.length > 0) {
        setShareStatus("adding");
        await addBinderCards({ variables: { objects } });
      }

      setShareBinderUrl(`${window.location.origin}/binder/${binder.shortId}`);
      setShareBinderShortId(binder.shortId);
      setShareStatus("ready");
      clearDraft();
    } catch (error) {
      if (createdBinderId) {
        try {
          await deleteBinder({ variables: { id: createdBinderId } });
        } catch (deleteError) {
          console.error(deleteError);
        }
      }

      setShareStatus("idle");
      setShareDialogOpen(false);
      handleError(error, t("binder:draft.share_error"));
    }
  }, [
    addBinderCards,
    clearDraft,
    createBinder,
    deleteBinder,
    draftBinder.cards,
    draftBinder.name,
    draftBinder.tcgId,
    isShareInProgress,
    location.pathname,
    navigate,
    session,
    t,
  ]);

  useEffect(() => {
    if (!session || !shouldShareAfterLogin || didShareAfterLoginRef.current) {
      return;
    }

    didShareAfterLoginRef.current = true;
    void handleShare();
  }, [handleShare, session, shouldShareAfterLogin]);

  return (
    <>
      <BinderPageView
        activeFilterCount={activeFilterCount}
        binderId={DRAFT_BINDER_ID}
        binderName={draftBinder.name || t("binder:draft.untitled_name")}
        binderNote={draftBinder.note}
        binderTcgId={draftBinder.tcgId}
        canGoNextDetailCard={canGoNextDetailCard}
        canGoPreviousDetailCard={canGoPreviousDetailCard}
        canTurnNextPage={canTurnNextPage}
        canTurnPreviousPage={canTurnPreviousPage}
        cardsPerPage={cardsPerPage}
        headerAction={
          <Button
            type="button"
            className="h-9 px-2 sm:px-3"
            isLoading={isSharing}
            onClick={() => void handleShare()}
          >
            <Save className="size-4" />
            {t("binder:draft.share")}
          </Button>
        }
        isAddingCard={false}
        isDeletingCard={false}
        isDeletingSelectedBinderCards={isDeletingSelectedBinderCards}
        isDetailLoading={false}
        isFiltered={isFiltered}
        isFilteredCountExact
        isMobile={isMobile}
        isOwner
        isPageLoading={false}
        isSelectionMode={isSelectionMode}
        isBulkPriceOpen={isBulkPriceOpen}
        pageIndex={pageIndex}
        selectedBinderCard={selectedBinderCard}
        selectedBinderCardCount={selectedBinderCardCount}
        selectedBinderCardIds={selectedBinderCardIds}
        selectedBinderCards={selectedBinderCards}
        selectedCardIndex={selectedCardIndex}
        showConvertedMarketPrices={showConvertedMarketPrices}
        sortMode={sortMode}
        filterState={filterState}
        totalBinderCards={totalBinderCards}
        totalPages={totalPages}
        viewMode={viewMode}
        visibleBinderCards={visibleBinderCards}
        onAddCard={addCard}
        onBinderCardUpdated={() => undefined}
        onBinderChanged={() => undefined}
        onBulkPriceApplied={handleBulkPriceApplied}
        onBulkPriceOpenChange={setIsBulkPriceOpen}
        onClearCardSelection={clearCardSelection}
        onClearFilters={handleClearFilters}
        onDeleteCard={handleDeleteCard}
        onDeleteSelectedBinderCards={handleDeleteSelectedBinderCards}
        onDetailOpenChange={handleDetailOpenChange}
        onFilterStateChange={handleFilterStateChange}
        onGoNextDetailCard={() => {
          if (selectedCardIndex !== null && canGoNextDetailCard) {
            setSelectedBinderCardId(
              binderCards[selectedCardIndex + 1]?.id || null
            );
          }
        }}
        onGoPreviousDetailCard={() => {
          if (selectedCardIndex !== null && canGoPreviousDetailCard) {
            setSelectedBinderCardId(
              binderCards[selectedCardIndex - 1]?.id || null
            );
          }
        }}
        onImportCards={handleImportCards}
        onNextPage={handleNextPage}
        onOpenBulkPrice={() => setIsBulkPriceOpen(true)}
        onOpenCard={handleOpenCard}
        onPreviousPage={handlePreviousPage}
        onRenameBinder={setName}
        onSelectVisibleBinderCards={handleSelectVisibleBinderCards}
        onSelectionModeChange={handleSelectionModeChange}
        onShowConvertedMarketPricesChange={setShowConvertedMarketPrices}
        onSortChange={handleSortChange}
        onToggleCardSelection={handleToggleCardSelection}
        onUpdateBinderCard={handleUpdateBinderCard}
        onUpdateBinderCardPrice={handleUpdateBinderCardPrice}
        onUpdateBinderNote={setNote}
        onViewChange={handleViewChange}
      />
      <ModalDraftBinderShare
        binderName={shareBinderName}
        cardCount={shareCardCount}
        open={shareDialogOpen}
        shareUrl={shareBinderUrl}
        status={shareStatus}
        onOpenBinder={() => navigate(`/binder/${shareBinderShortId}`)}
        onOpenChange={setShareDialogOpen}
      />
    </>
  );
};
