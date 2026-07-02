import {
  type BinderCardsFilter,
  type BinderCardsOrderBy,
  CardCondition,
  LanguageCode,
  OrderByDirection,
} from "@app/graphql";

import type { BinderCardViewMode } from "@/components/BinderCard";
import type { DraftCardSnapshot } from "@/hooks/useDraftBinder";

export type BinderSortMode =
  | "seller_order"
  | "last_added"
  | "name"
  | "release_date"
  | "price_asc"
  | "price_desc";

export type BinderCardEmptyFilterValue = "all";
export type BinderCardFoilingFilter = "all" | "normal" | "foil";
export type BinderCardFoilingFilterOption = Exclude<
  BinderCardFoilingFilter,
  BinderCardEmptyFilterValue
>;
export type BinderCardFilterKey =
  | "query"
  | "condition"
  | "foiling"
  | "language";

export interface BinderCardFilterState {
  query: string;
  condition: CardCondition | BinderCardEmptyFilterValue;
  foiling: BinderCardFoilingFilter;
  language: LanguageCode | BinderCardEmptyFilterValue;
}

export const GRID_PAGE_SIZE = 14;
export const LIST_PAGE_SIZE = 100;
export const PRELOAD_PAGE_COUNT = 1;
export const DETAIL_WINDOW_BEFORE_COUNT = 1;
export const DETAIL_WINDOW_CARD_COUNT = 3;
export const MOBILE_CARD_LIMIT = 500;
export const FILTERED_COUNT_PAGE_SIZE = 500;
export const BINDER_CARD_EMPTY_FILTER_VALUE: BinderCardEmptyFilterValue = "all";
export const binderCardConditionFilterOptions = Object.values(
  CardCondition
) as CardCondition[];
export const binderCardFoilingFilterOptions: BinderCardFoilingFilterOption[] = [
  "normal",
  "foil",
];
export const binderCardLanguageFilterOptions = Object.values(
  LanguageCode
) as LanguageCode[];
export const defaultBinderCardFilterState: BinderCardFilterState = {
  query: "",
  condition: BINDER_CARD_EMPTY_FILTER_VALUE,
  foiling: BINDER_CARD_EMPTY_FILTER_VALUE,
  language: BINDER_CARD_EMPTY_FILTER_VALUE,
};

const binderCardFilterSearchParams: Record<BinderCardFilterKey, string> = {
  query: "q",
  condition: "condition",
  foiling: "foiling",
  language: "language",
};

const legacyBinderCardFinishSearchParam = "finish";

const escapeLikePattern = (value: string): string => {
  return value.replace(/[\\%_]/g, "\\$&");
};

const isCardCondition = (value: string | null): value is CardCondition => {
  return binderCardConditionFilterOptions.includes(value as CardCondition);
};

const isCardLanguage = (value: string | null): value is LanguageCode => {
  return binderCardLanguageFilterOptions.includes(value as LanguageCode);
};

const isFoilingFilter = (
  value: string | null
): value is BinderCardFoilingFilter => {
  return value === "normal" || value === "foil";
};

export const getBinderCardFilterStateFromSearchParams = (
  searchParams: URLSearchParams
): BinderCardFilterState => {
  const query = searchParams.get(binderCardFilterSearchParams.query) || "";
  const condition = searchParams.get(binderCardFilterSearchParams.condition);
  const foiling =
    searchParams.get(binderCardFilterSearchParams.foiling) ||
    searchParams.get(legacyBinderCardFinishSearchParam);
  const language = searchParams.get(binderCardFilterSearchParams.language);

  return {
    query,
    condition: isCardCondition(condition)
      ? condition
      : BINDER_CARD_EMPTY_FILTER_VALUE,
    foiling: isFoilingFilter(foiling)
      ? foiling
      : BINDER_CARD_EMPTY_FILTER_VALUE,
    language: isCardLanguage(language)
      ? language
      : BINDER_CARD_EMPTY_FILTER_VALUE,
  };
};

export const getBinderCardFilterSearchParams = (
  currentSearchParams: URLSearchParams,
  filterState: BinderCardFilterState
): URLSearchParams => {
  const nextSearchParams = new URLSearchParams(currentSearchParams);
  const query = filterState.query.trim();

  Object.values(binderCardFilterSearchParams).forEach((param) => {
    nextSearchParams.delete(param);
  });
  nextSearchParams.delete(legacyBinderCardFinishSearchParam);

  if (query) {
    nextSearchParams.set(binderCardFilterSearchParams.query, query);
  }

  if (filterState.condition !== BINDER_CARD_EMPTY_FILTER_VALUE) {
    nextSearchParams.set(
      binderCardFilterSearchParams.condition,
      filterState.condition
    );
  }

  if (filterState.foiling !== BINDER_CARD_EMPTY_FILTER_VALUE) {
    nextSearchParams.set(
      binderCardFilterSearchParams.foiling,
      filterState.foiling
    );
  }

  if (filterState.language !== BINDER_CARD_EMPTY_FILTER_VALUE) {
    nextSearchParams.set(
      binderCardFilterSearchParams.language,
      filterState.language
    );
  }

  return nextSearchParams;
};

export const getBinderCardFilterKey = (
  filterState: BinderCardFilterState
): string => {
  return [
    filterState.query.trim(),
    filterState.condition,
    filterState.foiling,
    filterState.language,
  ].join("|");
};

