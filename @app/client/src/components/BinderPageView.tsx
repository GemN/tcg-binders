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
import type { DraftCardSnapshot } from "@/hooks/useDraftBinder";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import type { BinderSortMode } from "@/lib/binderPage";

interface BinderPageViewProps {
  binderId: string;
  binderName: string;
  binderNote: string;
  binderTcgId: string;
  canGoNextDetailCard: boolean;
  canGoPreviousDetailCard: boolean;
  canTurnNextPage: boolean;
  canTurnPreviousPage: boolean;
  cardsPerPage: number;
  headerAction?: ReactNode;
  isAddingCard?: boolean;
  isDeletingCard?: boolean;
  isDeletingSelectedBinderCards: boolean;
  isDetailLoading: boolean;
  isMobile: boolean;
  isOwner: boolean;
  isPageLoading: boolean;
  isSelectionMode: boolean;
  isBulkPriceOpen: boolean;
  pageIndex: number;
  selectedBinderCard: ModalBinderCardRecord | null;
  selectedBinderCardCount: number;
  selectedBinderCardIds: Set<string>;
  selectedBinderCards: BinderCardRecord[];
  selectedCardIndex: number | null;
  showConvertedMarketPrices: boolean;
  sortMode: BinderSortMode;
  totalBinderCards: number;
  totalPages: number;
  viewMode: BinderCardViewMode;
  visibleBinderCards: BinderCardRecord[];
  onAddCard: (card: DraftCardSnapshot) => Promise<unknown> | unknown;
  onBinderCardUpdated: (binderCard: ModalBinderCardRecord) => void;
  onBinderChanged: () => Promise<unknown> | unknown;
  onClearCardSelection: () => void;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onDeleteSelectedBinderCards: () => void;
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
  binderId,
  binderName,
  binderNote,
  binderTcgId,
  canGoNextDetailCard,
  canGoPreviousDetailCard,
  canTurnNextPage,
  canTurnPreviousPage,
  cardsPerPage,
  headerAction,
  isAddingCard,
  isDeletingCard,
  isDeletingSelectedBinderCards,
  isDetailLoading,
  isMobile,
  isOwner,
  isPageLoading,
  isSelectionMode,
  isBulkPriceOpen,
  pageIndex,
  selectedBinderCard,
  selectedBinderCardCount,
  selectedBinderCardIds,
  selectedBinderCards,
  selectedCardIndex,
  showConvertedMarketPrices,
  sortMode,
  totalBinderCards,
  totalPages,
  viewMode,
  visibleBinderCards,
  onAddCard,
  onBinderCardUpdated,
  onBinderChanged,
  onBulkPriceApplied,
  onBulkPriceOpenChange,
  onClearCardSelection,
  onDeleteCard,
  onDeleteSelectedBinderCards,
  onDetailOpenChange,
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

  return (
    <div className="relative isolate flex h-[calc(100svh-3.5rem)] w-full flex-1 overflow-y-auto bg-background text-foreground">
      <div className="relative z-10 flex min-h-full w-full flex-col gap-5 px-4 pb-4 sm:px-6 lg:px-20">
        <BinderPageHeader
          binderId={binderId}
          binderName={binderName}
          binderNote={binderNote}
          binderTcgId={binderTcgId}
          headerAction={headerAction}
          isOwner={isOwner}
          showConvertedMarketPrices={showConvertedMarketPrices}
          onAddCard={onAddCard}
          onBinderChanged={onBinderChanged}
          onImportCards={onImportCards}
          onRenameBinder={onRenameBinder}
          onShowConvertedMarketPricesChange={onShowConvertedMarketPricesChange}
          onUpdateBinderNote={onUpdateBinderNote}
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
          onClearCardSelection={onClearCardSelection}
          onDeleteSelectedBinderCards={onDeleteSelectedBinderCards}
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
          isMobile={isMobile}
          isPageLoading={isPageLoading}
          isSelectionMode={isSelectionMode}
          selectedBinderCardIds={selectedBinderCardIds}
          showConvertedMarketPrices={showConvertedMarketPrices}
          viewMode={viewMode}
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
        isEditable={isOwner}
        isLoading={isDetailLoading}
        open={selectedCardIndex !== null}
        showConvertedMarketPrices={showConvertedMarketPrices}
        totalCards={totalBinderCards}
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
