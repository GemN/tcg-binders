import { MarketPriceSource } from "@app/graphql";
import { type MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { BinderCardActionsMenu } from "@/components/BinderCardActionsMenu";
import { CardConditionBadge } from "@/components/CardConditionBadge";
import { CardImage } from "@/components/CardImage";
import { MarketPriceSourceIcon } from "@/components/MarketPriceSourceIcon";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  type BinderCardPriceInput,
  type BinderCardRecord,
  type ComparableMarketPriceInput,
  formatBinderCardPrice,
  getBinderCardMarketPrice,
  getCheapestMarketPriceSources,
} from "@/lib/binderCardPricing";
import { cn } from "@/lib/utils";
import {
  type ConvertAmountToLocalCurrency,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

interface BinderCardListProps {
  binderCards: BinderCardRecord[];
  className?: string;
  isDeletingCard?: boolean;
  isSelectionMode?: boolean;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onOpenCard: (binderCard: BinderCardRecord, index: number) => void;
  onToggleCardSelection?: (binderCard: BinderCardRecord) => void;
  selectedBinderCardIds?: Set<string>;
  showConvertedMarketPrices: boolean;
}

interface CardPreviewState {
  binderCard: BinderCardRecord;
  left: number;
  top: number;
}

interface MarketPriceHeaderProps {
  label: string;
  source: MarketPriceSource;
}

interface BinderCardPreviewProps {
  cardPreview: CardPreviewState | null;
  noImageLabel: string;
}

type FormatListPrice = (priceInput: BinderCardPriceInput) => string;
type MarketPriceSourceClassNameMap = Record<MarketPriceSource, string>;
type UpdateCardPreview = (
  binderCard: BinderCardRecord,
  event: MouseEvent<HTMLTableRowElement>
) => void;

interface MarketPriceCellProps {
  cheapestMarketPriceSources: Set<MarketPriceSource>;
  formatPrice: FormatListPrice;
  marketPrice: ComparableMarketPriceInput | null;
  shouldConvert: boolean;
  source: MarketPriceSource;
}

interface BinderCardListRowProps {
  binderCard: BinderCardRecord;
  convertAmountToLocalCurrency: ConvertAmountToLocalCurrency;
  formatPrice: FormatListPrice;
  index: number;
  isDeletingCard?: boolean;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onClearCardPreview: () => void;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onOpenCard: (binderCard: BinderCardRecord, index: number) => void;
  onToggleCardSelection?: (binderCard: BinderCardRecord) => void;
  onUpdateCardPreview: UpdateCardPreview;
  showConvertedMarketPrices: boolean;
}

const CARD_PREVIEW_WIDTH = 180;
const CARD_PREVIEW_HEIGHT = Math.round((CARD_PREVIEW_WIDTH * 88) / 63);
const CARD_PREVIEW_OFFSET = 18;
const CARD_PREVIEW_MARGIN = 12;
const highlightedMarketPriceClassName = "font-bold";
const marketPriceSourceClassNames: MarketPriceSourceClassNameMap = {
  [MarketPriceSource.Cardkingdom]: "text-info",
  [MarketPriceSource.Cardmarket]: "text-success",
  [MarketPriceSource.Tcgplayer]: "text-destructive",
};

const getCardPreviewPosition = (
  event: MouseEvent
): Pick<CardPreviewState, "left" | "top"> => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const nextLeft =
    event.clientX +
      CARD_PREVIEW_OFFSET +
      CARD_PREVIEW_WIDTH +
      CARD_PREVIEW_MARGIN >
    viewportWidth
      ? event.clientX - CARD_PREVIEW_OFFSET - CARD_PREVIEW_WIDTH
      : event.clientX + CARD_PREVIEW_OFFSET;
  const nextTop = Math.min(
    event.clientY + CARD_PREVIEW_OFFSET,
    viewportHeight - CARD_PREVIEW_HEIGHT - CARD_PREVIEW_MARGIN
  );

  return {
    left: Math.max(CARD_PREVIEW_MARGIN, nextLeft),
    top: Math.max(CARD_PREVIEW_MARGIN, nextTop),
  };
};

const useBinderCardPreview = () => {
  const [cardPreview, setCardPreview] = useState<CardPreviewState | null>(null);

  const updateCardPreview: UpdateCardPreview = (binderCard, event) => {
    const { left, top } = getCardPreviewPosition(event);
    setCardPreview({ binderCard, left, top });
  };

  const clearCardPreview = () => setCardPreview(null);

  return { cardPreview, clearCardPreview, updateCardPreview };
};

const MarketPriceHeader = ({ label, source }: MarketPriceHeaderProps) => (
  <span
    className={cn(
      "flex items-center justify-end gap-1.5",
      marketPriceSourceClassNames[source]
    )}
  >
    <MarketPriceSourceIcon source={source} className="size-3.5" />
    <span>{label}</span>
  </span>
);

