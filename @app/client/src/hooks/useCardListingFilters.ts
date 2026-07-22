import type { BinderCardsFilter } from "@app/graphql";
import { useCallback, useMemo, useState } from "react";

import {
  type BinderCardFilterState,
  defaultBinderCardFilterState,
  getBinderCardActiveFilterCount,
  getBinderCardsFilter,
} from "@/lib/binderPage";

interface UseCardListingFiltersParams {
  baseFilter: BinderCardsFilter;
}

interface UseCardListingFiltersResult {
  activeFilterCount: number;
  clearFilters: () => void;
  filter: BinderCardsFilter;
  filterState: BinderCardFilterState;
  setFilterState: (filterState: BinderCardFilterState) => void;
}

export const useCardListingFilters = ({
  baseFilter,
}: UseCardListingFiltersParams): UseCardListingFiltersResult => {
  const [filterState, setFilterState] = useState(defaultBinderCardFilterState);
  const activeFilterCount = useMemo(
    () => getBinderCardActiveFilterCount(filterState),
    [filterState]
  );
  const selectedFilter = useMemo(
    () => getBinderCardsFilter(filterState),
    [filterState]
  );
  const filter = useMemo<BinderCardsFilter>(
    () => (selectedFilter ? { and: [baseFilter, selectedFilter] } : baseFilter),
    [baseFilter, selectedFilter]
  );
  const clearFilters = useCallback(
    () => setFilterState(defaultBinderCardFilterState),
    []
  );

  return {
    activeFilterCount,
    clearFilters,
    filter,
    filterState,
    setFilterState,
  };
};
