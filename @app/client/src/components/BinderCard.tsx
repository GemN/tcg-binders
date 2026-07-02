import { type LanguageCode, MarketPriceSource } from "@app/graphql";
import { ArrowDown, ArrowUp } from "lucide-react";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { BinderCardActionsMenu } from "@/components/BinderCardActionsMenu";
import { CardConditionBadge } from "@/components/CardConditionBadge";
import { CardImage } from "@/components/CardImage";
import { CountryFlag } from "@/components/CountryFlag";
import { MarketPriceSourceIcon } from "@/components/MarketPriceSourceIcon";
import { Checkbox } from "@/components/ui/Checkbox";
import { cardLanguageFlagCodes } from "@/config/card";
import {
  type BinderCardRecord,
  formatBinderCardPrice,
  getBinderCardMarketPrice,
} from "@/lib/binderCardPricing";
import { getCardImageBaseUrl, getCardScryfallId } from "@/lib/cardImageUrl";
import { cn } from "@/lib/utils";
import {
  type ConvertAmountToLocalCurrency,
  type SupportedPriceSource,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

export type BinderCardViewMode = "grid" | "list";

type BinderCardValueDeltaDirection = "below" | "above" | "even";

interface BinderCardValueDelta {
  direction: BinderCardValueDeltaDirection;
  label: string;
}

interface BinderCardMarketPriceOverlayProps {
  marketPriceLabel: string;
  priceSource: SupportedPriceSource;
  priceSourceLabel: string;
}

const BinderCardMarketPriceOverlay = ({
  marketPriceLabel,
  priceSource,
  priceSourceLabel,
}: BinderCardMarketPriceOverlayProps) => (
  <span className="absolute right-0 bottom-7 z-10 flex max-w-[82%] items-center gap-1 overflow-hidden rounded-l-sm bg-[#22262A]/80 px-1 py-0.5 text-white">
    <MarketPriceSourceIcon source={priceSource} className="size-4.5" />
    <span className="grid min-w-0 text-left">
      <span className="truncate text-[11px] text-[#C7C1BA] leading-[13px]">
        {priceSourceLabel}
      </span>
      <span className="truncate text-xs font-bold tabular-nums text-white leading-[16px]">
        {marketPriceLabel}
      </span>
    </span>
  </span>
);

interface BinderCardStatusStackProps {
  condition: BinderCardRecord["condition"];
  language: BinderCardRecord["language"];
  languageLabel: string;
  quantityLabel: string;
}

const BinderCardStatusStack = ({
  condition,
  language,
  languageLabel,
  quantityLabel,
}: BinderCardStatusStackProps) => (
  <span className="absolute top-[18%] left-0 z-10 flex w-[35px] flex-col items-stretch gap-1 shadow-lg shadow-black/25">
    <CardConditionBadge
      condition={condition}
      className="h-5 w-full min-w-0 rounded-l-none rounded-r-[4px] px-0 py-0 text-xs"
    />
    <span className="flex h-5 w-full items-center justify-center overflow-hidden rounded-r-[4px] bg-white">
      <CountryFlag
        code={cardLanguageFlagCodes[language as LanguageCode]}
        className="aspect-[4/3] w-full rounded-none shadow-none"
        label={languageLabel}
      />
    </span>
    <span className="flex h-5 w-full items-center justify-center rounded-r-[4px] bg-[#22262A]/60 text-xs leading-none tabular-nums text-white">
      x{quantityLabel}
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
  priceSource: SupportedPriceSource;
  priceSourceLabel: string;
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
  priceSource,
  priceSourceLabel,
  quantityLabel,
  scryfallId,
  className,
}: BinderCardImageProps) => {
  return (
    <CardImage
      alt=""
      className={cn(
        "border border-primary/25 bg-background/70 shadow-2xl shadow-background/40 ring-1 ring-background/40",
        className
      )}
      fallbackClassName="text-muted-foreground"
      finish={finish}
      imageSize="grid"
      imageUrl={imageUrl}
      noImageLabel={noImageLabel}
      scryfallId={scryfallId}
    >
      <BinderCardMarketPriceOverlay
        marketPriceLabel={marketPriceLabel}
        priceSource={priceSource}
        priceSourceLabel={priceSourceLabel}
      />
      <BinderCardStatusStack
        condition={condition}
        language={language}
        languageLabel={languageLabel}
        quantityLabel={quantityLabel}
      />
    </CardImage>
  );
};

interface BinderCardPriceSummaryProps {
  listedAtLabel: string;
  listedPriceLabel: string | null;
  priceLabel: string;
  valueDelta: BinderCardValueDelta | null;
}

const BinderCardPriceSummary = ({
  listedAtLabel,
  listedPriceLabel,
  priceLabel,
  valueDelta,
}: BinderCardPriceSummaryProps) => (
  <span className="grid min-h-12 items-start justify-items-end gap-0.5 text-right">
    <span
      className={cn(
        "flex max-w-full items-center justify-end gap-1.5 overflow-hidden text-base font-bold leading-tight tabular-nums",
        valueDelta?.direction === "below" && "text-success",
        valueDelta?.direction === "above" && "text-destructive",
        (!valueDelta || valueDelta.direction === "even") && "text-foreground"
      )}
    >
      {valueDelta && valueDelta.direction !== "even" && (
        <span
          className={cn(
            "inline-flex min-w-0 items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-xs font-bold leading-none",
            valueDelta.direction === "below" && "bg-success/15 text-success",
            valueDelta.direction === "above" &&
              "bg-destructive/15 text-destructive"
          )}
        >
          {valueDelta.direction === "below" ? (
            <ArrowDown aria-hidden="true" className="size-3" />
          ) : (
            <ArrowUp aria-hidden="true" className="size-3" />
          )}
          <span className="truncate">{valueDelta.label}</span>
        </span>
      )}
      <span className="min-w-0 truncate">{priceLabel}</span>
    </span>
    {listedPriceLabel && (
      <span className="max-w-full truncate text-xs leading-tight text-muted-foreground">
        {listedAtLabel} {listedPriceLabel}
      </span>
    )}
  </span>
);

