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
    <div className="-mt-2 flex shrink-0 flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
      <p className="shrink-0 text-sm text-muted-foreground">
        {isMobile
          ? cardCountLabel
          : t("binder:page_progress", {
              cardCount: cardCountLabel,
              page: pageIndex + 1,
              pageCount: totalPages,
            })}
      </p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:ml-auto xl:flex-nowrap">
        <BinderPageSearchFilters
          activeFilterCount={activeFilterCount}
          filterState={filterState}
          isMobile={isMobile}
          onClearFilters={onClearFilters}
          onFilterStateChange={onFilterStateChange}
        />
        {canEditBinder && (
          <div className="flex flex-wrap items-center gap-2">
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
            className="h-px w-full bg-border sm:h-9 sm:w-px"
            aria-hidden="true"
          />
        )}
        <Select value={sortMode} onValueChange={onSortChange}>
          <SelectTrigger className="w-full border-border bg-background text-foreground sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-background text-foreground">
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
          size="sm"
          className="h-9 w-full border border-border bg-background text-foreground sm:w-auto"
          onValueChange={(value) => {
            if (!value) return;
            onViewChange(value as BinderCardViewMode);
          }}
        >
          <ToggleGroupItem
            value="grid"
            size="sm"
            aria-label={t("binder:view.grid")}
            className="h-9 flex-1 px-3 text-foreground hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground sm:flex-none"
          >
            <Grid2X2 className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            size="sm"
            aria-label={t("binder:view.list")}
            className="h-9 flex-1 px-3 text-foreground hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground sm:flex-none"
          >
            <List className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};
