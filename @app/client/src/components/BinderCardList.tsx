import { LanguageCode, MarketPriceSource } from "@app/graphql";
import { memo, type MouseEvent, useCallback, useEffect } from "react";
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
  isMobile: boolean;
  isSelectionMode?: boolean;
  onAddToCart?: (binderCard: BinderCardRecord) => void;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onOpenCard: (binderCard: BinderCardRecord, index: number) => void;
  onToggleCardSelection?: (binderCard: BinderCardRecord) => void;
  selectedBinderCardIds?: Set<string>;
  showConvertedMarketPrices: boolean;
}

type FormatListPrice = (priceInput: BinderCardPriceInput) => string;

interface MarketPriceValueProps {
  cheapestMarketPriceSources: Set<MarketPriceSource>;
  formatPrice: FormatListPrice;
  marketPrice: ComparableMarketPriceInput | null;
  shouldConvert: boolean;
  source: MarketPriceSource;
  sourceLabel: string;
}

interface BinderCardListItemProps {
  binderCard: BinderCardRecord;
  convertAmountToLocalCurrency: ConvertAmountToLocalCurrency;
  formatPrice: FormatListPrice;
  index: number;
  isDeletingCard?: boolean;
  isMobileView: boolean;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onAddToCart?: (binderCard: BinderCardRecord) => void;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onOpenCard: (binderCard: BinderCardRecord, index: number) => void;
  onToggleCardSelection?: (binderCard: BinderCardRecord) => void;
  showConvertedMarketPrices: boolean;
}

const fallbackPrice = "-";
const highlightedMarketPriceClassName = "font-bold";
const desktopGridClassName =
  "grid-cols-[minmax(18rem,2fr)_minmax(10rem,1fr)_4rem_minmax(8rem,0.8fr)_minmax(16rem,1.5fr)_8rem]";
const selectableDesktopGridClassName =
  "grid-cols-[2.5rem_minmax(18rem,2fr)_minmax(10rem,1fr)_4rem_minmax(8rem,0.8fr)_minmax(16rem,1.5fr)_8rem]";

const MarketPriceValue = ({
  cheapestMarketPriceSources,
  formatPrice,
  marketPrice,
  shouldConvert,
  source,
  sourceLabel,
}: MarketPriceValueProps) => (
  <span
    className={cn(
      "flex min-w-0 items-center gap-1.5 whitespace-nowrap tabular-nums",
      marketPriceSourceClassNames[source],
      cheapestMarketPriceSources.has(source)
        ? highlightedMarketPriceClassName
        : "font-medium"
    )}
  >
    <MarketPriceSourceIcon source={source} className="size-4 shrink-0" />
    <span className="sr-only">{sourceLabel}</span>
    <span className="min-w-0 truncate">
      {formatPrice({
        amount: marketPrice?.amount,
        shouldConvert,
        sourceCurrency: marketPrice?.currency,
      })}
    </span>
  </span>
);

