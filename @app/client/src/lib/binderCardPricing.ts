import type {
  BinderCardDetailFieldsFragment,
  BinderCardSummaryFieldsFragment,
  CurrencyCode,
  MarketPriceSource,
} from "@app/graphql";

import { formatCurrency } from "@/lib/currency";

export type BinderCardRecord = BinderCardSummaryFieldsFragment;
export type BinderCardDetailRecord = BinderCardDetailFieldsFragment;

type BinderCardMarketPrice = NonNullable<
  NonNullable<BinderCardRecord["card"]>["marketPrices"]
>["edges"][number]["node"];

type ConvertAmount = (
  amount: number,
  sourceCurrency: CurrencyCode
) => number | null;

export interface FormatBinderCardPriceParams {
  amount: number | string | null | undefined;
  convertAmount: ConvertAmount;
  displayCurrency: CurrencyCode;
  locale: string;
  shouldConvert: boolean;
  sourceCurrency: CurrencyCode | null | undefined;
}

export type BinderCardPriceInput = Pick<
  FormatBinderCardPriceParams,
  "amount" | "shouldConvert" | "sourceCurrency"
>;

export const getBinderCardMarketPrice = (
  binderCard: BinderCardRecord,
  priceSource: MarketPriceSource
): BinderCardMarketPrice | null => {
  const sourcePrices =
    binderCard.card?.marketPrices?.edges
      .map(({ node }) => node)
      .filter((price) => price.source === priceSource) || [];

  return (
    sourcePrices.find((price) => price.finish === binderCard.finish) ||
    sourcePrices.find((price) => price.finish === "normal") ||
    sourcePrices[0] ||
    null
  );
};

export const formatBinderCardPrice = ({
  amount,
  convertAmount,
  displayCurrency,
  locale,
  shouldConvert,
  sourceCurrency,
}: FormatBinderCardPriceParams): string | null => {
  if (amount === null || amount === undefined || !sourceCurrency) return null;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return null;

  if (!shouldConvert) {
    return formatCurrency(numericAmount, sourceCurrency, locale);
  }

  const convertedAmount = convertAmount(numericAmount, sourceCurrency);
  if (convertedAmount === null) return null;

  return formatCurrency(convertedAmount, displayCurrency, locale);
};
