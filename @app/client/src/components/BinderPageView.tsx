import type { BinderVisibility } from "@app/graphql";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { BinderCardViewMode } from "@/components/BinderCard";
import { BinderCardViewPanel } from "@/components/BinderCardViewPanel";
import { BinderPageControls } from "@/components/BinderPageControls";
import { BinderPageHeader } from "@/components/BinderPageHeader";
import type { ImportBinderCardsHandler } from "@/components/ButtonImportBinder";
import { ModalBinderCardDetail } from "@/components/ModalBinderCardDetail";
import type {
  ModalBinderCardRecord,
  UpdateBinderCardHandler,
} from "@/components/ModalBinderCardDetail/types";
import {
  ModalBulkBinderCardPrice,
  type UpdateBulkBinderCardPrice,
} from "@/components/ModalBulkBinderCardPrice";
import { NAVBAR_CONTENT_OFFSET_CLASS_NAME } from "@/config/layout";
import type { DraftCardSnapshot } from "@/hooks/useDraftBinder";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import type { BinderCardFilterState, BinderSortMode } from "@/lib/binderPage";
import { cn } from "@/lib/utils";

interface BinderPageViewProps {
  activeFilterCount: number;
  binderId: string;
  binderName: string;
  binderNote: string;
  binderTcgId: string;
  binderVisibility: BinderVisibility;
  canGoNextDetailCard: boolean;
  canGoPreviousDetailCard: boolean;
  canEditBinder: boolean;
  cardsPerPage: number;
  headerAction?: ReactNode;
  isAddingCard?: boolean;
  isCartPreview: boolean;
  isDeletingCard?: boolean;
  isDeletingSelectedBinderCards: boolean;
  isDetailLoading: boolean;
  isFiltered: boolean;
  isFilteredCountExact: boolean;
  isMobile: boolean;
  isPageLoading: boolean;
  isSelectionMode: boolean;
  isBulkPriceOpen: boolean;
  ownerByline?: ReactNode;
  pageIndex: number;
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
  onAddCard: (card: DraftCardSnapshot) => Promise<unknown> | unknown;
  onAddToCart: (binderCard: ModalBinderCardRecord) => void;
  onBinderCardUpdated: (binderCard: ModalBinderCardRecord) => void;
  onBinderChanged: () => Promise<unknown> | unknown;
  onClearCardSelection: () => void;
  onClearFilters: () => void;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onDeleteSelectedBinderCards: () => void;
  onFilterStateChange: (filterState: BinderCardFilterState) => void;
  onGoNextDetailCard: () => void;
  onGoPreviousDetailCard: () => void;
  onImportCards?: ImportBinderCardsHandler;
  onNextPage: () => void;
  onOpenBulkPrice: () => void;
  onOpenCard: (binderCard: BinderCardRecord, index: number) => void;
  onPreviousPage: () => void;
  onRenameBinder?: (name: string) => Promise<unknown> | unknown;
  onSelectVisibleBinderCards: () => void;
  onSelectionModeChange: (nextIsSelectionMode: boolean) => void;
  onShowConvertedMarketPricesChange: (checked: boolean) => void;
  onSortChange: (value: string) => void;
  onToggleCardSelection: (binderCard: BinderCardRecord) => void;
  onUpdateBinderCard?: UpdateBinderCardHandler;
  onUpdateBinderCardPrice?: UpdateBulkBinderCardPrice;
  onUpdateBinderNote?: (note: string) => Promise<unknown> | unknown;
  onViewChange: (value: BinderCardViewMode) => void;
  onDetailOpenChange: (nextOpen: boolean) => void;
  onBulkPriceApplied: () => Promise<unknown> | unknown;
  onBulkPriceOpenChange: (open: boolean) => void;
}

