import { LanguageCode, MarketPriceSource } from "@app/graphql";
import {
  memo,
  type MouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { BinderCardActionsMenu } from "@/components/BinderCardActionsMenu";
import { CardConditionBadge } from "@/components/CardConditionBadge";
import { CardFinishBadge } from "@/components/CardFinishBadge";
import { CardImage } from "@/components/CardImage";
import { CartQuantityControl } from "@/components/Cart/CartQuantityControl";
import { CountryFlag } from "@/components/CountryFlag";
import { MarketPriceSourceIcon } from "@/components/MarketPriceSourceIcon";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cardLanguageFlagCodes } from "@/config/card";
import { marketPriceSourceClassNames } from "@/config/marketPriceSource";
import {
  type BinderCardPriceInput,
  type BinderCardRecord,
  type ComparableMarketPriceInput,
  formatBinderCardPrice,
  getBinderCardMarketPrice,
  getCheapestMarketPriceSources,
} from "@/lib/binderCardPricing";
import { getCardImageBaseUrl, getCardScryfallId } from "@/lib/cardImageUrl";
import { preloadImage } from "@/lib/imagePreload";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/CartContext";
import {
  type ConvertAmountToLocalCurrency,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

interface BinderCardListProps {
  binderCards: BinderCardRecord[];
  className?: string;
  isDeletingCard?: boolean;
  isSelectionMode?: boolean;
  onAddToCart?: (binderCard: BinderCardRecord) => void;
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
  onAddToCart?: (binderCard: BinderCardRecord) => void;
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
const fallbackPrice = "-";
const highlightedMarketPriceClassName = "font-bold";

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

  const updateCardPreview = useCallback<UpdateCardPreview>(
    (binderCard, event) => {
      const { left, top } = getCardPreviewPosition(event);
      setCardPreview({ binderCard, left, top });
    },
    []
  );

  const clearCardPreview = useCallback(() => setCardPreview(null), []);

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
      finish={cardPreview.binderCard.finish}
      imageSize="grid"
      imageUrl={getCardImageBaseUrl(previewCard)}
      loading="eager"
      noImageLabel={noImageLabel}
      scryfallId={getCardScryfallId(previewCard)}
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

const BinderCardListRowComponent = ({
  binderCard,
  convertAmountToLocalCurrency,
  formatPrice,
  index,
  isDeletingCard,
  isSelected,
  isSelectionMode,
  onAddToCart,
  onClearCardPreview,
  onDeleteCard,
  onOpenCard,
  onToggleCardSelection,
  onUpdateCardPreview,
  showConvertedMarketPrices,
}: BinderCardListRowProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const {
    items,
    reconcileCartItemAvailability,
    removeCartItem,
    updateCartItemQuantity,
    updateCartItemQuantityWithNotification,
  } = useCart();
  const cartItem = onAddToCart
    ? items.find((item) => item.binderCardId === binderCard.id)
    : undefined;
  const cartItemAvailableQuantity = cartItem?.availableQuantity;
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
  const languageLabel = t(`common:card.language.${binderCard.language}`, {
    defaultValue: binderCard.language.toUpperCase(),
  });
  const imageUrl = getCardImageBaseUrl(binderCard.card);
  const scryfallId = getCardScryfallId(binderCard.card);
  const preloadBinderCardImage = useCallback(() => {
    preloadImage(imageUrl, "grid", scryfallId);
  }, [imageUrl, scryfallId]);
  const openCard = useCallback(() => {
    onOpenCard(binderCard, index);
  }, [binderCard, index, onOpenCard]);
  const activateCard = useCallback(() => {
    if (isSelectionMode) {
      onToggleCardSelection?.(binderCard);
      return;
    }

    openCard();
  }, [binderCard, isSelectionMode, onToggleCardSelection, openCard]);
  const updateCardPreview = useCallback(
    (event: MouseEvent<HTMLTableRowElement>) => {
      preloadBinderCardImage();
      onUpdateCardPreview(binderCard, event);
    },
    [binderCard, onUpdateCardPreview, preloadBinderCardImage]
  );
  const toggleSelection = useCallback(() => {
    onToggleCardSelection?.(binderCard);
  }, [binderCard, onToggleCardSelection]);
  const deleteCard = useCallback(() => {
    onDeleteCard?.(binderCard);
  }, [binderCard, onDeleteCard]);
  const handleAddToCart = useCallback(() => {
    onAddToCart?.(binderCard);
  }, [binderCard, onAddToCart]);
  const handleQuantityChange = useCallback(
    (quantity: number) => {
      if (cartItem && quantity > cartItem.quantity) {
        updateCartItemQuantityWithNotification(binderCard.id, quantity);
        return;
      }

      updateCartItemQuantity(binderCard.id, quantity);
    },
    [
      binderCard.id,
      cartItem,
      updateCartItemQuantity,
      updateCartItemQuantityWithNotification,
    ]
  );
  const handleRemoveFromCart = useCallback(() => {
    removeCartItem(binderCard.id);
  }, [binderCard.id, removeCartItem]);
  const stopCheckboxClickPropagation = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
    },
    []
  );

  useEffect(() => {
    if (cartItemAvailableQuantity === undefined) return;

    reconcileCartItemAvailability(binderCard.id, binderCard.quantity);
  }, [
    binderCard.id,
    binderCard.quantity,
    cartItemAvailableQuantity,
    reconcileCartItemAvailability,
  ]);

  return (
    <TableRow
      className="cursor-pointer border-[#D8D3CC] border-dashed odd:bg-white even:bg-[#F4F1EC] hover:bg-accent/30"
      data-state={isSelectionMode && isSelected ? "selected" : undefined}
      onClick={activateCard}
      onMouseEnter={updateCardPreview}
      onMouseMove={updateCardPreview}
      onMouseLeave={onClearCardPreview}
      onPointerDown={preloadBinderCardImage}
    >
      {isSelectionMode && (
        <TableCell className="px-3 py-2">
          <Checkbox
            checked={isSelected}
            aria-label={selectCardLabel}
            className="cursor-pointer"
            onClick={stopCheckboxClickPropagation}
            onCheckedChange={toggleSelection}
          />
        </TableCell>
      )}
      <TableCell className="cursor-pointer px-3 py-2 font-medium uppercase tabular-nums text-muted-foreground">
        {binderCard.card?.cardSet?.code || "MTG"}
      </TableCell>
      <TableCell className="cursor-pointer px-3 py-2 tabular-nums text-muted-foreground">
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
          onFocus={preloadBinderCardImage}
        >
          {cardName}
        </button>
      </TableCell>
      <TableCell className="cursor-pointer px-3 py-2 text-right font-medium tabular-nums text-foreground">
        {binderCard.quantity}
      </TableCell>
      <TableCell className="cursor-pointer px-3 py-2">
        <span className="flex items-center gap-2">
          <CardConditionBadge
            condition={binderCard.condition}
            className="rounded-sm py-0.5"
            showTooltip
          />
          <CountryFlag
            code={cardLanguageFlagCodes[binderCard.language as LanguageCode]}
            className="aspect-[4/3] w-5"
            label={languageLabel}
            showTooltip
          />
          <CardFinishBadge finish={binderCard.finish} display="icon" />
        </span>
      </TableCell>
      <TableCell className="cursor-pointer px-3 py-2 text-right font-medium tabular-nums text-foreground">
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
      {onAddToCart && (
        <TableCell
          className="px-3 py-2 text-right"
          onClick={(event) => event.stopPropagation()}
        >
          {cartItem ? (
            <CartQuantityControl
              availableQuantity={cartItem.availableQuantity}
              itemName={cardName}
              onRemove={handleRemoveFromCart}
              quantity={cartItem.quantity}
              onQuantityChange={handleQuantityChange}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={t("binder:detail.add_card_to_cart", {
                name: cardName,
              })}
              className="w-28"
              disabled={binderCard.quantity < 1}
              onClick={handleAddToCart}
            >
              {t("binder:detail.add_to_cart")}
            </Button>
          )}
        </TableCell>
      )}
      {onDeleteCard && (
        <TableCell className="px-3 py-2 text-right">
          <BinderCardActionsMenu
            cardName={cardName}
            disabled={isDeletingCard}
            onDelete={deleteCard}
            triggerVariant="inline"
          />
        </TableCell>
      )}
    </TableRow>
  );
};