const BinderCardListItemComponent = ({
  binderCard,
  convertAmountToLocalCurrency,
  formatPrice,
  index,
  isDeletingCard,
  isMobileView,
  isSelected,
  isSelectionMode,
  onAddToCart,
  onDeleteCard,
  onOpenCard,
  onToggleCardSelection,
  showConvertedMarketPrices,
}: BinderCardListItemProps) => {
  const { t } = useTranslation(["binder", "card", "common"]);
  const {
    items,
    reconcileCartItemAvailability,
    removeCartItem,
    updateCartItemQuantity,
    updateCartItemQuantityWithNotification,
  } = useCart();
  const isOwnerView = !!onDeleteCard;
  const canAddToCart = !!onAddToCart && !isOwnerView;
  const cartItem = canAddToCart
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
  const setCode = binderCard.card?.cardSet?.code?.trim();
  const collectorNumber = binderCard.card?.collectorNumber?.trim();
  const setName = binderCard.card?.cardSet?.name?.trim();
  const cardMetadataParts = [
    setCode?.toUpperCase(),
    collectorNumber ? `#${collectorNumber}` : null,
  ].filter(Boolean);
  const cardMetadata =
    cardMetadataParts.length > 0 ? cardMetadataParts.join(" ") : null;
  const selectCardLabel = t("binder:selection.select_card", {
    name: cardName,
  });
  const languageLabel = t(`common:card.language.${binderCard.language}`, {
    defaultValue: binderCard.language.toUpperCase(),
  });
  const imageUrl = getCardImageBaseUrl(binderCard.card);
  const scryfallId = getCardScryfallId(binderCard.card);
  const listedPrice = formatPrice({
    amount: binderCard.priceAmount,
    shouldConvert: false,
    sourceCurrency: binderCard.priceCurrency,
  });
  const convertedPrice = formatPrice({
    amount: binderCard.priceAmount,
    shouldConvert: true,
    sourceCurrency: binderCard.priceCurrency,
  });
  const shouldShowConvertedPrice =
    listedPrice !== fallbackPrice &&
    convertedPrice !== fallbackPrice &&
    convertedPrice !== listedPrice;
  const preloadBinderCardImage = useCallback(() => {
    preloadImage(imageUrl, "grid", scryfallId);
  }, [imageUrl, scryfallId]);
  const handleActivateCard = useCallback(() => {
    if (isSelectionMode) {
      onToggleCardSelection?.(binderCard);
      return;
    }

    onOpenCard(binderCard, index);
  }, [binderCard, index, isSelectionMode, onOpenCard, onToggleCardSelection]);
  const handleToggleSelection = useCallback(() => {
    onToggleCardSelection?.(binderCard);
  }, [binderCard, onToggleCardSelection]);
  const handleDeleteCard = useCallback(() => {
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
  const handleInteractiveClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.stopPropagation();
    },
    []
  );
  const handleTitleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      handleActivateCard();
    },
    [handleActivateCard]
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

  const information = (
    <span className="flex flex-wrap items-center gap-2">
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
  );
  const marketPriceValues = (
    <span
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 text-sm",
        isMobileView && "w-full justify-between"
      )}
    >
      <MarketPriceValue
        cheapestMarketPriceSources={cheapestMarketPriceSources}
        formatPrice={formatPrice}
        marketPrice={cardkingdomPrice}
        shouldConvert={showConvertedMarketPrices}
        source={MarketPriceSource.Cardkingdom}
        sourceLabel={t("binder:list.cardkingdom_price")}
      />
      <MarketPriceValue
        cheapestMarketPriceSources={cheapestMarketPriceSources}
        formatPrice={formatPrice}
        marketPrice={tcgplayerPrice}
        shouldConvert={showConvertedMarketPrices}
        source={MarketPriceSource.Tcgplayer}
        sourceLabel={t("binder:list.tcgplayer_price")}
      />
      <MarketPriceValue
        cheapestMarketPriceSources={cheapestMarketPriceSources}
        formatPrice={formatPrice}
        marketPrice={cardmarketPrice}
        shouldConvert={showConvertedMarketPrices}
        source={MarketPriceSource.Cardmarket}
        sourceLabel={t("binder:list.cardmarket_price")}
      />
    </span>
  );
  const action = isSelectionMode ? null : isOwnerView ? (
    <BinderCardActionsMenu
      cardName={cardName}
      disabled={isDeletingCard}
      onDelete={handleDeleteCard}
      triggerVariant={isMobileView ? "outline" : "inline"}
    />
  ) : canAddToCart ? (
    cartItem ? (
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
        aria-label={t("binder:detail.add_card_to_cart", { name: cardName })}
        className="w-28"
        disabled={binderCard.quantity < 1}
        onClick={handleAddToCart}
      >
        {t("binder:detail.add_to_cart")}
      </Button>
    )
  ) : null;

  if (!isMobileView) {
    return (
      <div
        role="row"
        className={cn(
          "hidden min-w-[62rem] cursor-pointer items-center border-b border-dashed border-[#D8D3CC] px-3 py-3 last:border-b-0 hover:bg-accent/30 data-[state=selected]:bg-accent/50 md:grid",
          index % 2 === 0 ? "bg-white" : "bg-[#F4F1EC]",
          isSelectionMode
            ? selectableDesktopGridClassName
            : desktopGridClassName
        )}
        data-state={isSelectionMode && isSelected ? "selected" : undefined}
        onClick={handleActivateCard}
        onPointerDown={preloadBinderCardImage}
      >
        {isSelectionMode && (
          <div role="cell" className="pr-3" onClick={handleInteractiveClick}>
            <Checkbox
              checked={isSelected}
              aria-label={selectCardLabel}
              className="cursor-pointer"
              onCheckedChange={handleToggleSelection}
            />
          </div>
        )}
        <div role="cell" className="flex min-w-0 items-center gap-3 pr-3">
          <CardImage
            alt=""
            className="w-[70px] shrink-0 border border-[#D8D3CC]"
            finish={binderCard.finish}
            imageSize="grid"
            imageUrl={imageUrl}
            noImageLabel={t("binder:no_image")}
            scryfallId={scryfallId}
          />
          <span className="grid min-w-0 gap-1">
            {(cardMetadata || setName) && (
              <span className="flex min-w-0 items-baseline gap-2 overflow-hidden text-xs font-normal">
                {cardMetadata && (
                  <span className="shrink-0 text-muted-foreground">
                    {cardMetadata}
                  </span>
                )}
                {setName && (
                  <span className="truncate text-secondary">{setName}</span>
                )}
              </span>
            )}
            <button
              type="button"
              className="min-w-0 cursor-pointer truncate border-0 bg-transparent p-0 text-left text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={
                isSelectionMode
                  ? selectCardLabel
                  : t("binder:detail.open_card", { name: cardName })
              }
            >
              {cardName}
            </button>
          </span>
        </div>
        <div role="cell" className="pr-3">
          {information}
        </div>
        <div
          role="cell"
          className="pr-3 text-sm font-medium tabular-nums text-primary"
        >
          {binderCard.quantity}
        </div>
        <div role="cell" className="grid min-w-0 gap-0.5 pr-3 tabular-nums">
          <span className="truncate text-base font-display font-medium text-primary">
            {listedPrice}
          </span>
          {shouldShowConvertedPrice && (
            <span className="truncate text-xs text-muted-foreground">
              ≈ {convertedPrice}
            </span>
          )}
        </div>
        <div role="cell" className="min-w-0 pr-3">
          {marketPriceValues}
        </div>
        <div
          role="cell"
          className="flex justify-end"
          onClick={handleInteractiveClick}
        >
          {action}
        </div>
      </div>
    );
  }

  return (
    <article
      className="relative grid cursor-pointer gap-2 rounded-sm border border-dashed border-[#D8D3CC] bg-white p-4 text-primary data-[state=selected]:border-secondary data-[state=selected]:bg-accent/50"
      data-state={isSelectionMode && isSelected ? "selected" : undefined}
      onClick={handleActivateCard}
      onPointerDown={preloadBinderCardImage}
    >
      {(isSelectionMode || isOwnerView) && (
        <div
          className="absolute top-4 right-4 z-10"
          onClick={handleInteractiveClick}
        >
          {isSelectionMode ? (
            <Checkbox
              checked={isSelected}
              aria-label={selectCardLabel}
              className="cursor-pointer"
              onCheckedChange={handleToggleSelection}
            />
          ) : (
            action
          )}
        </div>
      )}
      <div className="flex min-w-0 items-start gap-4">
        <CardImage
          alt=""
          className="w-20 shrink-0 border border-[#D8D3CC]"
          finish={binderCard.finish}
          imageSize="grid"
          imageUrl={imageUrl}
          noImageLabel={t("binder:no_image")}
          scryfallId={scryfallId}
        />
        <div
          className={cn(
            "grid min-w-0 flex-1 content-start gap-2",
            isSelectionMode && "pr-10"
          )}
        >
          <div className="grid min-w-0 gap-1">
            {cardMetadata && (
              <span className="text-xs text-muted-foreground">
                {cardMetadata}
              </span>
            )}
            <button
              type="button"
              className="min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left text-base font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={
                isSelectionMode
                  ? selectCardLabel
                  : t("binder:detail.open_card", { name: cardName })
              }
              onClick={handleTitleClick}
            >
              <span>{cardName}</span>
            </button>
          </div>
          {information}
          <span className="flex min-w-0 items-baseline justify-between gap-2 tabular-nums">
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-base font-display font-medium text-primary">
                {listedPrice}
              </span>
              {shouldShowConvertedPrice && (
                <span className="text-sm text-muted-foreground">
                  ≈ {convertedPrice}
                </span>
              )}
            </span>
            <span className="shrink-0 text-xs font-normal text-secondary">
              {t("binder:detail.available", { count: binderCard.quantity })}
            </span>
          </span>
          {marketPriceValues}
        </div>
      </div>
      {!isSelectionMode && canAddToCart && (
        <div className="mt-2" onClick={handleInteractiveClick}>
          {cartItem ? (
            <CartQuantityControl
              availableQuantity={cartItem.availableQuantity}
              className="h-9 w-full"
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
              className="h-9 w-full"
              disabled={binderCard.quantity < 1}
              onClick={handleAddToCart}
            >
              {t("binder:detail.add_to_cart")}
            </Button>
          )}
        </div>
      )}
    </article>
  );
};

