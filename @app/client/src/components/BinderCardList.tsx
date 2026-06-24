import { MarketPriceSource } from "@app/graphql";
import { useTranslation } from "react-i18next";

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
import { cn } from "@/lib/utils";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

interface BinderCardListProps {
  binderCards: BinderCardRecord[];
  className?: string;
  showConvertedMarketPrices: boolean;
}

export const BinderCardList = ({
  binderCards,
  className,
  showConvertedMarketPrices,
}: BinderCardListProps) => {
  const { i18n, t } = useTranslation(["common"]);
  const { convertAmount, currency } = usePricingSettings();

  const fallbackPrice = t("common:card.price_unavailable");
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {binderCards.map((binderCard) => {
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

            return (
              <TableRow
                key={binderCard.id}
                className="border-[#e8dfcf] odd:bg-[#fffdf7] even:bg-[#fbf3e4] hover:bg-[#f4e7cf]"
              >
                <TableCell className="px-3 py-2 font-medium uppercase tabular-nums text-[#6f6570]">
                  {binderCard.card?.cardSet?.code || "MTG"}
                </TableCell>
                <TableCell className="px-3 py-2 tabular-nums text-[#6f6570]">
                  {binderCard.card?.collectorNumber || "-"}
                </TableCell>
                <TableCell className="max-w-96 whitespace-normal px-3 py-2 font-medium text-[#3d3150]">
                  {binderCard.card?.name}
                </TableCell>
                <TableCell className="px-3 py-2 text-right font-medium tabular-nums text-[#343434]">
                  {formatPrice({
                    amount: binderCard.priceAmount,
                    shouldConvert: true,
                    sourceCurrency: binderCard.priceCurrency,
                  })}
                </TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums text-[#4f4a45]">
                  {formatPrice({
                    amount: cardkingdomPrice?.amount,
                    shouldConvert: showConvertedMarketPrices,
                    sourceCurrency: cardkingdomPrice?.currency,
                  })}
                </TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums text-[#4f4a45]">
                  {formatPrice({
                    amount: tcgplayerPrice?.amount,
                    shouldConvert: showConvertedMarketPrices,
                    sourceCurrency: tcgplayerPrice?.currency,
                  })}
                </TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums text-[#4f4a45]">
                  {formatPrice({
                    amount: cardmarketPrice?.amount,
                    shouldConvert: showConvertedMarketPrices,
                    sourceCurrency: cardmarketPrice?.currency,
                  })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