const BinderCardListRow = memo(BinderCardListRowComponent);

export const BinderCardList = ({
  binderCards,
  className,
  isDeletingCard,
  isSelectionMode,
  onAddToCart,
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

  const formatPrice = useCallback(
    ({ amount, shouldConvert, sourceCurrency }: BinderCardPriceInput) =>
      formatBinderCardPrice({
        amount,
        convertAmountToLocalCurrency,
        displayCurrency: currency,
        locale: i18n.language,
        shouldConvert,
        sourceCurrency,
      }) || fallbackPrice,
    [convertAmountToLocalCurrency, currency, i18n.language]
  );

  return (
    <div
      className={cn(
        "rounded-md border border-[#D8D3CC] bg-card text-card-foreground",
        className
      )}
    >
      <Table
        className="text-sm"
        containerClassName="overflow-x-auto md:overflow-visible"
      >
        <TableHeader className="bg-[#ECE9E4] [&_th]:sticky [&_th]:top-[calc(env(safe-area-inset-top)+5.5rem)] [&_th]:z-20 [&_th]:bg-[#ECE9E4]">
          <TableRow className="border-[#D8D3CC] hover:bg-transparent">
            {isSelectionMode && (
              <TableHead className="h-10 w-10 px-3">
                <span className="sr-only">{t("binder:detail.selected")}</span>
              </TableHead>
            )}
            <TableHead className="h-10 w-20 px-3 text-xs font-medium text-primary">
              {t("binder:list.set")}
            </TableHead>
            <TableHead className="h-10 w-20 px-3 text-xs font-medium text-primary">
              {t("binder:list.collector_number")}
            </TableHead>
            <TableHead className="h-10 min-w-60 px-3 text-xs font-medium text-primary">
              {t("binder:list.name")}
            </TableHead>
            <TableHead className="h-10 w-16 px-3 text-right text-xs font-medium text-primary">
              {t("binder:list.quantity")}
            </TableHead>
            <TableHead className="h-10 w-24 px-3 text-xs font-medium text-primary">
              {t("binder:list.condition")}
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-medium text-primary">
              {t("binder:list.user_price")}
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-medium text-primary">
              <MarketPriceHeader
                label={t("binder:list.cardkingdom_price")}
                source={MarketPriceSource.Cardkingdom}
              />
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-medium text-primary">
              <MarketPriceHeader
                label={t("binder:list.tcgplayer_price")}
                source={MarketPriceSource.Tcgplayer}
              />
            </TableHead>
            <TableHead className="h-10 px-3 text-right text-xs font-medium text-primary">
              <MarketPriceHeader
                label={t("binder:list.cardmarket_price")}
                source={MarketPriceSource.Cardmarket}
              />
            </TableHead>
            {onAddToCart && (
              <TableHead className="h-10 w-34 px-3">
                <span className="sr-only">
                  {t("binder:detail.add_to_cart")}
                </span>
              </TableHead>
            )}
            {onDeleteCard && <TableHead className="h-10 w-12 px-3" />}
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
              onAddToCart={onAddToCart}
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