const BinderCardListItem = memo(BinderCardListItemComponent);

export const BinderCardList = ({
  binderCards,
  className,
  isDeletingCard,
  isMobile,
  isSelectionMode,
  onAddToCart,
  onDeleteCard,
  onOpenCard,
  onToggleCardSelection,
  selectedBinderCardIds,
  showConvertedMarketPrices,
}: BinderCardListProps) => {
  const { i18n, t } = useTranslation(["binder", "card", "common"]);
  const { convertAmountToLocalCurrency, currency } = usePricingSettings();
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
  const listItems = binderCards.map((binderCard, index) => (
    <BinderCardListItem
      key={binderCard.id}
      binderCard={binderCard}
      convertAmountToLocalCurrency={convertAmountToLocalCurrency}
      formatPrice={formatPrice}
      index={index}
      isDeletingCard={isDeletingCard}
      isMobileView={isMobile}
      isSelected={selectedBinderCardIds?.has(binderCard.id)}
      isSelectionMode={isSelectionMode}
      onAddToCart={onDeleteCard ? undefined : onAddToCart}
      onDeleteCard={onDeleteCard}
      onOpenCard={onOpenCard}
      onToggleCardSelection={onToggleCardSelection}
      showConvertedMarketPrices={showConvertedMarketPrices}
    />
  ));

  if (isMobile) {
    return <div className={cn("grid gap-4", className)}>{listItems}</div>;
  }

  return (
    <div
      role="table"
      className={cn(
        "hidden overflow-x-auto rounded-md border border-[#D8D3CC] bg-card text-card-foreground md:block md:overflow-visible",
        className
      )}
    >
      <div
        role="row"
        className={cn(
          "sticky top-[calc(env(safe-area-inset-top)+5.5rem)] z-20 grid min-w-[62rem] items-center bg-[#ECE9E4] px-3 py-3 text-xs font-medium text-primary",
          isSelectionMode
            ? selectableDesktopGridClassName
            : desktopGridClassName
        )}
      >
        {isSelectionMode && (
          <span role="columnheader">
            <span className="sr-only">{t("binder:detail.selected")}</span>
          </span>
        )}
        <span role="columnheader" className="pr-3">
          {t("card:printings.table.card")}
        </span>
        <span role="columnheader" className="pr-3">
          {t("card:information")}
        </span>
        <span role="columnheader" className="pr-3">
          {t("binder:list.quantity")}
        </span>
        <span role="columnheader" className="pr-3">
          {t("binder:list.user_price")}
        </span>
        <span role="columnheader" className="pr-3">
          {t("binder:detail.market_prices")}
        </span>
        <span role="columnheader" className="text-right">
          <span className="sr-only">{t("binder:actions.more")}</span>
        </span>
      </div>
      <div role="rowgroup">{listItems}</div>
    </div>
  );
};
