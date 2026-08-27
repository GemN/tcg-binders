import type { CardMarketPrices } from "@app/graphql";
import { Info } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { PriceComparisonBadge } from "@/components/PriceComparisonBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import type { CardListingPrice } from "@/hooks/useAllCardListingPrices";
import { getMarketPriceBySourceAndFinish } from "@/lib/binderCardPricing";
import { formatCurrency } from "@/lib/currency";
import {
  getPriceComparison,
  type PriceComparison,
} from "@/lib/priceComparison";
import { cn } from "@/lib/utils";
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
  className?: string;
  comparison?: PriceComparison | null;
  comparisonAccessibleLabel?: string;
  isLoading?: boolean;
  showDivider?: boolean;
  title: string;
  tooltip?: string;
  value: string | null;
}

const CardPriceStat = ({
  className,
  comparison,
  comparisonAccessibleLabel,
  isLoading = false,
  showDivider = false,
  title,
  tooltip,
  value,
}: CardPriceStatProps) => (
  <div
    className={cn(
      "relative flex min-w-0 flex-col items-center justify-center px-2 py-3 text-center sm:items-start sm:px-4 sm:py-4",
      showDivider &&
        "before:absolute before:top-1/4 before:left-0 before:h-1/2 before:border-l before:border-border",
      className
    )}
  >
    <p className="text-sm font-medium text-primary font-display">{title}</p>
    {isLoading ? (
      <Skeleton className="mt-1.5 h-6 w-20" />
    ) : (
      <div className="mt-1 flex items-center gap-1.5">
        <p
          className={cn(
            "whitespace-nowrap text-base font-semibold tabular-nums sm:text-lg",
            comparison?.direction === "below" && "text-success",
            comparison?.direction === "above" && "text-error"
          )}
        >
          {value || "-"}
        </p>
        <PriceComparisonBadge
          accessibleLabel={comparisonAccessibleLabel}
          comparison={comparison}
        />
        {tooltip && value && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={tooltip}
                className="inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Info aria-hidden="true" className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64" sideOffset={4}>
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
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
  const lowestListingComparison =
    isListingPricesLoading || isMarketLowestLoading
      ? null
      : getPriceComparison(
          lowestListingAmount,
          lowestMarketAmount,
          i18n.language
        );
  const formatPrice = (amount: number | null) =>
    amount === null ? null : formatCurrency(amount, currency, i18n.language);

  return (
    <section
      aria-label={t("stats.title")}
      className="flex flex-col gap-2 text-primary sm:grid sm:grid-cols-3 sm:gap-0 sm:overflow-hidden sm:rounded-md sm:border sm:border-border sm:border-dashed"
    >
      <CardPriceStat
        className="rounded-md border border-border border-dashed sm:rounded-none sm:border-0"
        comparison={lowestListingComparison}
        comparisonAccessibleLabel={
          lowestListingComparison?.direction === "below"
            ? t("stats.below_market", {
                percentage: lowestListingComparison.label,
              })
            : lowestListingComparison?.direction === "above"
              ? t("stats.above_market", {
                  percentage: lowestListingComparison.label,
                })
              : undefined
        }
        isLoading={isListingPricesLoading}
        title={t("stats.lowest_price")}
        value={formatPrice(lowestListingAmount)}
      />
      <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border border-dashed sm:contents">
        <CardPriceStat
          className="max-sm:before:hidden"
          isLoading={isMarketLowestLoading}
          showDivider
          title={t("stats.market_price")}
          tooltip={t("stats.market_lowest_tooltip")}
          value={formatPrice(lowestMarketAmount)}
        />
        <CardPriceStat
          showDivider
          title={t("stats.market_average")}
          value={formatPrice(averageMarketAmount)}
        />
      </div>
    </section>
  );
};