const BinderCardPreview = ({
  cardPreview,
  noImageLabel,
}: BinderCardPreviewProps) => {
  if (!cardPreview) return null;

  const previewCard = cardPreview.binderCard.card;

  return (
    <CardImage
      alt=""
      className="pointer-events-none fixed z-40 overflow-hidden rounded-md border border-border bg-foreground shadow-2xl shadow-foreground/30"
      fallbackClassName="px-4 text-center text-background"
      finish={cardPreview.binderCard.finish}
      imageUrl={previewCard?.imageNormalUrl || previewCard?.imageSmallUrl}
      noImageLabel={noImageLabel}
      style={{
        left: cardPreview.left,
        top: cardPreview.top,
        width: CARD_PREVIEW_WIDTH,
        height: CARD_PREVIEW_HEIGHT,
      }}
    />
  );
};

const MarketPriceCell = ({
  cheapestMarketPriceSources,
  formatPrice,
  marketPrice,
  shouldConvert,
  source,
}: MarketPriceCellProps) => (
  <TableCell
    className={cn(
      "cursor-pointer px-3 py-2 text-right font-medium tabular-nums",
      marketPriceSourceClassNames[source],
      cheapestMarketPriceSources.has(source) && highlightedMarketPriceClassName
    )}
  >
    {formatPrice({
      amount: marketPrice?.amount,
      shouldConvert,
      sourceCurrency: marketPrice?.currency,
    })}
  </TableCell>
);

const BinderCardListRow = ({
  binderCard,
  convertAmountToLocalCurrency,
  formatPrice,
  index,
  isDeletingCard,
  isSelected,
  isSelectionMode,
  onClearCardPreview,
  onDeleteCard,
  onOpenCard,
  onToggleCardSelection,
  onUpdateCardPreview,
  showConvertedMarketPrices,
}: BinderCardListRowProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const cardkingdomPrice = getBinderCardMarketPrice(
    binderCard,
    MarketPriceSource.Cardkingdom
  );
  const tcgplayerPrice = getBinderCardMarketPrice(
    binderCard,
    MarketPriceSource.Tcgplayer
  );
  const cardmarketPrice = getBinderCardMarketPrice(
    binderCard,
    MarketPriceSource.Cardmarket
  );
  const marketPrices: Record<
    MarketPriceSource,
    ComparableMarketPriceInput | null
  > = {
    [MarketPriceSource.Cardkingdom]: cardkingdomPrice,
    [MarketPriceSource.Cardmarket]: cardmarketPrice,
    [MarketPriceSource.Tcgplayer]: tcgplayerPrice,
  };
  const cheapestMarketPriceSources = getCheapestMarketPriceSources(
    marketPrices,
    convertAmountToLocalCurrency
  );
  const cardName = binderCard.card?.name || t("common:not_available");
  const selectCardLabel = t("binder:selection.select_card", {
    name: cardName,
  });
  const conditionLabel = t(`common:card.condition.${binderCard.condition}`);
  const openCard = () => onOpenCard(binderCard, index);
  const activateCard = () => {
    if (isSelectionMode) {
      onToggleCardSelection?.(binderCard);
      return;
    }

    openCard();
  };
  const updateCardPreview = (event: MouseEvent<HTMLTableRowElement>) => {
    onUpdateCardPreview(binderCard, event);
  };

  return (
    <TableRow
      className="cursor-pointer border-border odd:bg-card even:bg-muted/25 hover:bg-accent/40"
      data-state={isSelectionMode && isSelected ? "selected" : undefined}
      onClick={activateCard}
      onMouseEnter={updateCardPreview}
      onMouseMove={updateCardPreview}
      onMouseLeave={onClearCardPreview}
    >
      {isSelectionMode && (
        <TableCell className="px-3 py-2">
          <Checkbox
            checked={isSelected}
            aria-label={selectCardLabel}
            className="cursor-pointer"
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={() => onToggleCardSelection?.(binderCard)}
          />
        </TableCell>
      )}
      <TableCell
        className="cursor-pointer px-3 py-2 font-medium uppercase tabular-nums text-muted-foreground"
      >
        {binderCard.card?.cardSet?.code || "MTG"}
      </TableCell>
      <TableCell
        className="cursor-pointer px-3 py-2 tabular-nums text-muted-foreground"
      >
        {binderCard.card?.collectorNumber || "-"}
      </TableCell>
      <TableCell className="max-w-96 whitespace-normal px-3 py-2 font-medium text-foreground">
        <button
          type="button"
          className="w-full cursor-pointer border-0 bg-transparent p-0 text-left font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={
            isSelectionMode
              ? selectCardLabel
              : t("binder:detail.open_card", { name: cardName })
          }
        >
          {cardName}
        </button>
      </TableCell>
      <TableCell
        className="cursor-pointer px-3 py-2 text-right font-medium tabular-nums text-foreground"
      >
        {binderCard.quantity}
      </TableCell>
      <TableCell
        title={conditionLabel}
        className="cursor-pointer px-3 py-2"
      >
        <CardConditionBadge condition={binderCard.condition} />
      </TableCell>
      <TableCell
        className="cursor-pointer px-3 py-2 text-right font-medium tabular-nums text-foreground"
      >
        {formatPrice({
          amount: binderCard.priceAmount,
          shouldConvert: true,
          sourceCurrency: binderCard.priceCurrency,
        })}
      </TableCell>
      <MarketPriceCell
        cheapestMarketPriceSources={cheapestMarketPriceSources}
        formatPrice={formatPrice}
        marketPrice={cardkingdomPrice}
        shouldConvert={showConvertedMarketPrices}
        source={MarketPriceSource.Cardkingdom}
      />
      <MarketPriceCell
        cheapestMarketPriceSources={cheapestMarketPriceSources}
        formatPrice={formatPrice}
        marketPrice={tcgplayerPrice}
        shouldConvert={showConvertedMarketPrices}
        source={MarketPriceSource.Tcgplayer}
      />
      <MarketPriceCell
        cheapestMarketPriceSources={cheapestMarketPriceSources}
        formatPrice={formatPrice}
        marketPrice={cardmarketPrice}
        shouldConvert={showConvertedMarketPrices}
        source={MarketPriceSource.Cardmarket}
      />
      {onDeleteCard && (
        <TableCell className="px-3 py-2 text-right">
          <BinderCardActionsMenu
            cardName={cardName}
            disabled={isDeletingCard}
            onDelete={() => onDeleteCard(binderCard)}
            triggerVariant="inline"
          />
        </TableCell>
      )}
    </TableRow>
  );
};

