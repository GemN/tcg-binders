import { MarketPriceSource } from "@app/graphql";
import { type MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { BinderCardActionsMenu } from "@/components/BinderCardActionsMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  type BinderCardRecord,
  type BinderCardPriceInput,
  formatBinderCardPrice,
  getBinderCardMarketPrice,
} from "@/lib/binderCardPricing";
import { getCardConditionAbbreviation } from "@/lib/cardCondition";
import { cn } from "@/lib/utils";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

interface BinderCardListProps {
  binderCards: BinderCardRecord[];
  className?: string;
  isDeletingCard?: boolean;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onOpenCard: (binderCard: BinderCardRecord, index: number) => void;
  showConvertedMarketPrices: boolean;
}

interface CardPreviewState {
  binderCard: BinderCardRecord;
  left: number;
  top: number;
}

const CARD_PREVIEW_WIDTH = 180;
const CARD_PREVIEW_HEIGHT = Math.round((CARD_PREVIEW_WIDTH * 88) / 63);
const CARD_PREVIEW_OFFSET = 18;
const CARD_PREVIEW_MARGIN = 12;

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

export const BinderCardList = ({
  binderCards,
  className,
  isDeletingCard,
  onDeleteCard,
  onOpenCard,
  showConvertedMarketPrices,
}: BinderCardListProps) => {
  const { i18n, t } = useTranslation(["common"]);
  const { convertAmount, currency } = usePricingSettings();
  const [cardPreview, setCardPreview] = useState<CardPreviewState | null>(null);

  const fallbackPrice = "-";
  const formatPrice = ({
    amount,
    shouldConvert,
    sourceCurrency,
  }: BinderCardPriceInput) =>
    formatBinderCardPrice({
      amount,
      convertAmount,
      displayCurrency: currency,
      locale: i18n.language,
      shouldConvert,
      sourceCurrency,
    }) || fallbackPrice;
  const previewCard = cardPreview?.binderCard.card;
  const previewImageUrl =
    previewCard?.imageNormalUrl || previewCard?.imageSmallUrl;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-[#d8d1c3] bg-[#fffaf0] text-[#343434] shadow-sm",
        className
      )}
    >
      <Table className="text-[13px]">
        <TableHeader className="bg-[#f2ebdd]">
          <TableRow className="border-[#d8d1c3] hover:bg-transparent">
            <TableHead className="h-9 w-20 px-3 text-[11px] font-semibold uppercase text-[#6f6570]">
              {t("common:binder.list.set")}
            </TableHead>
            <TableHead className="h-9 w-20 px-3 text-[11px] font-semibold uppercase text-[#6f6570]">
              {t("common:binder.list.collector_number")}
            </TableHead>
            <TableHead className="h-9 min-w-60 px-3 text-[11px] font-semibold uppercase text-[#6f6570]">
              {t("common:binder.list.name")}
            </TableHead>
            <TableHead className="h-9 w-16 px-3 text-right text-[11px] font-semibold uppercase text-[#6f6570]">
              {t("common:binder.list.quantity")}
            </TableHead>
            <TableHead className="h-9 w-24 px-3 text-[11px] font-semibold uppercase text-[#6f6570]">
              {t("common:binder.list.condition")}
            </TableHead>
            <TableHead className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-[#6f6570]">
              {t("common:binder.list.user_price")}
            </TableHead>
            <TableHead className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-[#6f6570]">
              {t("common:binder.list.cardkingdom_price")}
            </TableHead>
            <TableHead className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-[#6f6570]">
              {t("common:binder.list.tcgplayer_price")}
            </TableHead>
            <TableHead className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-[#6f6570]">
              {t("common:binder.list.cardmarket_price")}
            </TableHead>
            {onDeleteCard && <TableHead className="h-9 w-12 px-3" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {binderCards.map((binderCard, index) => {
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
            const cardName = binderCard.card?.name || t("common:not_available");
            const conditionLabel = t(
              `common:card.condition.${binderCard.condition}`
            );
            const conditionAbbreviation = t(
              `common:card.condition_short.${binderCard.condition}`,
              {
                defaultValue: getCardConditionAbbreviation(
                  binderCard.condition
                ),
              }
            );
            const openCard = () => onOpenCard(binderCard, index);

            return (
              <TableRow
                key={binderCard.id}
                className="border-[#e8dfcf] odd:bg-[#fffdf7] even:bg-[#fbf3e4] hover:bg-[#f4e7cf]"
                onMouseEnter={(event) => {
                  const { left, top } = getCardPreviewPosition(event);
                  setCardPreview({ binderCard, left, top });
                }}
                onMouseMove={(event) => {
                  const { left, top } = getCardPreviewPosition(event);
                  setCardPreview({ binderCard, left, top });
                }}
                onMouseLeave={() => setCardPreview(null)}
              >
                <TableCell
                  className="cursor-pointer px-3 py-2 font-medium uppercase tabular-nums text-[#6f6570]"
                  onClick={openCard}
                >
                  {binderCard.card?.cardSet?.code || "MTG"}
                </TableCell>
                <TableCell
                  className="cursor-pointer px-3 py-2 tabular-nums text-[#6f6570]"
                  onClick={openCard}
                >
                  {binderCard.card?.collectorNumber || "-"}
                </TableCell>
                <TableCell className="max-w-96 whitespace-normal px-3 py-2 font-medium text-[#3d3150]">
                  <button
                    type="button"
                    className="w-full cursor-pointer border-0 bg-transparent p-0 text-left font-medium text-[#3d3150] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={t("common:binder.detail.open_card", {
                      name: cardName,
                    })}
                    onClick={openCard}
                  >
                    {cardName}
                  </button>
                </TableCell>
                <TableCell
                  className="cursor-pointer px-3 py-2 text-right font-medium tabular-nums text-[#343434]"
                  onClick={openCard}
                >
                  {binderCard.quantity}
                </TableCell>
                <TableCell
                  title={conditionLabel}
                  className="cursor-pointer px-3 py-2 font-medium uppercase tabular-nums text-[#6f6570]"
                  onClick={openCard}
                >
                  {conditionAbbreviation}
                </TableCell>
                <TableCell
                  className="cursor-pointer px-3 py-2 text-right font-medium tabular-nums text-[#343434]"
                  onClick={openCard}
                >
                  {formatPrice({
                    amount: binderCard.priceAmount,
                    shouldConvert: true,
                    sourceCurrency: binderCard.priceCurrency,
                  })}
                </TableCell>
                <TableCell
                  className="cursor-pointer px-3 py-2 text-right font-medium tabular-nums text-[#2d4059]"
                  onClick={openCard}
                >
                  {formatPrice({
                    amount: cardkingdomPrice?.amount,
                    shouldConvert: showConvertedMarketPrices,
                    sourceCurrency: cardkingdomPrice?.currency,
                  })}
                </TableCell>
                <TableCell
                  className="cursor-pointer px-3 py-2 text-right font-medium tabular-nums text-[#ea5455]"
                  onClick={openCard}
                >
                  {formatPrice({
                    amount: tcgplayerPrice?.amount,
                    shouldConvert: showConvertedMarketPrices,
                    sourceCurrency: tcgplayerPrice?.currency,
                  })}
                </TableCell>
                <TableCell
                  className="cursor-pointer px-3 py-2 text-right font-medium tabular-nums text-[#2f7d5c]"
                  onClick={openCard}
                >
                  {formatPrice({
                    amount: cardmarketPrice?.amount,
                    shouldConvert: showConvertedMarketPrices,
                    sourceCurrency: cardmarketPrice?.currency,
                  })}
                </TableCell>
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
          })}
        </TableBody>
      </Table>
      {cardPreview && (
        <div
          className="pointer-events-none fixed z-40 overflow-hidden rounded-md border border-[#d8d1c3] bg-[#343434] shadow-2xl shadow-black/30"
          style={{
            left: cardPreview.left,
            top: cardPreview.top,
            width: CARD_PREVIEW_WIDTH,
            height: CARD_PREVIEW_HEIGHT,
          }}
        >
          {previewImageUrl ? (
            <img
              src={previewImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-[#fde9c9]">
              {t("common:binder.no_image")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
