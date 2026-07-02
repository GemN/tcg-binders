import { SlidersHorizontal } from "lucide-react";
import { type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import { CardConditionPicker } from "@/components/CardConditionPicker";
import { InputSearch } from "@/components/InputSearch";
import { LanguagePicker } from "@/components/ModalBinderCardDetail/LanguagePicker";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/Sheet";
import {
  BINDER_CARD_EMPTY_FILTER_VALUE,
  type BinderCardFilterState,
  binderCardFoilingFilterOptions,
} from "@/lib/binderPage";

interface BinderPageSearchFiltersProps {
  activeFilterCount: number;
  filterState: BinderCardFilterState;
  isMobile: boolean;
  onClearFilters: () => void;
  onFilterStateChange: (filterState: BinderCardFilterState) => void;
}

interface BinderPageFilterFieldsProps {
  filterState: BinderCardFilterState;
  idPrefix: string;
  onFilterStateChange: (filterState: BinderCardFilterState) => void;
}

const BinderPageFilterFields = ({
  filterState,
  idPrefix,
  onFilterStateChange,
}: BinderPageFilterFieldsProps) => {
  const { t } = useTranslation(["binder", "common"]);

  const handleFoilingChange = (value: string) => {
    onFilterStateChange({
      ...filterState,
      foiling:
        value === "normal" || value === "foil"
          ? value
          : BINDER_CARD_EMPTY_FILTER_VALUE,
    });
  };

  return (
    <div className="grid gap-4">
      <CardConditionPicker
        allLabel={t("binder:filter.all")}
        getConditionLabel={(condition) =>
          t(`common:card.condition.${condition}`)
        }
        id={`${idPrefix}-condition`}
        label={t("binder:field.condition")}
        labelClassName="gap-2"
        showAllOption
        triggerClassName="w-full"
        value={filterState.condition}
        onChange={(condition) =>
          onFilterStateChange({
            ...filterState,
            condition,
          })
        }
      />
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-foiling`}>
          {t("binder:filter.foiling")}
        </Label>
        <Select value={filterState.foiling} onValueChange={handleFoilingChange}>
          <SelectTrigger id={`${idPrefix}-foiling`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={BINDER_CARD_EMPTY_FILTER_VALUE}>
              {t("binder:filter.all")}
            </SelectItem>
            {binderCardFoilingFilterOptions.map((foiling) => (
              <SelectItem key={foiling} value={foiling}>
                {t(`binder:filter.foiling_option.${foiling}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <LanguagePicker
        allLabel={t("binder:filter.all")}
        getLanguageLabel={(language) =>
          t(`common:card.language.${language}`, {
            defaultValue: language.toUpperCase(),
          })
        }
        id={`${idPrefix}-language`}
        label={t("binder:field.language")}
        labelClassName="gap-2 text-sm text-foreground"
        showAllOption
        triggerClassName="w-full bg-transparent text-foreground"
        value={filterState.language}
        onChange={(language) =>
          onFilterStateChange({
            ...filterState,
            language,
          })
        }
      />
    </div>
  );
};

export const BinderPageSearchFilters = ({
  activeFilterCount,
  filterState,
  isMobile,
  onClearFilters,
  onFilterStateChange,
}: BinderPageSearchFiltersProps) => {
  const { t } = useTranslation(["binder", "common"]);

  const filterFields = (
    <BinderPageFilterFields
      filterState={filterState}
      idPrefix={isMobile ? "binder-filter-sheet" : "binder-filter-popover"}
      onFilterStateChange={onFilterStateChange}
    />
  );

  const filterButton = (
    <Button
      type="button"
      variant={activeFilterCount > 0 ? "default" : "outline"}
      size="sm"
      className="h-9 w-full sm:w-auto"
    >
      <SlidersHorizontal className="size-4" />
      {t("binder:filter.button")}
      {activeFilterCount > 0 && (
        <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-background/20 px-1.5 text-xs tabular-nums">
          {activeFilterCount}
        </span>
      )}
    </Button>
  );

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFilterStateChange({
      ...filterState,
      query: event.target.value,
    });
  };

  const clearFiltersButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full"
      disabled={activeFilterCount === 0}
      onClick={onClearFilters}
    >
      {t("binder:filter.clear")}
    </Button>
  );

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <InputSearch
        aria-label={t("binder:filter.search_label")}
        className="h-9"
        containerClassName="min-w-0 sm:w-72 xl:w-80"
        placeholder={t("binder:filter.search_placeholder")}
        value={filterState.query}
        onChange={handleSearchChange}
      />
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>{filterButton}</SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("binder:filter.title")}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">
              {filterFields}
              <div className="mt-4 border-t pt-3">{clearFiltersButton}</div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Popover>
          <PopoverTrigger asChild>{filterButton}</PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <h2 className="mb-4 text-sm font-semibold">
              {t("binder:filter.title")}
            </h2>
            {filterFields}
            <div className="mt-4 border-t pt-3">{clearFiltersButton}</div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
