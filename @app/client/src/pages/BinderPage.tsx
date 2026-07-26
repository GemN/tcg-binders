import { NetworkStatus } from "@apollo/client";
import {
  useAddBinderCardMutation,
  useBinderByShortIdQuery,
  useDeleteBinderCardMutation,
  useRecordBinderViewMutation,
  useUserProfileByIdQuery,
} from "@app/graphql";
import {
  Eye,
  Image,
  Link as LinkIcon,
  Pencil,
  Settings,
  Share2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

import type { BinderCardViewMode } from "@/components/BinderCard";
import { BinderOwnerLink } from "@/components/BinderOwnerLink";
import { BinderPageView } from "@/components/BinderPageView";
import { Loading } from "@/components/Loading";
import { ModalBinderSettings } from "@/components/ModalBinderSettings";
import { ModalBinderShare } from "@/components/ModalBinderShare";
import { ModalBinderShareImage } from "@/components/ModalBinderShareImage";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { getPreferredCardFinish } from "@/config/card";
import { useBinderCardDetailNavigation } from "@/hooks/useBinderCardDetailNavigation";
import { useBinderCardSelection } from "@/hooks/useBinderCardSelection";
import { useBinderCartActions } from "@/hooks/useBinderCartActions";
import { useDebounce } from "@/hooks/useDebounce";
import type { DraftCardSnapshot } from "@/hooks/useDraftBinder";
import { useIsMobile } from "@/hooks/useMobile";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import {
  type BinderCardFilterState,
  type BinderSortMode,
  defaultBinderCardFilterState,
  getBinderCardActiveFilterCount,
  getBinderCardFilterKey,
  getBinderCardFilterSearchParams,
  getBinderCardFilterStateFromSearchParams,
  getBinderCardOrderBy,
  getBinderCardsFilter,
  getBinderCardsPerPage,
  MOBILE_CARD_LIMIT,
  PRELOAD_PAGE_COUNT,
} from "@/lib/binderPage";
import type { CartSellerSnapshot } from "@/lib/cart";
import { handleError } from "@/lib/error";
import { NotFound } from "@/pages/NotFound";
import { useSession } from "@/providers/SessionContext";

const BINDER_VIEW_COOLDOWN_MS = 30 * 60 * 1000;
const BINDER_VIEW_STORAGE_KEY_PREFIX = "tcgbinder:binder-view:";

export const BinderPage = () => {
  const { t } = useTranslation(["binder", "checkout", "common"]);
  const { isLoading: isSessionLoading, session } = useSession();
  const navigate = useNavigate();
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
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isShareImageDialogOpen, setIsShareImageDialogOpen] = useState(false);
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
      includeFilteredTotalCount: isFiltered,
    },
    skip: !shortId,
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  });
  const [addBinderCard, { loading: isAddingCard }] = useAddBinderCardMutation();
  const [deleteBinderCard, { loading: isDeletingCard }] =
    useDeleteBinderCardMutation();
  const [recordBinderView] = useRecordBinderViewMutation();
  const recordedBinderViewShortIdRef = useRef<string | null>(null);

  const binder = data?.binderByShortId;
  const isOwner = !!session?.user.id && session.user.id === binder?.ownerId;
  const isPublicView = !!binder && (!isOwner || isPublicPreview);
  const isCartPreview = isOwner && isPublicPreview;

  useEffect(() => {
    if (!binder || isSessionLoading || isOwner) return;
    if (recordedBinderViewShortIdRef.current === binder.shortId) return;

    recordedBinderViewShortIdRef.current = binder.shortId;
    const recordedAt = Date.now();
    const recordedAtValue = String(recordedAt);
    const storageKey = `${BINDER_VIEW_STORAGE_KEY_PREFIX}${binder.shortId}`;
    let didStoreCooldown = false;

    try {
      const storedValue = window.localStorage.getItem(storageKey);
      const lastRecordedAt = storedValue === null ? null : Number(storedValue);
      const elapsed =
        lastRecordedAt === null ? null : recordedAt - lastRecordedAt;

      if (
        elapsed !== null &&
        Number.isFinite(elapsed) &&
        elapsed >= 0 &&
        elapsed < BINDER_VIEW_COOLDOWN_MS
      ) {
        return;
      }

      window.localStorage.setItem(storageKey, recordedAtValue);
      didStoreCooldown = true;
    } catch {
      // Record the view when localStorage is unavailable.
    }

    void recordBinderView({
      variables: { shortId: binder.shortId },
    }).catch(() => {
      if (!didStoreCooldown) return;

      try {
        if (window.localStorage.getItem(storageKey) === recordedAtValue) {
          window.localStorage.removeItem(storageKey);
        }
      } catch {
        // Ignore localStorage failures after the request.
      }
    });
  }, [binder, isOwner, isSessionLoading, recordBinderView]);

  const ownerId = binder?.ownerId ?? "";
  const { data: ownerProfileData, loading: isOwnerProfileLoading } =
    useUserProfileByIdQuery({
      variables: { id: ownerId },
      skip:
        !ownerId ||
        (!isPublicView && !isShareDialogOpen && !isShareImageDialogOpen),
    });
  const ownerProfile = ownerProfileData?.userProfilesCollection?.edges[0]?.node;
  const cartSeller = useMemo<CartSellerSnapshot | null>(() => {
    if (!ownerId || !ownerProfile) return null;

    return {
      country: ownerProfile.country,
      id: ownerId,
      nickname: ownerProfile.nickname,
    };
  }, [ownerId, ownerProfile]);
  const { handleAddToCart } = useBinderCartActions({
    binder,
    isCartPreview,
    isSellerLoading: isPublicView && isOwnerProfileLoading,
    seller: cartSeller,
  });
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
    isFiltered && typeof data?.binderCardsByShortId?.totalCount === "number"
      ? data.binderCardsByShortId.totalCount
      : null;
  const hasExactFilteredBinderCardCount = exactFilteredBinderCardCount !== null;
  const totalBinderCards = isFiltered
    ? (exactFilteredBinderCardCount ?? currentFilteredCardCount)
    : (binder?.binderCardCount ?? binderCards.length);
  const canTurnNextPage =
    !isMobile &&
    pageIndex + 1 < Math.max(Math.ceil(totalBinderCards / cardsPerPage), 1);
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

  const canEditBinder = isOwner && !isPublicPreview;
  const canSelectBinderCards = canEditBinder && isSelectionMode;
  const ownerBinderUrl = `/binder/${binder.shortId}`;
  const publicPreviewUrl = `${ownerBinderUrl}?public=true`;
  const binderShareUrl =
    typeof window === "undefined"
      ? `/binder/${binder.shortId}`
      : `${window.location.origin}/binder/${binder.shortId}`;
  const shareDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline">
          <Share2 className="size-4" />
          {t("binder:share.button")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => setIsShareDialogOpen(true)}
        >
          <LinkIcon className="size-4" />
          {t("binder:share.link_option")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => setIsShareImageDialogOpen(true)}
        >
          <Image className="size-4" />
          {t("binder:share.image_option")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const settingsButton = canEditBinder ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("binder:settings.button")}
          onClick={() => setIsSettingsDialogOpen(true)}
        >
          <Settings className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={4}>
        {t("binder:settings.button")}
      </TooltipContent>
    </Tooltip>
  ) : undefined;
  const headerAction = isOwner ? (
    isPublicPreview ? undefined : (
      <>
        {shareDropdown}
        {settingsButton}
      </>
    )
  ) : (
    shareDropdown
  );
  const ownerProfileLink =
    isPublicView && ownerProfile ? (
      <BinderOwnerLink
        country={ownerProfile.country}
        nickname={ownerProfile.nickname}
      />
    ) : undefined;
  const ownerViewAction = isOwner ? (
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
  const titleAction = ownerViewAction;

  const handleAddCard = async (card: DraftCardSnapshot) => {
    try {
      await addBinderCard({
        variables: {
          binderId: binder.id,
          cardId: card.id,
          finish: getPreferredCardFinish(card.finishes),
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
        binderVisibility={binder.visibility}
        canGoNextDetailCard={canGoNextDetailCard}
        canGoPreviousDetailCard={canGoPreviousDetailCard}
        canEditBinder={canEditBinder}
        cardsPerPage={cardsPerPage}
        headerAction={headerAction}
        isAddingCard={isAddingCard}
        isCartPreview={isCartPreview}
        isDeletingCard={isDeletingCard}
        isDeletingSelectedBinderCards={isDeletingSelectedBinderCards}
        isDetailLoading={isDetailLoading}
        isFiltered={isFiltered}
        isFilteredCountExact={hasExactFilteredBinderCardCount}
        isMobile={isMobile}
        isPageLoading={isPageLoading}
        isSelectionMode={canSelectBinderCards}
        isBulkPriceOpen={canEditBinder && isBulkPriceOpen}
        ownerByline={ownerProfileLink}
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
        viewCount={isOwner ? Number(binder.stats?.viewCount ?? 0) : undefined}
        viewMode={viewMode}
        visibleBinderCards={visibleBinderCards}
        onAddCard={handleAddCard}
        onAddToCart={handleAddToCart}
        onBinderCardUpdated={(binderCard) => {
          setSelectedBinderCard(binderCard);
          void refetch();
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
      <ModalBinderShareImage
        binderName={binder.name}
        binderVisibility={binder.visibility}
        cardFilter={cardFilter}
        cardOrderBy={cardOrderBy}
        initialCardIndex={cardOffset}
        isSellerLoading={isOwnerProfileLoading}
        open={isShareImageDialogOpen}
        sellerName={ownerProfile?.nickname || ""}
        shareUrl={binderShareUrl}
        shortId={binder.shortId}
        totalBinderCards={totalBinderCards}
        onOpenChange={setIsShareImageDialogOpen}
      />
      <ModalBinderSettings
        binderId={binder.id}
        binderName={binder.name}
        binderVisibility={binder.visibility}
        open={isSettingsDialogOpen}
        onDeleted={() => navigate("/my-binders")}
        onOpenChange={setIsSettingsDialogOpen}
        onVisibilityUpdated={refetch}
      />
    </>
  );
};
