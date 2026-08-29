import { NetworkStatus } from "@apollo/client";
import {
  useBinderByShortIdQuery,
  useRecordBinderViewMutation,
  useUserProfileByIdQuery,
} from "@app/graphql";
import {
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
import { Seo } from "@/components/Seo";
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
import { NAVBAR_CONTENT_OFFSET_CLASS_NAME } from "@/config/layout";
import { useBinderCardDetailNavigation } from "@/hooks/useBinderCardDetailNavigation";
import { useBinderCardSelection } from "@/hooks/useBinderCardSelection";
import { useBinderCartActions } from "@/hooks/useBinderCartActions";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/useMobile";
import type {
  BinderCardDetailRecord,
  BinderCardRecord,
} from "@/lib/binderCardPricing";
import {
  type BinderEditingBulkOutcome,
  isBinderEditingCoherenceError,
  presentBinderEditingError,
} from "@/lib/binderEditing";
import {
  addLocallyDeletedBinderCardIds,
  type BinderCardCountAdjustment,
  createBinderCardCountAdjustment,
  excludeLocallyDeletedBinderCards,
  getAppliedBinderCardIds,
  getBinderEditingPageAccess,
  getLocallyAdjustedBinderCardCount,
  reconcileBinderCardCountAdjustment,
} from "@/lib/binderEditing/pageState";
import { useSavedBinderEditing } from "@/lib/binderEditing/saved";
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
  MOBILE_PAGE_SIZE,
  PRELOAD_PAGE_COUNT,
} from "@/lib/binderPage";
import type { CartSellerSnapshot } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { NotFound } from "@/pages/NotFound";
import { usePricingSettings } from "@/providers/PricingSettingsContext";
import { useSession } from "@/providers/SessionContext";

import { createBinderPageSeoMetadata } from "./BinderPage.seo";

const BINDER_VIEW_COOLDOWN_MS = 30 * 60 * 1000;
const BINDER_VIEW_STORAGE_KEY_PREFIX = "tcgbinder:binder-view:";

const isBinderCardViewMode = (
  value: string | null
): value is BinderCardViewMode => value === "grid" || value === "list";

