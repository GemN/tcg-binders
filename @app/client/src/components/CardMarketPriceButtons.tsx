import { type CardMarketPrices, MarketPriceSource } from "@app/graphql";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MarketPriceSourceIcon } from "@/components/MarketPriceSourceIcon";
import { Button } from "@/components/ui/Button";
import { marketPriceSourceClassNames } from "@/config/marketPriceSource";
import {
  type BinderCardPriceInput,
  getMarketPriceBySourceAndFinish,
} from "@/lib/binderCardPricing";
import { cn } from "@/lib/utils";
import { supportedPriceSources } from "@/providers/PricingSettingsContext";

type CardMarketPrice = Pick<
  CardMarketPrices,
  "amount" | "buyUrl" | "currency" | "finish" | "source"
>;

interface CardMarketPriceButtonsProps {
  formatPrice: (input: BinderCardPriceInput) => string;
  marketPrices: readonly CardMarketPrice[] | null | undefined;
  preferredFinishes: readonly string[];
  showConvertedMarketPrices: boolean;
}

export const CardMarketPriceButtons = ({
  formatPrice,
  marketPrices,
  preferredFinishes,
  showConvertedMarketPrices,
}: CardMarketPriceButtonsProps) => {
  const { t } = useTranslation("binder");
  const marketPriceLabels: Record<MarketPriceSource, string> = {
    [MarketPriceSource.Cardkingdom]: t("list.cardkingdom_price"),
    [MarketPriceSource.Cardmarket]: t("list.cardmarket_price"),
    [MarketPriceSource.Tcgplayer]: t("list.tcgplayer_price"),
  };

  return (
    <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
      {supportedPriceSources.map((source) => {
        const marketPrice = getMarketPriceBySourceAndFinish(
          marketPrices,
          source,
          preferredFinishes
        );
        const priceLabel = formatPrice({
          amount: marketPrice?.amount,
          shouldConvert: showConvertedMarketPrices,
          sourceCurrency: marketPrice?.currency,
        });
        const label = t("detail.buy_at", {
          source: marketPriceLabels[source],
        });
        const content = (
          <>
            <span className="flex min-w-0 items-center gap-2">
              <MarketPriceSourceIcon source={source} />
              <span className="hidden truncate lg:inline">{label}</span>
            </span>
            <span className="lg:font-semibold tabular-nums lg:ml-auto">
              {priceLabel}
            </span>
            {marketPrice?.buyUrl && (
              <ExternalLink className="hidden size-4 lg:block" />
            )}
          </>
        );

        if (marketPrice?.buyUrl) {
          return (
            <Button
              key={source}
              asChild
              variant="sand"
              className={cn(
                "w-full justify-center gap-2 rounded-sm px-2 py-2 lg:justify-between lg:gap-2 lg:px-3",
                marketPriceSourceClassNames[source]
              )}
            >
              <a
                href={marketPrice.buyUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
              >
                {content}
              </a>
            </Button>
          );
        }

        return (
          <Button
            key={source}
            type="button"
            variant="sand"
            className={cn(
              "w-full justify-center gap-1 rounded-sm px-2 py-2 lg:justify-between lg:gap-2 lg:px-3",
              marketPriceSourceClassNames[source]
            )}
            disabled
            aria-label={label}
          >
            {content}
          </Button>
        );
      })}
    </div>
  );
};