export const BinderPageView = ({
  activeFilterCount,
  binderId,
  binderName,
  binderNote,
  binderTcgId,
  binderVisibility,
  canGoNextDetailCard,
  canGoPreviousDetailCard,
  canEditBinder,
  cardsPerPage,
  headerAction,
  isAddingCard,
  isCartPreview,
  isDeletingCard,
  isDeletingSelectedBinderCards,
  isDetailLoading,
  isFiltered,
  isFilteredCountExact,
  isMobile,
  isPageLoading,
  isSelectionMode,
  isBulkPriceOpen,
  ownerByline,
  pageIndex,
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
  onAddCard,
  onAddToCart,
  onBinderCardUpdated,
  onBinderChanged,
  onBulkPriceApplied,
  onBulkPriceOpenChange,
  onClearCardSelection,
  onClearFilters,
  onDeleteCard,
  onDeleteSelectedBinderCards,
  onDetailOpenChange,
  onFilterStateChange,
  onGoNextDetailCard,
  onGoPreviousDetailCard,
  onImportCards,
  onNextPage,
  onOpenBulkPrice,
  onOpenCard,
  onPreviousPage,
  onRenameBinder,
  onSelectVisibleBinderCards,
  onSelectionModeChange,
  onShowConvertedMarketPricesChange,
  onSortChange,
  onToggleCardSelection,
  onUpdateBinderCard,
  onUpdateBinderCardPrice,
  onUpdateBinderNote,
  onViewChange,
}: BinderPageViewProps) => {
  const { t } = useTranslation(["binder"]);
  const totalPages = Math.max(Math.ceil(totalBinderCards / cardsPerPage), 1);
  const canTurnPreviousPage = !isMobile && pageIndex > 0;
  const canTurnNextPage = !isMobile && pageIndex + 1 < totalPages;

  return (
    <div
      className={cn(
        "relative isolate flex h-[calc(100svh-3.5rem)] w-full flex-1 overflow-y-auto bg-background text-foreground",
        NAVBAR_CONTENT_OFFSET_CLASS_NAME
      )}
    >
      <div className="relative z-10 flex min-h-full w-full flex-col gap-5 px-4 pb-4 sm:px-6 lg:px-20 pt-6">
        <BinderPageHeader
          binderId={binderId}
          binderName={binderName}
          binderNote={binderNote}
          binderTcgId={binderTcgId}
          binderVisibility={binderVisibility}
          canEditBinder={canEditBinder}
          headerAction={headerAction}
          ownerByline={ownerByline}
          showConvertedMarketPrices={showConvertedMarketPrices}
          titleAction={titleAction}
          viewCount={viewCount}
          onAddCard={onAddCard}
          onBinderChanged={onBinderChanged}
          onImportCards={onImportCards}
          onRenameBinder={onRenameBinder}
          onShowConvertedMarketPricesChange={onShowConvertedMarketPricesChange}
          onUpdateBinderNote={onUpdateBinderNote}
        />

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
          emptyLabel={isFiltered ? t("binder:filter.empty") : t("binder:empty")}
          isMobile={isMobile}
          isPageLoading={isPageLoading}
          isSelectionMode={isSelectionMode}
          selectedBinderCardIds={selectedBinderCardIds}
          showConvertedMarketPrices={showConvertedMarketPrices}
          viewMode={viewMode}
          isCartPreview={isCartPreview}
          onAddToCart={canEditBinder ? undefined : onAddToCart}
          onDeleteCard={onDeleteCard}
          onNextPage={onNextPage}
          onOpenCard={onOpenCard}
          onPreviousPage={onPreviousPage}
          onToggleCardSelection={onToggleCardSelection}
        />
      </div>
      <ModalBinderCardDetail
        binderCard={selectedBinderCard}
        canGoNext={canGoNextDetailCard}
        canGoPrevious={canGoPreviousDetailCard}
        currentIndex={selectedCardIndex}
        isCartPreview={isCartPreview}
        isEditable={canEditBinder}
        isLoading={isDetailLoading}
        open={selectedCardIndex !== null}
        showConvertedMarketPrices={showConvertedMarketPrices}
        totalCards={totalBinderCards}
        onAddToCart={onAddToCart}
        onBinderCardUpdated={onBinderCardUpdated}
        onGoNext={onGoNextDetailCard}
        onGoPrevious={onGoPreviousDetailCard}
        onOpenChange={onDetailOpenChange}
        onUpdateBinderCard={onUpdateBinderCard}
      />
      <ModalBulkBinderCardPrice
        binderCards={selectedBinderCards}
        open={isBulkPriceOpen}
        onApplied={onBulkPriceApplied}
        onOpenChange={onBulkPriceOpenChange}
        onUpdateBinderCardPrice={onUpdateBinderCardPrice}
      />
    </div>
  );
};
