import { ChevronLeft, ChevronRight } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { BinderCardViewMode } from "@/components/BinderCard";
import { BinderCardGrid } from "@/components/BinderCardGrid";
import { BinderCardList } from "@/components/BinderCardList";
import {
  BinderCardGridSkeleton,
  BinderCardListSkeleton,
} from "@/components/BinderCardViewSkeletons";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import {
  shouldIgnoreBinderViewFocus,
  shouldIgnorePageNavigationKey,
} from "@/lib/binderPage";

interface BinderCardViewPanelProps {
  binderCards: BinderCardRecord[];
  canTurnNextPage: boolean;
  canTurnPreviousPage: boolean;
  cardsPerPage: number;
  isDeletingCard?: boolean;
  isDetailOpen: boolean;
  isMobile: boolean;
  isPageLoading: boolean;
  isSelectionMode?: boolean;
  selectedBinderCardIds?: Set<string>;
  showConvertedMarketPrices: boolean;
  viewMode: BinderCardViewMode;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onNextPage: () => void;
  onOpenCard: (binderCard: BinderCardRecord, index: number) => void;
  onPreviousPage: () => void;
  onToggleCardSelection?: (binderCard: BinderCardRecord) => void;
}

export const BinderCardViewPanel = ({
  binderCards,
  canTurnNextPage,
  canTurnPreviousPage,
  cardsPerPage,
  isDeletingCard,
  isDetailOpen,
  isMobile,
  isPageLoading,
  isSelectionMode,
  selectedBinderCardIds,
  showConvertedMarketPrices,
  viewMode,
  onDeleteCard,
  onNextPage,
  onOpenCard,
  onPreviousPage,
  onToggleCardSelection,
}: BinderCardViewPanelProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const binderViewRef = useRef<HTMLDivElement | null>(null);

  const focusBinderView = () => {
    binderViewRef.current?.focus({ preventScroll: true });
  };

  const handleBinderViewKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (shouldIgnorePageNavigationKey(event.target)) return;

    if (event.key === "ArrowLeft" && canTurnPreviousPage) {
      event.preventDefault();
      onPreviousPage();
    }

    if (event.key === "ArrowRight" && canTurnNextPage) {
      event.preventDefault();
      onNextPage();
    }
  };

  useEffect(() => {
    if (isMobile || isDetailOpen) return;

    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (shouldIgnorePageNavigationKey(event.target)) return;

      const binderView = binderViewRef.current;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target !== document.body &&
        !binderView?.contains(target)
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && canTurnPreviousPage) {
        event.preventDefault();
        onPreviousPage();
      }

      if (event.key === "ArrowRight" && canTurnNextPage) {
        event.preventDefault();
        onNextPage();
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);

    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [
    canTurnNextPage,
    canTurnPreviousPage,
    isDetailOpen,
    isMobile,
    onNextPage,
    onPreviousPage,
  ]);

  if (!isPageLoading && binderCards.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed border-binder-toolbar/40 bg-binder-toolbar/15">
        <p className="text-sm text-muted-foreground">
          {t("binder:empty")}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={binderViewRef}
      tabIndex={0}
      onMouseDown={(event) => {
        if (!shouldIgnoreBinderViewFocus(event.target)) {
          focusBinderView();
        }
      }}
      onKeyDown={handleBinderViewKeyDown}
      className="relative -mx-4 min-h-0 flex-1 px-4 pb-4 outline-none sm:-mx-6 sm:px-6 md:pb-0 lg:-mx-20 lg:px-20"
    >
      {!isMobile && (
        <>
          <button
            type="button"
            aria-label={t("common:previous")}
            disabled={!canTurnPreviousPage}
            className="group/page-zone absolute inset-y-0 left-0 z-20 hidden w-4 cursor-pointer items-center justify-center bg-transparent transition-colors hover:bg-linear-to-r hover:from-primary/25 hover:via-primary/5 hover:to-transparent focus-visible:bg-linear-to-r focus-visible:from-primary/25 focus-visible:via-primary/5 focus-visible:to-transparent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-0 sm:w-6 md:flex lg:w-20"
            onClick={() => {
              onPreviousPage();
              focusBinderView();
            }}
          >
            <span className="flex size-4 items-center justify-center rounded-full border border-binder-toolbar-foreground/20 bg-binder-toolbar/80 text-binder-toolbar-foreground/80 shadow-2xl shadow-foreground/20 backdrop-blur transition group-hover/page-zone:scale-110 group-hover/page-zone:bg-primary group-hover/page-zone:text-primary-foreground group-focus-visible/page-zone:scale-110 group-focus-visible/page-zone:bg-primary group-focus-visible/page-zone:text-primary-foreground sm:size-6 lg:size-12">
              <ChevronLeft className="size-3 sm:size-4 lg:size-6" />
            </span>
          </button>
          <button
            type="button"
            aria-label={t("common:next")}
            disabled={!canTurnNextPage}
            className="group/page-zone absolute inset-y-0 right-0 z-20 hidden w-4 cursor-pointer items-center justify-center bg-transparent transition-colors hover:bg-linear-to-l hover:from-primary/25 hover:via-primary/5 hover:to-transparent focus-visible:bg-linear-to-l focus-visible:from-primary/25 focus-visible:via-primary/5 focus-visible:to-transparent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-0 sm:w-6 md:flex lg:w-20"
            onClick={() => {
              onNextPage();
              focusBinderView();
            }}
          >
            <span className="flex size-4 items-center justify-center rounded-full border border-binder-toolbar-foreground/20 bg-binder-toolbar/80 text-binder-toolbar-foreground/80 shadow-2xl shadow-foreground/20 backdrop-blur transition group-hover/page-zone:scale-110 group-hover/page-zone:bg-primary group-hover/page-zone:text-primary-foreground group-focus-visible/page-zone:scale-110 group-focus-visible/page-zone:bg-primary group-focus-visible/page-zone:text-primary-foreground sm:size-6 lg:size-12">
              <ChevronRight className="size-3 sm:size-4 lg:size-6" />
            </span>
          </button>
        </>
      )}
      {isPageLoading ? (
        viewMode === "grid" ? (
          <BinderCardGridSkeleton count={cardsPerPage} />
        ) : (
          <BinderCardListSkeleton count={cardsPerPage} />
        )
      ) : viewMode === "grid" ? (
        <BinderCardGrid
          binderCards={binderCards}
          className="min-h-full"
          isDeletingCard={isDeletingCard}
          isSelectionMode={isSelectionMode}
          noImageLabel={t("binder:no_image")}
          onDeleteCard={onDeleteCard}
          onOpenCard={onOpenCard}
          onToggleCardSelection={onToggleCardSelection}
          selectedBinderCardIds={selectedBinderCardIds}
          showConvertedMarketPrices={showConvertedMarketPrices}
        />
      ) : (
        <BinderCardList
          binderCards={binderCards}
          className="w-full"
          isDeletingCard={isDeletingCard}
          isSelectionMode={isSelectionMode}
          onDeleteCard={onDeleteCard}
          onOpenCard={onOpenCard}
          onToggleCardSelection={onToggleCardSelection}
          selectedBinderCardIds={selectedBinderCardIds}
          showConvertedMarketPrices={showConvertedMarketPrices}
        />
      )}
    </div>
  );
};