interface BinderCardPriceLabels {
  listedPriceLabel: string | null;
  marketPriceLabel: string;
  priceLabel: string;
  priceSource: SupportedPriceSource;
  priceSourceLabel: string;
  valueDelta: BinderCardValueDelta | null;
}

const fallbackPrice = "-";

interface LocalCurrencyAmountInput {
  amount: number | string | null | undefined;
  sourceCurrency: BinderCardRecord["priceCurrency"] | null | undefined;
}

const getLocalCurrencyAmount = (
  { amount, sourceCurrency }: LocalCurrencyAmountInput,
  convertAmountToLocalCurrency: ConvertAmountToLocalCurrency
): number | null => {
  if (!sourceCurrency) return null;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return null;

  return convertAmountToLocalCurrency(numericAmount, sourceCurrency);
};

const getBinderCardValueDelta = (
  priceAmount: number | null,
  marketPriceAmount: number | null,
  locale: string
): BinderCardValueDelta | null => {
  if (priceAmount === null || marketPriceAmount === null) return null;
  if (marketPriceAmount <= 0) return null;

  const deltaRatio = (marketPriceAmount - priceAmount) / marketPriceAmount;
  const direction =
    deltaRatio > 0 ? "below" : deltaRatio < 0 ? "above" : "even";
  const label = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    style: "percent",
  }).format(Math.abs(deltaRatio));

  return { direction, label };
};

const useBinderCardPriceLabels = (
  binderCard: BinderCardRecord,
  showConvertedMarketPrices: boolean
): BinderCardPriceLabels => {
  const { i18n, t } = useTranslation(["binder", "common"]);
  const { convertAmountToLocalCurrency, currency, priceSource } =
    usePricingSettings();
  const marketPrice = getBinderCardMarketPrice(binderCard, priceSource);
  const hasPriceSet =
    binderCard.priceAmount !== null &&
    binderCard.priceAmount !== undefined &&
    !!binderCard.priceCurrency;
  const shouldShowListedPrice =
    hasPriceSet && binderCard.priceCurrency !== currency;
  const displayPrice = formatBinderCardPrice({
    amount: binderCard.priceAmount,
    convertAmountToLocalCurrency,
    displayCurrency: currency,
    locale: i18n.language,
    shouldConvert: true,
    sourceCurrency: binderCard.priceCurrency,
  });
  const listedPrice = formatBinderCardPrice({
    amount: binderCard.priceAmount,
    convertAmountToLocalCurrency,
    displayCurrency: currency,
    locale: i18n.language,
    shouldConvert: false,
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
  const localPriceAmount = getLocalCurrencyAmount(
    {
      amount: binderCard.priceAmount,
      sourceCurrency: binderCard.priceCurrency,
    },
    convertAmountToLocalCurrency
  );
  const localMarketPriceAmount = getLocalCurrencyAmount(
    {
      amount: marketPrice?.amount,
      sourceCurrency: marketPrice?.currency,
    },
    convertAmountToLocalCurrency
  );
  const priceSourceLabel =
    priceSource === MarketPriceSource.Cardkingdom
      ? t("binder:list.cardkingdom_price")
      : priceSource === MarketPriceSource.Cardmarket
        ? t("binder:list.cardmarket_price")
        : t("binder:list.tcgplayer_price");

  return {
    listedPriceLabel: shouldShowListedPrice ? listedPrice : null,
    marketPriceLabel: marketPriceLabel || fallbackPrice,
    priceLabel: displayPrice || fallbackPrice,
    priceSource,
    priceSourceLabel,
    valueDelta: hasPriceSet
      ? getBinderCardValueDelta(
          localPriceAmount,
          localMarketPriceAmount,
          i18n.language
        )
      : null,
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
  const {
    listedPriceLabel,
    marketPriceLabel,
    priceLabel,
    priceSource,
    priceSourceLabel,
    valueDelta,
  } = useBinderCardPriceLabels(binderCard, showConvertedMarketPrices);
  const cardName = binderCard.card?.name || noImageLabel;
  const listedAtLabel = t("binder:detail.listed_at");
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
        className="group grid w-full cursor-pointer gap-2 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
          priceSource={priceSource}
          priceSourceLabel={priceSourceLabel}
          quantityLabel={String(binderCard.quantity)}
          scryfallId={scryfallId}
        />
        <BinderCardPriceSummary
          listedAtLabel={listedAtLabel}
          listedPriceLabel={listedPriceLabel}
          priceLabel={priceLabel}
          valueDelta={valueDelta}
        />
      </button>
      {onDelete && !isSelectionMode && (
        <BinderCardActionsMenu
          cardName={cardName}
          className="absolute top-2 right-2"
          disabled={isDeleting}
          onDelete={handleDelete}
          triggerVariant="card"
        />
      )}
    </div>
  );
};

export const BinderCard = memo(BinderCardComponent);
