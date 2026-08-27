import { type LanguageCode, MarketPriceSource } from "@app/graphql";
import { ShoppingCart } from "lucide-react";
import { memo, type MouseEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { BinderCardActionsMenu } from "@/components/BinderCardActionsMenu";
import { CardConditionBadge } from "@/components/CardConditionBadge";
import { CardImage } from "@/components/CardImage";
import { CountryFlag } from "@/components/CountryFlag";
import { MarketPriceSourceIcon } from "@/components/MarketPriceSourceIcon";
import { PriceComparisonBadge } from "@/components/PriceComparisonBadge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { cardLanguageFlagCodes } from "@/config/card";
import {
  type BinderCardRecord,
  formatBinderCardPrice,
  getBinderCardMarketPrice,
} from "@/lib/binderCardPricing";
import { getCardImageBaseUrl, getCardScryfallId } from "@/lib/cardImageUrl";
import {
  getPriceComparison,
  type PriceComparison,
} from "@/lib/priceComparison";
import { cn } from "@/lib/utils";
import {
  type ConvertAmountToLocalCurrency,
  type SupportedPriceSource,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

export type BinderCardViewMode = "grid" | "list";

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
        " bg-background/70 shadow-2xl shadow-background/40 ring-1 ring-background/40" +
          " outline outline-4 outline-offset-0 outline-transparent transition-[outline-color] group-hover/card-image:outline-primary/70 " +
          "group-focus-within/card-image:outline-primary",
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
  valueDelta: PriceComparison | null;
}

const BinderCardPriceSummary = ({
  listedAtLabel,
  listedPriceLabel,
  priceLabel,
  valueDelta,
}: BinderCardPriceSummaryProps) => (
  <span className="grid items-start justify-items-end text-right gap-0.5">
    <span
      className={cn(
        "flex max-w-full items-center justify-end gap-1.5 overflow-hidden text-base font-bold leading-tight tabular-nums",
        valueDelta?.direction === "below" && "text-success",
        valueDelta?.direction === "above" && "text-error",
        (!valueDelta || valueDelta.direction === "even") && "text-foreground"
      )}
    >
      <PriceComparisonBadge comparison={valueDelta} />
      <span className="min-w-0 truncate">{priceLabel}</span>
    </span>
    {listedPriceLabel && (
      <span className="max-w-full truncate leading-none text-muted-foreground">
        <span className="text-xs font-normal">{listedAtLabel}</span>{" "}
        <span className="text-sm font-medium">{listedPriceLabel}</span>
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
  valueDelta: PriceComparison | null;
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
      ? getPriceComparison(
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
  isCartPreview?: boolean;
  onAddToCart?: (binderCard: BinderCardRecord) => void;
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
  isCartPreview,
  onAddToCart,
  onDelete,
  onOpen,
  onToggleSelection,
}: BinderCardProps) => {
  const { t } = useTranslation(["binder", "checkout", "common"]);
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
  const handleAddToCartClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onAddToCart?.(binderCard);

      if (event.detail > 0) {
        event.currentTarget.blur();
      }
    },
    [binderCard, onAddToCart]
  );
  const addToCartLabel = isCartPreview
    ? t("checkout:add_preview_item")
    : t("binder:detail.add_to_basket");

  return (
    <div className="group/card-image relative w-full max-w-[12rem] text-left text-foreground">
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
      <div className="grid w-full gap-2">
        <div className="relative">
          <button
            type="button"
            aria-label={
              isSelectionMode
                ? t("binder:selection.select_card", { name: cardName })
                : t("binder:detail.open_card", { name: cardName })
            }
            className="block w-full cursor-pointer focus-visible:outline-none"
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
          </button>
          {onAddToCart && !isSelectionMode && (
            <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[4.75%_/_3.5%]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={addToCartLabel}
                title={addToCartLabel}
                className="pointer-events-none absolute inset-x-0 bottom-0 h-9 translate-y-full overflow-hidden rounded-t-none rounded-b-[inherit] border-x-0 border-t border-b-0 border-white/80 bg-white px-2 text-slate-950 opacity-0 shadow-lg shadow-black/20 transition-[opacity,transform,background-color,color,border-color] duration-200 ease-out hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:border-primary focus-visible:bg-primary focus-visible:text-primary-foreground group-hover/card-image:pointer-events-auto group-hover/card-image:translate-y-0 group-hover/card-image:opacity-100 group-focus-within/card-image:pointer-events-auto group-focus-within/card-image:translate-y-0 group-focus-within/card-image:opacity-100"
                onClick={handleAddToCartClick}
              >
                <ShoppingCart className="size-4" />
                <span className="min-w-0 truncate">{addToCartLabel}</span>
              </Button>
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label={
            isSelectionMode
              ? t("binder:selection.select_card", { name: cardName })
              : t("binder:detail.open_card", { name: cardName })
          }
          className="w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={handlePrimaryClick}
        >
          <BinderCardPriceSummary
            listedAtLabel={listedAtLabel}
            listedPriceLabel={listedPriceLabel}
            priceLabel={priceLabel}
            valueDelta={valueDelta}
          />
        </button>
      </div>
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
