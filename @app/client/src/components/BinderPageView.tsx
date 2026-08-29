import type { BinderVisibility } from "@app/graphql";
import { type ReactNode, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { BinderCardViewMode } from "@/components/BinderCard";
import { BinderCardViewPanel } from "@/components/BinderCardViewPanel";
import { BinderPageControls } from "@/components/BinderPageControls";
import { BinderPageHeader } from "@/components/BinderPageHeader";
import { ModalBinderCardDetail } from "@/components/ModalBinderCardDetail";
import type { ModalBinderCardRecord } from "@/components/ModalBinderCardDetail/types";
import { ModalBulkBinderCardPrice } from "@/components/ModalBulkBinderCardPrice";
import { NAVBAR_CONTENT_OFFSET_CLASS_NAME } from "@/config/layout";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import type { BinderEditing } from "@/lib/binderEditing";
import type { BinderCardFilterState, BinderSortMode } from "@/lib/binderPage";
import { cn } from "@/lib/utils";

interface BinderPageViewProps {
  activeFilterCount: number;
  binderEditing?: BinderEditing;
  binderIdentity: string;
  binderName: string;
  binderNote: string;
  binderTcgId: string;
  binderVisibility: BinderVisibility;
  canUseCommerce: boolean;
  canGoNextDetailCard: boolean;
  canGoPreviousDetailCard: boolean;
  cardsPerPage: number;
  headerAction?: ReactNode;
  isDeletingCard?: boolean;
  isDeletingSelectedBinderCards: boolean;
  isDetailLoading: boolean;
  isFiltered: boolean;
  isFilteredCountExact: boolean;
  isMobile: boolean;
  isOwnerView: boolean;
  isPageLoading: boolean;
  isSelectionMode: boolean;
  isBulkPriceOpen: boolean;
  mobileHeaderAction?: ReactNode;
  ownerByline?: ReactNode;
  pageIndex: number;
  requiresReload: boolean;
  selectedBinderCard: ModalBinderCardRecord | null;
  selectedBinderCardCount: number;
  selectedBinderCardIds: Set<string>;
  selectedBinderCards: BinderCardRecord[];
  selectedCardIndex: number | null;
  showConvertedMarketPrices: boolean;
  sortMode: BinderSortMode;
  filterState: BinderCardFilterState;
  titleAction?: ReactNode;
  totalBinderCards: number;
  viewCount?: number;
  viewMode: BinderCardViewMode;
  visibleBinderCards: BinderCardRecord[];
  onAddToCart: (binderCard: ModalBinderCardRecord) => void;
  onClearCardSelection: () => void;
  onClearFilters: () => void;
  onCoherenceFailure?: () => void;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onDeleteSelectedBinderCards: () => void;
  onFilterStateChange: (filterState: BinderCardFilterState) => void;
  onGoNextDetailCard: () => void;
  onGoPreviousDetailCard: () => void;
  onNextPage: () => void;
  onOpenBulkPrice: () => void;
  onOpenCard: (binderCard: BinderCardRecord, index: number) => void;
  onOpenSettings?: () => void;
  onPreviousPage: () => void;
  onSelectVisibleBinderCards: () => void;
  onSelectionModeChange: (nextIsSelectionMode: boolean) => void;
  onSortChange: (value: string) => void;
  onToggleCardSelection: (binderCard: BinderCardRecord) => void;
  onViewChange: (value: BinderCardViewMode) => void;
  onDetailOpenChange: (nextOpen: boolean) => void;
  onBulkPriceApplied: (coherenceFailed: boolean) => Promise<unknown> | unknown;
  onBulkPriceOpenChange: (open: boolean) => void;
}

export const BinderPageView = ({
  activeFilterCount,
  binderEditing,
  binderIdentity,
  binderName,
  binderNote,
  binderTcgId,
  binderVisibility,
  canUseCommerce,
  canGoNextDetailCard,
  canGoPreviousDetailCard,
  cardsPerPage,
  headerAction,
  isDeletingCard,
  isDeletingSelectedBinderCards,
  isDetailLoading,
  isFiltered,
  isFilteredCountExact,
  isMobile,
  isOwnerView,
  isPageLoading,
  isSelectionMode,
  isBulkPriceOpen,
  mobileHeaderAction,
  ownerByline,
  pageIndex,
  requiresReload,
  selectedBinderCard,
  selectedBinderCardCount,
  selectedBinderCardIds,
  selectedBinderCards,
  selectedCardIndex,
  showConvertedMarketPrices,
  sortMode,
  filterState,
  titleAction,
  totalBinderCards,
  viewCount,
  viewMode,
  visibleBinderCards,
  onAddToCart,
  onBulkPriceApplied,
  onBulkPriceOpenChange,
  onClearCardSelection,
  onClearFilters,
  onCoherenceFailure,
  onDeleteCard,
  onDeleteSelectedBinderCards,
  onDetailOpenChange,
  onFilterStateChange,
  onGoNextDetailCard,
  onGoPreviousDetailCard,
  onNextPage,
  onOpenBulkPrice,
  onOpenCard,
  onOpenSettings,
  onPreviousPage,
  onSelectVisibleBinderCards,
  onSelectionModeChange,
  onSortChange,
  onToggleCardSelection,
  onViewChange,
}: BinderPageViewProps) => {
  const { t } = useTranslation(["binder"]);
  const binderPageRef = useRef<HTMLDivElement | null>(null);
  const canEditBinder = !!binderEditing;
  const totalPages = Math.max(Math.ceil(totalBinderCards / cardsPerPage), 1);
  const canTurnPreviousPage = pageIndex > 0;
  const canTurnNextPage = pageIndex + 1 < totalPages;
  const scrollBinderPageToTop = () => {
    binderPageRef.current?.scrollTo({ behavior: "smooth", top: 0 });
  };
  const handlePreviousPage = () => {
    onPreviousPage();
    scrollBinderPageToTop();
  };
  const handleNextPage = () => {
    onNextPage();
    scrollBinderPageToTop();
  };

  return (
    <div
      ref={binderPageRef}
      className={cn(
        "relative isolate flex h-[calc(100svh-3.5rem)] w-full flex-1 flex-col overflow-y-auto bg-surface text-foreground",
        NAVBAR_CONTENT_OFFSET_CLASS_NAME
      )}
    >
      <div className="relative z-10 w-full shrink-0 bg-surface px-4 pb-4 pt-2 sm:px-6 lg:px-[60px] sm:py-6">
        <BinderPageHeader
          key={`header-${binderIdentity}`}
          binderEditing={binderEditing}
          binderName={binderName}
          binderNote={binderNote}
          binderTcgId={binderTcgId}
          binderVisibility={binderVisibility}
          headerAction={headerAction}
          isOwnerView={isOwnerView}
          mobileHeaderAction={mobileHeaderAction}
          ownerByline={ownerByline}
          titleAction={titleAction}
          viewCount={viewCount}
          onCoherenceFailure={onCoherenceFailure}
          onOpenSettings={onOpenSettings}
        />
      </div>

      <div className="relative z-10 flex w-full flex-1 flex-col gap-5 bg-background px-4 pb-4 pt-6 sm:px-6 lg:px-[60px]">
        {requiresReload && (
          <p
            role="status"
            className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {t("binder:editing.coherence_failed")}
          </p>
        )}

        <BinderPageControls
          activeFilterCount={activeFilterCount}
          filterState={filterState}
          isFiltered={isFiltered}
          isFilteredCountExact={isFilteredCountExact}
          isMobile={isMobile}
          canEditBinder={canEditBinder}
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
          onClearCardSelection={onClearCardSelection}
          onClearFilters={onClearFilters}
          onDeleteSelectedBinderCards={onDeleteSelectedBinderCards}
          onFilterStateChange={onFilterStateChange}
          onOpenBulkPrice={onOpenBulkPrice}
          onSelectVisibleBinderCards={onSelectVisibleBinderCards}
          onSelectionModeChange={onSelectionModeChange}
          onSortChange={onSortChange}
          onViewChange={onViewChange}
        />

        <BinderCardViewPanel
          binderCards={visibleBinderCards}
          canTurnNextPage={canTurnNextPage}
          canTurnPreviousPage={canTurnPreviousPage}
          cardsPerPage={cardsPerPage}
          isDeletingCard={isDeletingCard || isDeletingSelectedBinderCards}
          isDetailOpen={selectedCardIndex !== null}
          emptyLabel={isFiltered ? t("binder:filter.empty") : t("binder:empty")}
          isMobile={isMobile}
          isPageLoading={isPageLoading}
          isSelectionMode={isSelectionMode}
          pageIndex={pageIndex}
          selectedBinderCardIds={selectedBinderCardIds}
          showConvertedMarketPrices={showConvertedMarketPrices}
          totalPages={totalPages}
          viewMode={viewMode}
          onAddToCart={canUseCommerce ? onAddToCart : undefined}
          onDeleteCard={onDeleteCard}
          onNextPage={handleNextPage}
          onOpenCard={onOpenCard}
          onPreviousPage={handlePreviousPage}
          onToggleCardSelection={onToggleCardSelection}
        />
      </div>
      <ModalBinderCardDetail
        key={`detail-${binderIdentity}`}
        binderEditing={binderEditing}
        binderCard={selectedBinderCard}
        canUseCommerce={canUseCommerce}
        canGoNext={canGoNextDetailCard}
        canGoPrevious={canGoPreviousDetailCard}
        currentIndex={selectedCardIndex}
        isLoading={isDetailLoading}
        open={selectedCardIndex !== null}
        showConvertedMarketPrices={showConvertedMarketPrices}
        totalCards={totalBinderCards}
        onAddToCart={onAddToCart}
        onCoherenceFailure={onCoherenceFailure}
        onGoNext={onGoNextDetailCard}
        onGoPrevious={onGoPreviousDetailCard}
        onOpenChange={onDetailOpenChange}
      />
      {binderEditing && (
        <ModalBulkBinderCardPrice
          binderEditing={binderEditing}
          binderCards={selectedBinderCards}
          open={isBulkPriceOpen}
          onApplied={onBulkPriceApplied}
          onOpenChange={onBulkPriceOpenChange}
        />
      )}
    </div>
  );
};
