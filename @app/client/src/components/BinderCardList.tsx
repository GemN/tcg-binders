import { CurrencyCode, MarketPriceSource } from "@app/graphql";
import { useTranslation } from "react-i18next";

import type { BinderCardRecord } from "@/components/BinderCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { formatCurrency } from "@/lib/currency";
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

  const formatConvertedPrice = (
    amount: number | string | null | undefined,
    sourceCurrency: CurrencyCode | null | undefined
  ) => {
    if (amount === null || amount === undefined || !sourceCurrency) {
      return t("common:card.price_unavailable");
    }

    const convertedAmount = convertAmount(Number(amount), sourceCurrency);
    if (convertedAmount === null) {
      return t("common:card.price_unavailable");
    }

    return formatCurrency(convertedAmount, currency, i18n.language);
  };

  const formatMarketPrice = (
    amount: number | string | null | undefined,
    sourceCurrency: CurrencyCode | null | undefined
  ) => {
    if (showConvertedMarketPrices) {
      return formatConvertedPrice(amount, sourceCurrency);
    }

    if (amount === null || amount === undefined || !sourceCurrency) {
      return t("common:card.price_unavailable");
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
      return t("common:card.price_unavailable");
    }

    return formatCurrency(numericAmount, sourceCurrency, i18n.language);
  };

  const getSourcePrice = (
    binderCard: BinderCardRecord,
    source: MarketPriceSource
  ) => {
    const sourcePrices =
      binderCard.card?.marketPrices?.edges
        .map(({ node }) => node)
        .filter((price) => price.source === source) || [];

    return (
      sourcePrices.find((price) => price.finish === binderCard.finish) ||
      sourcePrices.find((price) => price.finish === "normal") ||
      sourcePrices[0] ||
      null
    );
  };

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
            const cardkingdomPrice = getSourcePrice(
              binderCard,
              MarketPriceSource.Cardkingdom
            );
            const tcgplayerPrice = getSourcePrice(
              binderCard,
              MarketPriceSource.Tcgplayer
            );
            const cardmarketPrice = getSourcePrice(
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
                  {formatConvertedPrice(
                    binderCard.priceAmount,
                    binderCard.priceCurrency
                  )}
                </TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums text-[#4f4a45]">
                  {formatMarketPrice(
                    cardkingdomPrice?.amount,
                    cardkingdomPrice?.currency
                  )}
                </TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums text-[#4f4a45]">
                  {formatMarketPrice(
                    tcgplayerPrice?.amount,
                    tcgplayerPrice?.currency
                  )}
                </TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums text-[#4f4a45]">
                  {formatMarketPrice(
                    cardmarketPrice?.amount,
                    cardmarketPrice?.currency
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