export const BinderPage = () => {
  const { t } = useTranslation(["binder", "checkout", "common"]);
  const { isLoading: isSessionLoading, session } = useSession();
  const { showConvertedMarketPrices } = usePricingSettings();
  const navigate = useNavigate();
  const { shortId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPublicPreview = searchParams.get("public") === "true";
  const viewParam = searchParams.get("view");
  const viewMode: BinderCardViewMode = isBinderCardViewMode(viewParam)
    ? viewParam
    : "grid";
  const isMobile = useIsMobile();
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
  const [pageIndex, setPageIndex] = useState(0);
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [isDeletingCard, setIsDeletingCard] = useState(false);
  const [isDeletingSelectedBinderCards, setIsDeletingSelectedBinderCards] =
    useState(false);
  const [requiresReload, setRequiresReload] = useState(false);
  const [locallyDeletedBinderCardIds, setLocallyDeletedBinderCardIds] =
    useState<Set<string>>(() => new Set());
  const [binderCardCountAdjustment, setBinderCardCountAdjustment] =
    useState<BinderCardCountAdjustment | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isShareImageDialogOpen, setIsShareImageDialogOpen] = useState(false);
  const handleCoherenceFailure = useCallback(() => {
    setRequiresReload(true);
  }, []);

  useEffect(() => {
    if (viewParam === viewMode) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("view", viewMode);
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams, viewMode, viewParam]);

  const cardsPerPage = isMobile
    ? MOBILE_PAGE_SIZE
    : getBinderCardsPerPage(viewMode);
  const cardOffset = pageIndex * cardsPerPage;
  const cardFirst = (PRELOAD_PAGE_COUNT + 1) * cardsPerPage;
  const cardOrderBy = useMemo(() => getBinderCardOrderBy(sortMode), [sortMode]);
  const binderQuery = useBinderByShortIdQuery({
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
  const { data, loading, networkStatus, refetch } = binderQuery;
  const [recordBinderView] = useRecordBinderViewMutation();
  const recordedBinderViewShortIdRef = useRef<string | null>(null);

  useEffect(() => {
    setRequiresReload(false);
    setLocallyDeletedBinderCardIds(new Set());
    setBinderCardCountAdjustment(null);
  }, [shortId]);

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
  const ownerProfileQuery = useUserProfileByIdQuery({
    variables: { id: ownerId },
    skip: !ownerId,
  });
  const { data: ownerProfileData, loading: isOwnerProfileLoading } =
    ownerProfileQuery;
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
  const remoteBinderCards = useMemo(() => {
    return (
      data?.binderCardsByShortId?.edges
        .map(({ node }) => node)
        .filter((binderCard) => !!binderCard.card) || []
    );
  }, [data?.binderCardsByShortId?.edges]);
  const binderCards = useMemo(
    () =>
      excludeLocallyDeletedBinderCards(
        remoteBinderCards,
        locallyDeletedBinderCardIds
      ),
    [locallyDeletedBinderCardIds, remoteBinderCards]
  );
  const visibleBinderCards = binderCards.slice(0, cardsPerPage);
  const seoMetadata = createBinderPageSeoMetadata({
    binderQuery,
    isPublicPreview,
    ownerProfileQuery,
    shortId,
    t,
    visibleBinderCards,
  });
  const currentRemoteFilteredCardCount =
    cardOffset +
    remoteBinderCards.length +
    (data?.binderCardsByShortId?.pageInfo.hasNextPage ? 1 : 0);
  const exactFilteredBinderCardCount =
    isFiltered && typeof data?.binderCardsByShortId?.totalCount === "number"
      ? data.binderCardsByShortId.totalCount
      : null;
  const hasExactFilteredBinderCardCount = exactFilteredBinderCardCount !== null;
  const remoteTotalBinderCardCount = isFiltered
    ? exactFilteredBinderCardCount === null
      ? currentRemoteFilteredCardCount
      : exactFilteredBinderCardCount
    : binder?.binderCardCount ?? remoteBinderCards.length;
  const totalBinderCards = getLocallyAdjustedBinderCardCount(
    remoteTotalBinderCardCount,
    binderCardCountAdjustment,
    debouncedFilterKey
  );

  useEffect(() => {
    if (!binderCardCountAdjustment) return;

    const reconciledAdjustment = reconcileBinderCardCountAdjustment(
      remoteTotalBinderCardCount,
      binderCardCountAdjustment,
      debouncedFilterKey
    );
    if (reconciledAdjustment !== binderCardCountAdjustment) {
      setBinderCardCountAdjustment(reconciledAdjustment);
    }
  }, [
    binderCardCountAdjustment,
    debouncedFilterKey,
    remoteTotalBinderCardCount,
  ]);
  const canTurnNextPage =
    pageIndex + 1 < Math.max(Math.ceil(totalBinderCards / cardsPerPage), 1);
  const isPageLoading = networkStatus === NetworkStatus.setVariables;
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

  useEffect(() => {
    setPageIndex(0);
    clearSelectedBinderCard();
  }, [clearSelectedBinderCard, viewMode]);

  const selectedBinderCardIdRef = useRef<string | null>(null);
  selectedBinderCardIdRef.current = selectedBinderCard?.id ?? null;
  const handleSelectedBinderCardUpdated = useCallback(
    (updatedBinderCard: BinderCardDetailRecord) => {
      if (selectedBinderCardIdRef.current !== updatedBinderCard.id) return;
      setSelectedBinderCard(updatedBinderCard);
    },
    [setSelectedBinderCard]
  );
  const savedBinderEditing = useSavedBinderEditing({
    binderId: binder?.id || "",
    onCardUpdated: handleSelectedBinderCardUpdated,
    refresh: refetch,
    tcgId: binder?.tcgId || "mtg",
  });

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

  const handleDeleteCard = useCallback(
    async (binderCard: BinderCardRecord) => {
      if (isDeletingCard) return;

      setIsDeletingCard(true);
      try {
        try {
          await savedBinderEditing.removeCard(binderCard.id);
        } catch (error) {
          presentBinderEditingError(error, {
            fallbackMessage: t("binder:delete_card_error"),
            reasonMessages: {
              coherence_failed: t("binder:editing.coherence_failed"),
            },
          });
          if (!isBinderEditingCoherenceError(error)) return;
          setLocallyDeletedBinderCardIds((currentIds) =>
            addLocallyDeletedBinderCardIds(currentIds, [binderCard.id])
          );
          setBinderCardCountAdjustment(
            createBinderCardCountAdjustment({
              appliedBinderCardIds: [binderCard.id],
              filterKey: debouncedFilterKey,
              sourceCount: remoteTotalBinderCardCount,
            })
          );
          handleCoherenceFailure();
        }

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
      } finally {
        setIsDeletingCard(false);
      }
    },
    [
      cardsPerPage,
      clearSelectedBinderCard,
      debouncedFilterKey,
      handleCoherenceFailure,
      isDeletingCard,
      removeSelectedBinderCard,
      remoteTotalBinderCardCount,
      savedBinderEditing,
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
      <div
        className={cn(
          "flex flex-1 items-center justify-center",
          NAVBAR_CONTENT_OFFSET_CLASS_NAME
        )}
      >
        <Loading />
      </div>
    );
  }

  if (!binder) {
    return <NotFound metadata={seoMetadata} />;
  }

  const canEditBinder = isOwner && !isPublicPreview;
  const { canMutateBinder, canShowOwnerMetadata, canUseCommerce } =
    getBinderEditingPageAccess({
      isOwner,
      isPublicPreview,
      requiresReload,
    });
  const canSelectBinderCards = canMutateBinder && isSelectionMode;
  const ownerBinderUrl = `/binder/${binder.shortId}`;
  const publicPreviewUrl = `${ownerBinderUrl}?public=true`;
  const binderShareUrl =
    typeof window === "undefined"
      ? `/binder/${binder.shortId}`
      : `${window.location.origin}/binder/${binder.shortId}`;
  const handleOpenSettings = () => setIsSettingsDialogOpen(true);
  const shareDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="secondary">
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
          onClick={handleOpenSettings}
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
        {settingsButton}
        {shareDropdown}
      </>
    )
  ) : (
    shareDropdown
  );
  const mobileHeaderAction =
    isOwner && isPublicPreview ? undefined : shareDropdown;
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
        className="inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap text-sm text-secondary underline-offset-4 hover:text-secondary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
      >
        <Pencil className="size-4" />
        {t("binder:public_preview.owner_view")}
      </Link>
    ) : (
      <Link
        to={publicPreviewUrl}
        className="inline-flex w-fit items-center text-sm text-secondary underline underline-offset-4 hover:text-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
      >
        {t("binder:public_preview.button")}
      </Link>
    )
  ) : undefined;
  const titleAction = ownerViewAction;

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

  const handleBulkPriceApplied = (coherenceFailed: boolean) => {
    handleSelectionModeChange(false);
    if (coherenceFailed) handleCoherenceFailure();
  };

  const handleDeleteSelectedBinderCards = async () => {
    const binderCardsToDelete = selectedBinderCards;

    if (binderCardsToDelete.length === 0 || isDeletingSelectedBinderCards) {
      return;
    }

    setIsDeletingSelectedBinderCards(true);

    try {
      let result: BinderEditingBulkOutcome;
      let coherenceFailed = false;

      try {
        result = await savedBinderEditing.removeCards(
          binderCardsToDelete.map((binderCard) => binderCard.id)
        );
      } catch (error) {
        if (isBinderEditingCoherenceError(error) && error.outcome) {
          result = error.outcome;
          coherenceFailed = true;
          handleCoherenceFailure();
        } else {
          presentBinderEditingError(error, {
            fallbackMessage: t("binder:bulk_delete.failed", {
              count: binderCardsToDelete.length,
            }),
          });
          return;
        }
      }

      const appliedBinderCardIds = getAppliedBinderCardIds(
        binderCardsToDelete.map((binderCard) => binderCard.id),
        result
      );
      const deletedBinderCardIds = new Set(appliedBinderCardIds);
      const deletedCount = result.applied;
      const failedCount = result.failed;

      if (coherenceFailed) {
        setLocallyDeletedBinderCardIds((currentIds) =>
          addLocallyDeletedBinderCardIds(currentIds, appliedBinderCardIds)
        );
        setBinderCardCountAdjustment(
          createBinderCardCountAdjustment({
            appliedBinderCardIds,
            filterKey: debouncedFilterKey,
            sourceCount: remoteTotalBinderCardCount,
          })
        );
      }

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

      if (coherenceFailed) {
        toast.error(
          t("binder:bulk_delete.refresh_failed", {
            count: deletedCount,
            failed: failedCount,
          })
        );
      } else if (failedCount > 0) {
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

    if (selectedCardIndex !== null) {
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
    if (value === viewMode) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("view", value);
    setSearchParams(nextSearchParams);
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
      <Seo metadata={seoMetadata} />
      <BinderPageView
        activeFilterCount={activeFilterCount}
        binderEditing={canMutateBinder ? savedBinderEditing : undefined}
        binderIdentity={binder.shortId}
        binderName={binder.name}
        binderNote={binder.note}
        binderTcgId={binder.tcgId}
        binderVisibility={binder.visibility}
        canUseCommerce={canUseCommerce}
        canGoNextDetailCard={canGoNextDetailCard}
        canGoPreviousDetailCard={canGoPreviousDetailCard}
        cardsPerPage={cardsPerPage}
        headerAction={headerAction}
        isDeletingCard={isDeletingCard}
        isDeletingSelectedBinderCards={isDeletingSelectedBinderCards}
        isDetailLoading={isDetailLoading}
        isFiltered={isFiltered}
        isFilteredCountExact={hasExactFilteredBinderCardCount}
        isMobile={isMobile}
        isOwnerView={canShowOwnerMetadata}
        isPageLoading={isPageLoading}
        isSelectionMode={canSelectBinderCards}
        isBulkPriceOpen={canMutateBinder && isBulkPriceOpen}
        mobileHeaderAction={mobileHeaderAction}
        ownerByline={ownerProfileLink}
        pageIndex={pageIndex}
        requiresReload={requiresReload}
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
        viewCount={
          canShowOwnerMetadata
            ? Number(binder.stats?.viewCount ?? 0)
            : undefined
        }
        viewMode={viewMode}
        visibleBinderCards={visibleBinderCards}
        onAddToCart={handleAddToCart}
        onBulkPriceApplied={handleBulkPriceApplied}
        onBulkPriceOpenChange={setIsBulkPriceOpen}
        onClearCardSelection={clearCardSelection}
        onClearFilters={handleClearFilters}
        onCoherenceFailure={handleCoherenceFailure}
        onDeleteCard={canMutateBinder ? handleDeleteCard : undefined}
        onDeleteSelectedBinderCards={handleDeleteSelectedBinderCards}
        onDetailOpenChange={handleDetailOpenChange}
        onFilterStateChange={handleFilterStateChange}
        onGoNextDetailCard={goToNextDetailCard}
        onGoPreviousDetailCard={goToPreviousDetailCard}
        onNextPage={handleNextPage}
        onOpenBulkPrice={() => setIsBulkPriceOpen(true)}
        onOpenCard={handleOpenCard}
        onOpenSettings={canEditBinder ? handleOpenSettings : undefined}
        onPreviousPage={handlePreviousPage}
        onSelectVisibleBinderCards={handleSelectVisibleBinderCards}
        onSelectionModeChange={handleSelectionModeChange}
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
