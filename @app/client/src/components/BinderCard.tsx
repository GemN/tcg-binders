import type { LanguageCode } from "@app/graphql";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { BinderCardActionsMenu } from "@/components/BinderCardActionsMenu";
import { CardConditionBadge } from "@/components/CardConditionBadge";
import { CardImage } from "@/components/CardImage";
import { CountryFlag } from "@/components/CountryFlag";
import { MarketPriceSourceIcon } from "@/components/MarketPriceSourceIcon";
import { Checkbox } from "@/components/ui/Checkbox";
import { cardLanguageFlagCodes } from "@/config/card";
import { marketPriceSourceClassNames } from "@/config/marketPriceSource";
import {
  type BinderCardRecord,
  formatBinderCardPrice,
  getBinderCardMarketPrice,
} from "@/lib/binderCardPricing";
import { getCardImageBaseUrl, getCardScryfallId } from "@/lib/cardImageUrl";
import { cn } from "@/lib/utils";
import {
  type SupportedPriceSource,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

export type BinderCardViewMode = "grid" | "list";

interface BinderCardPriceStackProps {
  marketPriceLabel: string;
  priceLabel: string;
  priceSource: SupportedPriceSource;
}

const BinderCardPriceStack = ({
  marketPriceLabel,
  priceLabel,
  priceSource,
}: BinderCardPriceStackProps) => (
  <span className="absolute right-2 bottom-2 flex max-w-[calc(100%-3.25rem)] flex-col items-end overflow-hidden rounded-sm bg-black/75 px-2 py-1 text-white shadow-lg shadow-black/20">
    <span
      className={cn(
        "flex max-w-full items-center gap-1.5 text-[11px] font-semibold leading-tight tabular-nums",
        marketPriceSourceClassNames[priceSource]
      )}
    >
      <MarketPriceSourceIcon source={priceSource} className="size-3.5" />
      <span className="min-w-0 truncate">{marketPriceLabel}</span>
    </span>
    <span className="my-0.5 h-px w-full bg-white/15" />
    <span className="max-w-full truncate text-sm font-bold leading-tight tabular-nums text-white">
      {priceLabel}
    </span>
  </span>
);

interface BinderCardImageProps {
  condition: BinderCardRecord["condition"];
  finish: BinderCardRecord["finish"];
  imageUrl: string | null | undefined;
  language: BinderCardRecord["language"];
  languageLabel: string;
  marketPriceLabel: string;
  noImageLabel: string;
  priceLabel: string;
  priceSource: SupportedPriceSource;
  quantityLabel: string;
  scryfallId: string | null | undefined;
  className?: string;
}

const BinderCardImage = ({
  condition,
  finish,
  imageUrl,
  language,
  languageLabel,
  marketPriceLabel,
  noImageLabel,
  priceLabel,
  priceSource,
  quantityLabel,
  scryfallId,
  className,
}: BinderCardImageProps) => {
  return (
    <CardImage
      alt=""
      className={cn(
        "rounded-md border border-primary/25 bg-background/70 shadow-2xl shadow-background/40 ring-1 ring-background/40",
        className
      )}
      fallbackClassName="text-muted-foreground"
      finish={finish}
      imageSize="grid"
      imageUrl={imageUrl}
      noImageLabel={noImageLabel}
      scryfallId={scryfallId}
    >
      <BinderCardPriceStack
        marketPriceLabel={marketPriceLabel}
        priceLabel={priceLabel}
        priceSource={priceSource}
      />
      <span className="absolute bottom-2 left-2 flex w-7 flex-col items-stretch overflow-hidden rounded-sm bg-black/70 text-xs font-semibold tabular-nums text-white">
        <span className="inline-flex w-full items-center justify-center py-0.5">
          {quantityLabel}
        </span>
        <CardConditionBadge
          condition={condition}
          className="h-6 w-full min-w-0 rounded-none px-0 py-0 text-[13px]"
        />
        <CountryFlag
          code={cardLanguageFlagCodes[language as LanguageCode]}
          className="w-7 aspect-[4/3] rounded-none shadow-none"
          label={languageLabel}
        />
      </span>
    </CardImage>
  );
};

interface BinderCardPriceLabels {
  marketPriceLabel: string;
  priceLabel: string;
  priceSource: SupportedPriceSource;
}

const fallbackPrice = "-";

const useBinderCardPriceLabels = (
  binderCard: BinderCardRecord,
  showConvertedMarketPrices: boolean
): BinderCardPriceLabels => {
  const { i18n } = useTranslation(["binder", "common"]);
  const { convertAmountToLocalCurrency, currency, priceSource } =
    usePricingSettings();
  const marketPrice = getBinderCardMarketPrice(binderCard, priceSource);
  const displayPrice = formatBinderCardPrice({
    amount: binderCard.priceAmount,
    convertAmountToLocalCurrency,
    displayCurrency: currency,
    locale: i18n.language,
    shouldConvert: true,
    sourceCurrency: binderCard.priceCurrency,
  });
  const marketPriceLabel = formatBinderCardPrice({
    amount: marketPrice?.amount,
    convertAmountToLocalCurrency,
    displayCurrency: currency,
    locale: i18n.language,
    shouldConvert: showConvertedMarketPrices,
    sourceCurrency: marketPrice?.currency,
  });

  return {
    marketPriceLabel: marketPriceLabel || fallbackPrice,
    priceLabel: displayPrice || fallbackPrice,
    priceSource,
  };
};

interface BinderCardProps {
  binderCard: BinderCardRecord;
  index: number;
  isDeleting?: boolean;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  noImageLabel: string;
  showConvertedMarketPrices: boolean;
  onDelete?: (binderCard: BinderCardRecord) => void;
  onOpen: (binderCard: BinderCardRecord, index: number) => void;
  onToggleSelection?: (binderCard: BinderCardRecord) => void;
}
const BinderCardComponent = ({
  binderCard,
  index,
  isDeleting,
  isSelected = false,
  isSelectionMode = false,
  noImageLabel,
  showConvertedMarketPrices,
  onDelete,
  onOpen,
  onToggleSelection,
}: BinderCardProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const { marketPriceLabel, priceLabel, priceSource } =
    useBinderCardPriceLabels(binderCard, showConvertedMarketPrices);
  const cardName = binderCard.card?.name || noImageLabel;
  const languageLabel = t(`common:card.language.${binderCard.language}`, {
    defaultValue: binderCard.language.toUpperCase(),
  });
  const imageUrl = getCardImageBaseUrl(binderCard.card);
  const scryfallId = getCardScryfallId(binderCard.card);
  const handlePrimaryClick = useCallback(() => {
    if (isSelectionMode) {
      onToggleSelection?.(binderCard);
      return;
    }

    onOpen(binderCard, index);
  }, [binderCard, index, isSelectionMode, onOpen, onToggleSelection]);
  const handleDelete = useCallback(() => {
    onDelete?.(binderCard);
  }, [binderCard, onDelete]);

  return (
    <div className="relative w-full max-w-[12rem] text-left text-foreground">
      {isSelectionMode && (
        <Checkbox
          checked={isSelected}
          aria-label={t("binder:selection.select_card", {
            name: cardName,
          })}
          className="absolute top-2 right-2 z-10 size-5 cursor-pointer border-white/80 bg-black/70 text-white"
          onCheckedChange={() => onToggleSelection?.(binderCard)}
        />
      )}
      <button
        type="button"
        aria-label={
          isSelectionMode
            ? t("binder:selection.select_card", { name: cardName })
            : t("binder:detail.open_card", { name: cardName })
        }
        className="group grid w-full cursor-pointer transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={handlePrimaryClick}
      >
        <BinderCardImage
          condition={binderCard.condition}
          finish={binderCard.finish}
          imageUrl={imageUrl}
          language={binderCard.language}
          languageLabel={languageLabel}
          marketPriceLabel={marketPriceLabel}
          noImageLabel={noImageLabel}
          priceLabel={priceLabel}
          priceSource={priceSource}
          quantityLabel={String(binderCard.quantity)}
          scryfallId={scryfallId}
        />
      </button>
      {onDelete && !isSelectionMode && (
        <BinderCardActionsMenu
          cardName={cardName}
          className="absolute top-2 right-2"
          disabled={isDeleting}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export const BinderCard = memo(BinderCardComponent);