export const getBinderCardActiveFilterCount = (
  filterState: BinderCardFilterState
): number => {
  let activeFilterCount = 0;

  if (filterState.query.trim()) activeFilterCount += 1;
  if (filterState.condition !== BINDER_CARD_EMPTY_FILTER_VALUE) {
    activeFilterCount += 1;
  }
  if (filterState.foiling !== BINDER_CARD_EMPTY_FILTER_VALUE) {
    activeFilterCount += 1;
  }
  if (filterState.language !== BINDER_CARD_EMPTY_FILTER_VALUE) {
    activeFilterCount += 1;
  }

  return activeFilterCount;
};

export const getBinderCardsFilter = (
  filterState: BinderCardFilterState
): BinderCardsFilter | null => {
  const filters: BinderCardsFilter[] = [];
  const query = filterState.query.trim();

  if (query) {
    filters.push({
      cardName: {
        ilike: `%${escapeLikePattern(query)}%`,
      },
    });
  }

  if (filterState.condition !== BINDER_CARD_EMPTY_FILTER_VALUE) {
    filters.push({
      condition: {
        eq: filterState.condition,
      },
    });
  }

  if (filterState.foiling === "normal") {
    filters.push({
      finish: {
        eq: "normal",
      },
    });
  }

  if (filterState.foiling === "foil") {
    filters.push({
      finish: {
        neq: "normal",
      },
    });
  }

  if (filterState.language !== BINDER_CARD_EMPTY_FILTER_VALUE) {
    filters.push({
      language: {
        eq: filterState.language,
      },
    });
  }

  if (filters.length === 0) return null;
  if (filters.length === 1) return filters[0];

  return { and: filters };
};

interface BinderCardFilterRecord {
  condition: CardCondition;
  finish: string;
  language: LanguageCode;
  card?: {
    collectorNumber?: string | null;
    name?: string | null;
    cardSet?: {
      code?: string | null;
      name?: string | null;
    } | null;
  } | null;
}

export const doesBinderCardMatchFilter = (
  binderCard: BinderCardFilterRecord,
  filterState: BinderCardFilterState
): boolean => {
  const query = filterState.query.trim().toLocaleLowerCase();

  if (query) {
    const searchableValues = [
      binderCard.card?.name,
      binderCard.card?.collectorNumber,
      binderCard.card?.cardSet?.code,
      binderCard.card?.cardSet?.name,
    ];
    const matchesQuery = searchableValues.some((value) =>
      (value || "").toLocaleLowerCase().includes(query)
    );

    if (!matchesQuery) return false;
  }

  if (
    filterState.condition !== BINDER_CARD_EMPTY_FILTER_VALUE &&
    binderCard.condition !== filterState.condition
  ) {
    return false;
  }

  if (filterState.foiling === "normal" && binderCard.finish !== "normal") {
    return false;
  }

  if (filterState.foiling === "foil" && binderCard.finish === "normal") {
    return false;
  }

  if (
    filterState.language !== BINDER_CARD_EMPTY_FILTER_VALUE &&
    binderCard.language !== filterState.language
  ) {
    return false;
  }

  return true;
};

export const getBinderCardsPerPage = (viewMode: BinderCardViewMode): number => {
  return viewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;
};

export const getDefaultFinish = (card: DraftCardSnapshot): string => {
  if (card.finishes.includes("normal")) return "normal";
  return card.finishes[0] || "normal";
};

export const shouldIgnoreBinderViewFocus = (
  target: EventTarget | null
): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    "button, input, textarea, select, [contenteditable='true'], [role='combobox'], [role='textbox']"
  );
};

export const shouldIgnorePageNavigationKey = (
  target: EventTarget | null
): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    "input, textarea, select, [contenteditable='true'], [role='combobox'], [role='textbox'], [data-slot='dialog-content'], [data-slot='dropdown-menu-content'], [data-slot='select-content'], [aria-expanded='true']"
  );
};

export const getBinderCardOrderBy = (
  sortMode: BinderSortMode
): BinderCardsOrderBy[] => {
  if (sortMode === "name") {
    return [
      { cardName: OrderByDirection.AscNullsLast },
      { cardReleasedAt: OrderByDirection.DescNullsLast },
      { id: OrderByDirection.AscNullsLast },
    ];
  }

  if (sortMode === "release_date") {
    return [
      { cardReleasedAt: OrderByDirection.DescNullsLast },
      { cardName: OrderByDirection.AscNullsLast },
      { id: OrderByDirection.AscNullsLast },
    ];
  }

  if (sortMode === "last_added") {
    return [
      { createdAt: OrderByDirection.DescNullsLast },
      { id: OrderByDirection.AscNullsLast },
    ];
  }

  if (sortMode === "price_asc") {
    return [
      { priceAmount: OrderByDirection.AscNullsLast },
      { cardName: OrderByDirection.AscNullsLast },
      { id: OrderByDirection.AscNullsLast },
    ];
  }

  if (sortMode === "price_desc") {
    return [
      { priceAmount: OrderByDirection.DescNullsLast },
      { cardName: OrderByDirection.AscNullsLast },
      { id: OrderByDirection.AscNullsLast },
    ];
  }

  return [
    { position: OrderByDirection.AscNullsLast },
    { createdAt: OrderByDirection.DescNullsLast },
    { id: OrderByDirection.AscNullsLast },
  ];
};