export const BinderCardList = ({
  binderCards,
  className,
  isDeletingCard,
  isSelectionMode,
  onDeleteCard,
  onOpenCard,
  onToggleCardSelection,
  selectedBinderCardIds,
  showConvertedMarketPrices,
}: BinderCardListProps) => {
  const { i18n, t } = useTranslation(["binder", "common"]);
  const { convertAmountToLocalCurrency, currency } = usePricingSettings();
  const { cardPreview, clearCardPreview, updateCardPreview } =
    useBinderCardPreview();

  const fallbackPrice = "-";
  const formatPrice = ({
    amount,
    shouldConvert,
    sourceCurrency,
  }: BinderCardPriceInput) =>
    formatBinderCardPrice({
      amount,
      convertAmountToLocalCurrency,
      displayCurrency: currency,
      locale: i18n.language,
      shouldConvert,
      sourceCurrency,
    }) || fallbackPrice;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <Table className="text-sm">
        <TableHeader className="bg-muted/70">
          <TableRow className="border-border hover:bg-transparent">
            {isSelectionMode && (
              <TableHead className="h-9 w-10 px-3">
                <span className="sr-only">
                  {t("binder:detail.selected")}
                </span>
              </TableHead>
            )}
            <TableHead className="h-9 w-20 px-3 text-[11px] font-semibold uppercase text-muted-foreground">
              {t("binder:list.set")}
            </TableHead>
            <TableHead className="h-9 w-20 px-3 text-[11px] font-semibold uppercase text-muted-foreground">
              {t("binder:list.collector_number")}
            </TableHead>
            <TableHead className="h-9 min-w-60 px-3 text-[11px] font-semibold uppercase text-muted-foreground">
              {t("binder:list.name")}
            </TableHead>
            <TableHead className="h-9 w-16 px-3 text-right text-[11px] font-semibold uppercase text-muted-foreground">
              {t("binder:list.quantity")}
            </TableHead>
            <TableHead className="h-9 w-24 px-3 text-[11px] font-semibold uppercase text-muted-foreground">
              {t("binder:list.condition")}
            </TableHead>
            <TableHead className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-muted-foreground">
              {t("binder:list.user_price")}
            </TableHead>
            <TableHead className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-muted-foreground">
              <MarketPriceHeader
                label={t("binder:list.cardkingdom_price")}
                source={MarketPriceSource.Cardkingdom}
              />
            </TableHead>
            <TableHead className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-muted-foreground">
              <MarketPriceHeader
                label={t("binder:list.tcgplayer_price")}
                source={MarketPriceSource.Tcgplayer}
              />
            </TableHead>
            <TableHead className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-muted-foreground">
              <MarketPriceHeader
                label={t("binder:list.cardmarket_price")}
                source={MarketPriceSource.Cardmarket}
              />
            </TableHead>
            {onDeleteCard && <TableHead className="h-9 w-12 px-3" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {binderCards.map((binderCard, index) => (
            <BinderCardListRow
              key={binderCard.id}
              binderCard={binderCard}
              convertAmountToLocalCurrency={convertAmountToLocalCurrency}
              formatPrice={formatPrice}
              index={index}
              isDeletingCard={isDeletingCard}
              isSelected={selectedBinderCardIds?.has(binderCard.id)}
              isSelectionMode={isSelectionMode}
              onClearCardPreview={clearCardPreview}
              onDeleteCard={onDeleteCard}
              onOpenCard={onOpenCard}
              onToggleCardSelection={onToggleCardSelection}
              onUpdateCardPreview={updateCardPreview}
              showConvertedMarketPrices={showConvertedMarketPrices}
            />
          ))}
        </TableBody>
      </Table>
      <BinderCardPreview
        cardPreview={cardPreview}
        noImageLabel={t("binder:no_image")}
      />
    </div>
  );
};
