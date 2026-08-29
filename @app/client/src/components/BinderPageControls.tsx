import { Grid2X2, List, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { BinderCardViewMode } from "@/components/BinderCard";
import { BinderPageSearchFilters } from "@/components/BinderPageSearchFilters";
import { ModalConfirmation } from "@/components/ModalConfirmation";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import type { BinderCardFilterState, BinderSortMode } from "@/lib/binderPage";

interface BinderPageControlsProps {
  activeFilterCount: number;
  filterState: BinderCardFilterState;
  canEditBinder: boolean;
  isMobile: boolean;
  isFiltered: boolean;
  isFilteredCountExact: boolean;
  isPageLoading: boolean;
  isSelectionMode: boolean;
  isDeletingSelectedBinderCards: boolean;
  pageIndex: number;
  selectedBinderCardCount: number;
  sortMode: BinderSortMode;
  totalBinderCards: number;
  totalPages: number;
  viewMode: BinderCardViewMode;
  visibleBinderCardCount: number;
  onClearCardSelection: () => void;
  onClearFilters: () => void;
  onDeleteSelectedBinderCards: () => void;
  onFilterStateChange: (filterState: BinderCardFilterState) => void;
  onOpenBulkPrice: () => void;
  onSelectVisibleBinderCards: () => void;
  onSelectionModeChange: (nextIsSelectionMode: boolean) => void;
  onSortChange: (value: string) => void;
  onViewChange: (value: BinderCardViewMode) => void;
}

export const BinderPageControls = ({
  activeFilterCount,
  filterState,
  canEditBinder,
  isMobile,
  isFiltered,
  isFilteredCountExact,
  isPageLoading,
  isSelectionMode,
  isDeletingSelectedBinderCards,
  pageIndex,
  selectedBinderCardCount,
  sortMode,
  totalBinderCards,
  totalPages,
  viewMode,
  visibleBinderCardCount,
  onClearCardSelection,
  onClearFilters,
  onDeleteSelectedBinderCards,
  onFilterStateChange,
  onOpenBulkPrice,
  onSelectVisibleBinderCards,
  onSelectionModeChange,
  onSortChange,
  onViewChange,
}: BinderPageControlsProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const cardCountLabel = isFiltered
    ? t(
        isFilteredCountExact
          ? "binder:filter.matching_count"
          : "binder:filter.matching_count_capped",
        {
          count: totalBinderCards,
        }
      )
    : t("binder:unique_card_count", {
        count: totalBinderCards,
      });

  return (
    <div className="flex shrink-0 flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
      <p className="order-2 shrink-0 text-sm text-muted-foreground md:order-none">
        {isMobile
          ? cardCountLabel
          : t("binder:page_progress", {
              cardCount: cardCountLabel,
              page: pageIndex + 1,
              pageCount: totalPages,
            })}
      </p>
      <div className="order-1 grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-2 md:order-none md:flex md:flex-wrap md:items-center xl:ml-auto xl:flex-nowrap">
        <BinderPageSearchFilters
          activeFilterCount={activeFilterCount}
          filterState={filterState}
          isMobile={isMobile}
          onClearFilters={onClearFilters}
          onFilterStateChange={onFilterStateChange}
        />
        {canEditBinder && (
          <div className="col-span-full row-start-3 flex flex-wrap items-center gap-2 md:col-auto md:row-auto">
            {isSelectionMode ? (
              <>
                <span className="flex h-9 items-center text-sm text-muted-foreground">
                  {t("binder:selection.selected_count", {
                    count: selectedBinderCardCount,
                  })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  disabled={isPageLoading || visibleBinderCardCount === 0}
                  onClick={onSelectVisibleBinderCards}
                >
                  {t("binder:selection.select_page")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={onClearCardSelection}
                >
                  {t("binder:selection.clear")}
                </Button>
                <ModalConfirmation
                  buttonConfirmLabel={t("binder:bulk_delete.confirm")}
                  confirmButtonClassName="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40"
                  confirmDisabled={isDeletingSelectedBinderCards}
                  description={t("binder:bulk_delete.description", {
                    count: selectedBinderCardCount,
                  })}
                  title={t("binder:bulk_delete.title")}
                  trigger={
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-9"
                      disabled={
                        selectedBinderCardCount === 0 ||
                        isDeletingSelectedBinderCards
                      }
                    >
                      <Trash2 className="size-4" />
                      {t("binder:bulk_delete.button")}
                    </Button>
                  }
                  onCancel={() => undefined}
                  onConfirm={onDeleteSelectedBinderCards}
                />
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="h-9"
                  disabled={selectedBinderCardCount === 0}
                  onClick={onOpenBulkPrice}
                >
                  {t("binder:bulk_price.button")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => onSelectionModeChange(false)}
                >
                  {t("binder:selection.done")}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => onSelectionModeChange(true)}
              >
                {t("binder:selection.enter")}
              </Button>
            )}
          </div>
        )}
        {canEditBinder && (
          <div
            className="hidden bg-border md:block md:h-9 md:w-px"
            aria-hidden="true"
          />
        )}
        <Select value={sortMode} onValueChange={onSortChange}>
          <SelectTrigger className="col-start-2 row-start-2 min-w-0 w-full px-2 md:col-auto md:row-auto md:w-48 md:px-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="seller_order">
              {t("binder:sort.seller_order")}
            </SelectItem>
            <SelectItem value="last_added">
              {t("binder:sort.last_added")}
            </SelectItem>
            <SelectItem value="name">{t("binder:sort.name")}</SelectItem>
            <SelectItem value="release_date">
              {t("binder:sort.release_date")}
            </SelectItem>
            <SelectItem value="price_asc">
              {t("binder:sort.price_asc")}
            </SelectItem>
            <SelectItem value="price_desc">
              {t("binder:sort.price_desc")}
            </SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          value={viewMode}
          variant="outline"
          className="col-start-3 row-start-2 w-fit shrink-0 md:col-auto md:row-auto"
          onValueChange={(value) => {
            if (!value) return;
            onViewChange(value as BinderCardViewMode);
          }}
        >
          <ToggleGroupItem
            value="grid"
            className="w-9"
            aria-label={t("binder:view.grid")}
          >
            <Grid2X2 className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            className="w-9"
            aria-label={t("binder:view.list")}
          >
            <List className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};
