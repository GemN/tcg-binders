import { MarketPriceSource } from "@app/graphql";
import { ExternalLink } from "lucide-react";

import { MarketPriceSourceIcon } from "@/components/MarketPriceSourceIcon";
import { Button } from "@/components/ui/Button";
import {
  type BinderCardPriceInput,
  getBinderCardMarketPrice,
} from "@/lib/binderCardPricing";
import { supportedPriceSources } from "@/providers/PricingSettingsContext";

import { BinderCardImagePreview } from "./BinderCardImagePreview";
import type { ModalBinderCardRecord } from "./types";

interface BinderCardMediaPanelProps {
  binderCard: ModalBinderCardRecord | null;
  imageAlt: string;
  imageUrl: string | null | undefined;
  noImageLabel: string;
  showConvertedMarketPrices: boolean;
  formatPrice: (input: BinderCardPriceInput) => string;
  getBuyLabel: (source: MarketPriceSource) => string;
}

export const BinderCardMediaPanel = ({
  binderCard,
  imageAlt,
  imageUrl,
  noImageLabel,
  showConvertedMarketPrices,
  formatPrice,
  getBuyLabel,
}: BinderCardMediaPanelProps) => (
  <div className="flex flex-col gap-3">
    <BinderCardImagePreview
      imageAlt={imageAlt}
      imageUrl={imageUrl}
      noImageLabel={noImageLabel}
    />

    <div className="grid gap-2">
      {supportedPriceSources.map((source) => {
        const marketPrice = binderCard
          ? getBinderCardMarketPrice(binderCard, source)
          : null;
        const priceLabel = formatPrice({
          amount: marketPrice?.amount,
          shouldConvert: showConvertedMarketPrices,
          sourceCurrency: marketPrice?.currency,
        });
        const label = getBuyLabel(source);
        const content = (
          <>
            <span className="flex min-w-0 items-center gap-2">
              <MarketPriceSourceIcon source={source} />
              <span className="truncate">{label}</span>
            </span>
            <span className="ml-auto font-semibold tabular-nums">
              {priceLabel}
            </span>
            {marketPrice?.buyUrl && <ExternalLink className="size-4" />}
          </>
        );

        if (marketPrice?.buyUrl) {
          return (
            <Button
              key={source}
              asChild
              variant="outline"
              className="w-full justify-between px-3 py-2"
            >
              <a href={marketPrice.buyUrl} target="_blank" rel="noreferrer">
                {content}
              </a>
            </Button>
          );
        }

        return (
          <Button
            key={source}
            type="button"
            variant="outline"
            className="w-full justify-between px-3 py-2"
            disabled
          >
            {content}
          </Button>
        );
      })}
    </div>
  </div>
);
