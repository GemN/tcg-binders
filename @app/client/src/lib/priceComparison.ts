export type PriceComparisonDirection = "below" | "above" | "even";

export interface PriceComparison {
  direction: PriceComparisonDirection;
  label: string;
}

export const getPriceComparison = (
  listingAmount: number | null | undefined,
  marketAmount: number | null | undefined,
  locale: string
): PriceComparison | null => {
  if (
    listingAmount === null ||
    listingAmount === undefined ||
    marketAmount === null ||
    marketAmount === undefined ||
    !Number.isFinite(listingAmount) ||
    !Number.isFinite(marketAmount) ||
    marketAmount <= 0
  ) {
    return null;
  }

  const deltaRatio = (marketAmount - listingAmount) / marketAmount;
  const direction =
    deltaRatio > 0 ? "below" : deltaRatio < 0 ? "above" : "even";
  const label = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    style: "percent",
  }).format(Math.abs(deltaRatio));

  return { direction, label };
};
