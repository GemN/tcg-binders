import {
  type BinderCardDetailFieldsFragment,
  type BinderCardSummaryFieldsFragment,
  CurrencyCode,
  MarketPriceSource,
} from "@app/graphql";

import { formatCurrency } from "@/lib/currency";
import type { ConvertAmountToLocalCurrency } from "@/providers/PricingSettingsContext";

export type BinderCardRecord = BinderCardSummaryFieldsFragment;
export type BinderCardDetailRecord = BinderCardDetailFieldsFragment;

type BinderCardMarketPrice = NonNullable<
  NonNullable<BinderCardRecord["card"]>["marketPrices"]
>["edges"][number]["node"];

export interface ComparableMarketPriceInput {
  amount: number | string | null | undefined;
  currency: CurrencyCode | null | undefined;
}

export interface FormatBinderCardPriceParams {
  amount: number | string | null | undefined;
  convertAmountToLocalCurrency: ConvertAmountToLocalCurrency;
  displayCurrency: CurrencyCode;
  locale: string;
  shouldConvert: boolean;
  sourceCurrency: CurrencyCode | null | undefined;
}

export type BinderCardPriceInput = Pick<
  FormatBinderCardPriceParams,
  "amount" | "shouldConvert" | "sourceCurrency"
>;

const MARKET_PRICE_COMPARE_EPSILON = 0.000001;
const marketPriceSources = [
  MarketPriceSource.Cardkingdom,
  MarketPriceSource.Tcgplayer,
  MarketPriceSource.Cardmarket,
] as const;

const getComparableMarketPriceAmount = (
  marketPrice: ComparableMarketPriceInput | null,
  convertAmountToLocalCurrency: ConvertAmountToLocalCurrency
): number | null => {
  if (!marketPrice?.currency) return null;

  const amount = Number(marketPrice.amount);
  if (!Number.isFinite(amount)) return null;

  return convertAmountToLocalCurrency(amount, marketPrice.currency);
};

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

export const getCardKingdomUsdMarketPriceAmount = (
  binderCard: BinderCardRecord
): number | null => {
  const cardKingdomPrice = getBinderCardMarketPrice(
    binderCard,
    MarketPriceSource.Cardkingdom
  );
  const cardKingdomUsdMarketPriceAmount = Number(cardKingdomPrice?.amount);

  if (
    cardKingdomPrice?.currency !== CurrencyCode.Usd ||
    !Number.isFinite(cardKingdomUsdMarketPriceAmount)
  ) {
    return null;
  }

  return cardKingdomUsdMarketPriceAmount;
};

export const formatCardKingdomMultiplierThbPriceInput = (
  binderCard: BinderCardRecord,
  multiplier: number
): string | null => {
  const cardKingdomUsdMarketPriceAmount =
    getCardKingdomUsdMarketPriceAmount(binderCard);

  if (cardKingdomUsdMarketPriceAmount === null) return null;

  return (cardKingdomUsdMarketPriceAmount * multiplier).toFixed(2);
};

export const getCheapestMarketPriceSources = (
  marketPrices: Record<MarketPriceSource, ComparableMarketPriceInput | null>,
  convertAmountToLocalCurrency: ConvertAmountToLocalCurrency
): Set<MarketPriceSource> => {
  const comparablePrices = marketPriceSources
    .map((source) => ({
      amount: getComparableMarketPriceAmount(
        marketPrices[source],
        convertAmountToLocalCurrency
      ),
      source,
    }))
    .filter(
      (price): price is { amount: number; source: MarketPriceSource } =>
        price.amount !== null
    );

  if (comparablePrices.length < 2) return new Set();

  const cheapestAmount = Math.min(
    ...comparablePrices.map(({ amount }) => amount)
  );

  return new Set(
    comparablePrices
      .filter(
        ({ amount }) =>
          Math.abs(amount - cheapestAmount) <= MARKET_PRICE_COMPARE_EPSILON
      )
      .map(({ source }) => source)
  );
};

export const formatBinderCardPrice = ({
  amount,
  convertAmountToLocalCurrency,
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

  const convertedAmount = convertAmountToLocalCurrency(
    numericAmount,
    sourceCurrency
  );
  if (convertedAmount === null) return null;

  return formatCurrency(convertedAmount, displayCurrency, locale);
};
