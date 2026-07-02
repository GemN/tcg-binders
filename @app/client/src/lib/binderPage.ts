import {
  type BinderCardsOrderBy,
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

export const GRID_PAGE_SIZE = 14;
export const LIST_PAGE_SIZE = 100;
export const PRELOAD_PAGE_COUNT = 1;
export const DETAIL_WINDOW_BEFORE_COUNT = 1;
export const DETAIL_WINDOW_CARD_COUNT = 3;
export const MOBILE_CARD_LIMIT = 500;

export const getBinderCardsPerPage = (
  viewMode: BinderCardViewMode
): number => {
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
