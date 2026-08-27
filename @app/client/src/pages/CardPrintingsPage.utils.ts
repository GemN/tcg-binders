export type CardPrintingSortMode =
  | "release_date"
  | "price_asc"
  | "price_desc";

export interface SortableCardPrinting {
  id: string;
  lowestPrice: number | null;
  releasedAt: string | null | undefined;
}

export interface AvailableCardPrinting extends SortableCardPrinting {
  listingCount: number;
}

const getReleaseTime = (releasedAt: string | null | undefined) => {
  if (!releasedAt) return null;

  const releaseTime = Date.parse(releasedAt);

  return Number.isNaN(releaseTime) ? null : releaseTime;
};

const compareValuesWithNullsLast = (
  first: number | null,
  second: number | null,
  direction: "asc" | "desc"
) => {
  if (first === null && second === null) return 0;
  if (first === null) return 1;
  if (second === null) return -1;

  return direction === "asc" ? first - second : second - first;
};

export const sortCardPrintings = <TPrinting extends SortableCardPrinting>(
  printings: readonly TPrinting[],
  sortMode: CardPrintingSortMode
): TPrinting[] =>
  [...printings].sort((first, second) => {
    if (sortMode !== "release_date") {
      const priceComparison = compareValuesWithNullsLast(
        first.lowestPrice,
        second.lowestPrice,
        sortMode === "price_asc" ? "asc" : "desc"
      );

      if (priceComparison !== 0) return priceComparison;
    }

    const releaseComparison = compareValuesWithNullsLast(
      getReleaseTime(first.releasedAt),
      getReleaseTime(second.releasedAt),
      "desc"
    );

    return releaseComparison || first.id.localeCompare(second.id);
  });

export const getDisplayedCardPrintings = <
  TPrinting extends AvailableCardPrinting,
>(
  printings: readonly TPrinting[],
  sortMode: CardPrintingSortMode,
  showOnlyAvailable: boolean
): TPrinting[] =>
  sortCardPrintings(
    showOnlyAvailable
      ? printings.filter(({ listingCount }) => listingCount > 0)
      : printings,
    sortMode
  );
