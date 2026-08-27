import {
  BinderVisibility,
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
import {
  type DraftBinderShareStatus,
  ModalDraftBinderShare,
} from "@/components/ModalDraftBinderShare";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/Button";
import { useBinderCardSelection } from "@/hooks/useBinderCardSelection";
import { useDraftBinder } from "@/hooks/useDraftBinder";
import { useIsMobile } from "@/hooks/useMobile";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import { presentBinderEditingError } from "@/lib/binderEditing";
import {
  type BinderCardFilterState,
  type BinderSortMode,
  defaultBinderCardFilterState,
  doesBinderCardMatchFilter,
  getBinderCardActiveFilterCount,
  getBinderCardFilterKey,
  getBinderCardFilterSearchParams,
  getBinderCardFilterStateFromSearchParams,
  getBinderCardsPerPage,
} from "@/lib/binderPage";
import {
  draftBinderCardsToBinderCardRecords,
  draftBinderCardToInsertInput,
  sortDraftBinderCards,
} from "@/lib/draftBinder";
import { handleError } from "@/lib/error";
import { usePricingSettings } from "@/providers/PricingSettingsContext";
import { useSession } from "@/providers/SessionContext";

export const BinderDraft = () => {
  const { t } = useTranslation(["binder", "common"]);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useSession();
  const { showConvertedMarketPrices } = usePricingSettings();
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
    binderEditing,
    clearDraft,
    draftBinder,
  } = useDraftBinder();
  const [createBinder, { loading: isCreatingBinder }] =
    useCreateBinderMutation();
  const [addBinderCards, { loading: isAddingBinderCards }] =
    useAddBinderCardsMutation();
  const [deleteBinder] = useDeleteBinderMutation();
  const [sortMode, setSortMode] = useState<BinderSortMode>("seller_order");
  const [viewMode, setViewMode] = useState<BinderCardViewMode>("grid");
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
  const [isDeletingCard, setIsDeletingCard] = useState(false);
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

  const handleDeleteCard = async (binderCard: BinderCardRecord) => {
    if (isDeletingCard) return;

    setIsDeletingCard(true);
    try {
      await binderEditing.removeCard(binderCard.id);
      removeSelectedBinderCard(binderCard.id);

      if (selectedBinderCard?.id === binderCard.id) {
        setSelectedBinderCardId(null);
      }
    } catch (error) {
      presentBinderEditingError(error, {
        fallbackMessage: t("binder:delete_card_error"),
      });
    } finally {
      setIsDeletingCard(false);
    }
  };

  const handleDeleteSelectedBinderCards = async () => {
    const binderCardIds = selectedBinderCards.map(
      (binderCard) => binderCard.id
    );

    if (binderCardIds.length === 0 || isDeletingSelectedBinderCards) {
      return;
    }

    setIsDeletingSelectedBinderCards(true);

    try {
      const outcome = await binderEditing.removeCards(binderCardIds);

      if (outcome.applied === 0) {
        toast.error(
          t("binder:bulk_delete.failed", { count: outcome.failed })
        );
        return;
      }

      const removedBinderCardIds = binderCardIds.filter(
        (_, index) => !outcome.failedIndexes.includes(index)
      );
      if (
        selectedBinderCard &&
        removedBinderCardIds.includes(selectedBinderCard.id)
      ) {
        setSelectedBinderCardId(null);
      }

      resetCardSelection();
      if (outcome.failed > 0) {
        toast.error(
          t("binder:bulk_delete.partial", {
            count: outcome.applied,
            failed: outcome.failed,
          })
        );
      } else {
        toast.success(
          t("binder:bulk_delete.success", { count: outcome.applied })
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

  const handleBulkPriceApplied = () => {
    handleSelectionModeChange(false);
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
      <Seo
        metadata={{
          canonicalPath: "/binder/draft",
          robots: "noindex,follow",
          title: t("binder:seo.draft.title"),
        }}
      />
      <BinderPageView
        activeFilterCount={activeFilterCount}
        binderEditing={binderEditing}
        binderIdentity="draft"
        binderName={draftBinder.name || t("binder:draft.untitled_name")}
        binderNote={draftBinder.note}
        binderTcgId={draftBinder.tcgId}
        binderVisibility={BinderVisibility.Unlisted}
        canUseCommerce={false}
        canGoNextDetailCard={canGoNextDetailCard}
        canGoPreviousDetailCard={canGoPreviousDetailCard}
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
        isCartPreview={false}
        isDeletingCard={isDeletingCard}
        isDeletingSelectedBinderCards={isDeletingSelectedBinderCards}
        isDetailLoading={false}
        isFiltered={isFiltered}
        isFilteredCountExact
        isMobile={isMobile}
        isOwnerView
        isPageLoading={false}
        isSelectionMode={isSelectionMode}
        isBulkPriceOpen={isBulkPriceOpen}
        pageIndex={pageIndex}
        requiresReload={false}
        selectedBinderCard={selectedBinderCard}
        selectedBinderCardCount={selectedBinderCardCount}
        selectedBinderCardIds={selectedBinderCardIds}
        selectedBinderCards={selectedBinderCards}
        selectedCardIndex={selectedCardIndex}
        showConvertedMarketPrices={showConvertedMarketPrices}
        sortMode={sortMode}
        filterState={filterState}
        totalBinderCards={totalBinderCards}
        viewMode={viewMode}
        visibleBinderCards={visibleBinderCards}
        onAddToCart={() => undefined}
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
        onNextPage={handleNextPage}
        onOpenBulkPrice={() => setIsBulkPriceOpen(true)}
        onOpenCard={handleOpenCard}
        onPreviousPage={handlePreviousPage}
        onSelectVisibleBinderCards={handleSelectVisibleBinderCards}
        onSelectionModeChange={handleSelectionModeChange}
        onSortChange={handleSortChange}
        onToggleCardSelection={handleToggleCardSelection}
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
