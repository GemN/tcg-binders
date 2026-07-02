import type { CurrencyCode, MarketPriceSource } from "@app/graphql";
import { useTranslation } from "react-i18next";

import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

interface MarketPriceSummaryProps {
  amount: number | string | null | undefined;
  className?: string;
  currency: CurrencyCode | null | undefined;
  source: MarketPriceSource | null | undefined;
}

export const MarketPriceSummary = ({
  amount,
  className,
  currency: sourceCurrency,
  source,
}: MarketPriceSummaryProps) => {
  const { i18n, t } = useTranslation(["binder"]);
  const { convertAmountToLocalCurrency, currency } = usePricingSettings();

  if (!source || !sourceCurrency || amount === null || amount === undefined) {
    return null;
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return null;

  const convertedAmount = convertAmountToLocalCurrency(
    numericAmount,
    sourceCurrency
  );
  if (convertedAmount === null) return null;

  const formattedOriginalPrice = formatCurrency(
    numericAmount,
    sourceCurrency,
    i18n.language
  );

  return (
    <span className={cn("shrink-0 text-right text-xs", className)}>
      <span className="block font-medium">
        {formatCurrency(convertedAmount, currency, i18n.language)}
        <span className="ml-1 font-normal text-current/60">
          ({formattedOriginalPrice})
        </span>
      </span>
      <span className="block text-current/70">
        {t(`binder:list.${source}_price` as const)}
      </span>
    </span>
  );
};
