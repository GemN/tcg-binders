import { CurrencyCode, MarketPriceSource } from "@app/graphql";
import { useTranslation } from "react-i18next";

import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

export type BinderCardViewMode = "grid" | "list";

export interface BinderCardRecord {
  card: {
    cardSet?: {
      code?: string | null;
      name?: string | null;
    } | null;
    collectorNumber?: string | null;
    imageNormalUrl?: string | null;
    imageSmallUrl?: string | null;
    marketPrices?: {
      edges: Array<{
        node: {
          amount: number | string;
          currency: CurrencyCode;
          finish: string;
          priceDate?: string | null;
          source: MarketPriceSource;
        };
      }>;
    } | null;
    name: string;
    releasedAt?: string | null;
  } | null;
  finish: string;
  id: string;
  priceAmount?: number | string | null;
  priceCurrency?: CurrencyCode | null;
}

interface BinderCardProps {
  binderCard: BinderCardRecord;
  noImageLabel: string;
  showConvertedMarketPrices: boolean;
}

const BinderCardImage = ({
  card,
  noImageLabel,
  className,
}: {
  card: BinderCardRecord["card"];
  noImageLabel: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex aspect-[63/88] items-center justify-center overflow-hidden rounded-md border border-primary/25 bg-background/70 shadow-2xl shadow-background/40 ring-1 ring-background/40",
        className
      )}
    >
      {card?.imageNormalUrl || card?.imageSmallUrl ? (
        <img
          src={card.imageNormalUrl || card.imageSmallUrl || ""}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-sm text-muted-foreground">{noImageLabel}</span>
      )}
    </div>
  );
};

const BinderCardMeta = ({
  binderCard,
  showConvertedMarketPrices,
}: {
  binderCard: BinderCardRecord;
  showConvertedMarketPrices: boolean;
}) => {
  const card = binderCard.card;
  const { i18n, t } = useTranslation(["common"]);
  const { convertAmount, currency, priceSource } = usePricingSettings();
  const marketPrice = getMarketPrice(binderCard, priceSource);
  const displayPrice = getDisplayPrice({
    amount: marketPrice?.amount,
    convertAmount,
    displayCurrency: currency,
    locale: i18n.language,
    shouldConvert: showConvertedMarketPrices,
    sourceCurrency: marketPrice?.currency,
  });

  return (
    <div className="min-w-0">
      <h2 className="truncate text-sm font-medium">{card?.name}</h2>
      <p className="mt-1 truncate text-xs text-current/70">
        {card?.cardSet?.code || "MTG"}
        {card?.releasedAt ? ` · ${card.releasedAt}` : ""}
      </p>
      <p className="mt-1 truncate text-xs font-semibold text-primary">
        {displayPrice || t("common:card.price_unavailable")}
      </p>
    </div>
  );
};

const getDisplayPrice = ({
  amount,
  convertAmount,
  displayCurrency,
  locale,
  shouldConvert,
  sourceCurrency,
}: {
  amount: number | string | null | undefined;
  convertAmount: (amount: number, sourceCurrency: CurrencyCode) => number | null;
  displayCurrency: CurrencyCode;
  locale: string;
  shouldConvert: boolean;
  sourceCurrency: CurrencyCode | null | undefined;
}) => {
  if (amount === null || amount === undefined || !sourceCurrency) return null;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return null;

  if (!shouldConvert) {
    return formatCurrency(numericAmount, sourceCurrency, locale);
  }

  const convertedAmount = convertAmount(numericAmount, sourceCurrency);
  if (convertedAmount === null) return null;

  return formatCurrency(convertedAmount, displayCurrency, locale);
};

const getMarketPrice = (
  binderCard: BinderCardRecord,
  priceSource: MarketPriceSource
) => {
  const sourcePrices =
    binderCard.card?.marketPrices?.edges
      .map(({ node }) => node)
      .filter((price) => price.source === priceSource) || [];

  return (
    sourcePrices.find((price) => price.finish === binderCard.finish) ||
    sourcePrices.find((price) => price.finish === "normal") ||
    sourcePrices[0] ||
    null
  );
};

export const BinderCard = ({
  binderCard,
  noImageLabel,
  showConvertedMarketPrices,
}: BinderCardProps) => {
  return (
    <article className="group grid w-full max-w-[12rem] gap-2 text-foreground transition-transform hover:-translate-y-1">
      <BinderCardImage
        card={binderCard.card}
        noImageLabel={noImageLabel}
      />
      <BinderCardMeta
        binderCard={binderCard}
        showConvertedMarketPrices={showConvertedMarketPrices}
      />
    </article>
  );
};
