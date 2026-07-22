import type { CardMarketPrices } from "@app/graphql";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/Skeleton";
import type { CardListingPrice } from "@/hooks/useAllCardListingPrices";
import { getMarketPriceBySourceAndFinish } from "@/lib/binderCardPricing";
import { formatCurrency } from "@/lib/currency";
import {
  type ConvertAmountToLocalCurrency,
  supportedPriceSources,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

type CardMarketPrice = Pick<
  CardMarketPrices,
  "amount" | "currency" | "finish" | "source"
>;

const getConvertedMarketPriceAmount = (
  marketPrice: CardMarketPrice | null | undefined,
  convertAmountToLocalCurrency: ConvertAmountToLocalCurrency
): number | null => {
  if (
    marketPrice?.amount === null ||
    marketPrice?.amount === undefined ||
    !marketPrice.currency
  ) {
    return null;
  }

  const amount = Number(marketPrice.amount);
  if (!Number.isFinite(amount)) return null;

  return convertAmountToLocalCurrency(amount, marketPrice.currency);
};

interface CardPriceStatProps {
  isLoading?: boolean;
  title: string;
  value: string | null;
}

const CardPriceStat = ({
  isLoading = false,
  title,
  value,
}: CardPriceStatProps) => (
  <div className="flex min-w-0 flex-col items-center justify-center px-2 py-3 text-center sm:px-4 sm:py-4">
    <p className="text-xs font-medium text-muted-foreground">{title}</p>
    {isLoading ? (
      <Skeleton className="mt-1.5 h-6 w-20" />
    ) : (
      <p className="mt-1 whitespace-nowrap text-sm font-semibold tabular-nums sm:text-lg">
        {value || "-"}
      </p>
    )}
  </div>
);

interface CardPriceStatsProps {
  isListingPricesLoading: boolean;
  isMarketLowestLoading?: boolean;
  listingPrices: readonly CardListingPrice[];
  marketLowestPrices?: readonly CardMarketPrice[];
  marketPrices: readonly CardMarketPrice[] | null | undefined;
  preferredFinishes: readonly string[];
}

export const CardPriceStats = ({
  isListingPricesLoading,
  isMarketLowestLoading = false,
  listingPrices,
  marketLowestPrices,
  marketPrices,
  preferredFinishes,
}: CardPriceStatsProps) => {
  const { i18n, t } = useTranslation("card");
  const { convertAmountToLocalCurrency, currency } = usePricingSettings();
  const listingAmounts = useMemo(
    () =>
      listingPrices.flatMap((listing) => {
        if (
          listing.priceAmount === null ||
          listing.priceAmount === undefined ||
          !listing.priceCurrency
        ) {
          return [];
        }

        const amount = Number(listing.priceAmount);
        if (!Number.isFinite(amount)) return [];

        const convertedAmount = convertAmountToLocalCurrency(
          amount,
          listing.priceCurrency
        );

        return convertedAmount === null ? [] : [convertedAmount];
      }),
    [convertAmountToLocalCurrency, listingPrices]
  );
  const marketAmounts = useMemo(
    () =>
      supportedPriceSources.flatMap((source) => {
        const marketPrice = getMarketPriceBySourceAndFinish(
          marketPrices,
          source,
          preferredFinishes
        );
        const convertedAmount = getConvertedMarketPriceAmount(
          marketPrice,
          convertAmountToLocalCurrency
        );

        return convertedAmount === null ? [] : [convertedAmount];
      }),
    [convertAmountToLocalCurrency, marketPrices, preferredFinishes]
  );
  const lowestListingAmount =
    listingAmounts.length > 0 ? Math.min(...listingAmounts) : null;
  const marketLowestAmounts = useMemo(
    () =>
      marketLowestPrices?.flatMap((marketPrice) => {
        const convertedAmount = getConvertedMarketPriceAmount(
          marketPrice,
          convertAmountToLocalCurrency
        );

        return convertedAmount === null ? [] : [convertedAmount];
      }) || marketAmounts,
    [convertAmountToLocalCurrency, marketAmounts, marketLowestPrices]
  );
  const lowestMarketAmount =
    marketLowestAmounts.length > 0 ? Math.min(...marketLowestAmounts) : null;
  const averageMarketAmount =
    marketAmounts.length > 0
      ? marketAmounts.reduce((total, amount) => total + amount, 0) /
        marketAmounts.length
      : null;
  const formatPrice = (amount: number | null) =>
    amount === null ? null : formatCurrency(amount, currency, i18n.language);

  return (
    <section
      aria-label={t("stats.title")}
      className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm"
    >
      <CardPriceStat
        isLoading={isListingPricesLoading}
        title={t("stats.lowest_price")}
        value={formatPrice(lowestListingAmount)}
      />
      <CardPriceStat
        isLoading={isMarketLowestLoading}
        title={t("stats.market_price")}
        value={formatPrice(lowestMarketAmount)}
      />
      <CardPriceStat
        title={t("stats.market_average")}
        value={formatPrice(averageMarketAmount)}
      />
    </section>
  );
};
