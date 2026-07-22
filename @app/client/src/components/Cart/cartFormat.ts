import type { CurrencyCode } from "@app/graphql";

import type { CartCurrencyTotal, CartItem } from "@/lib/cart";
import { formatCurrency } from "@/lib/currency";

export type CartTranslate = (
  key: string,
  options?: Record<string, unknown>
) => string;

interface FormatAmountParams {
  amount: number;
  currency: CurrencyCode;
  locale: string;
}

export const formatAmount = ({
  amount,
  currency,
  locale,
}: FormatAmountParams) => {
  return formatCurrency(amount, currency, locale);
};

interface FormatTotalsParams {
  locale: string;
  totals: CartCurrencyTotal[];
}

export const formatTotals = ({ locale, totals }: FormatTotalsParams): string => {
  return totals
    .map((total) =>
      formatAmount({
        amount: total.amount,
        currency: total.currency,
        locale,
      })
    )
    .join(" + ");
};

const formatFallbackOption = (value: string): string => {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

interface GetCartItemOptionLabelParams {
  group: "condition" | "finish" | "language";
  t: CartTranslate;
  value: string | null;
}

export const getCartItemOptionLabel = ({
  group,
  t,
  value,
}: GetCartItemOptionLabelParams): string | null => {
  if (!value) return null;

  return t(`common:card.${group}.${value}`, {
    defaultValue: formatFallbackOption(value),
  });
};

interface GetCardPrintLabelParams {
  collectorNumber: string | null | undefined;
  setCode: string | null | undefined;
}

export const getCardPrintLabel = ({
  collectorNumber,
  setCode,
}: GetCardPrintLabelParams): string | null => {
  const printParts = [
    setCode,
    collectorNumber ? `#${collectorNumber}` : null,
  ].filter((part): part is string => !!part);

  return printParts.length > 0 ? printParts.join(" ") : null;
};

interface GetCartItemPrintLabelParams {
  item: CartItem;
}

export const getCartItemPrintLabel = ({
  item,
}: GetCartItemPrintLabelParams): string | null => {
  return getCardPrintLabel({
    collectorNumber: item.card.collectorNumber,
    setCode: item.card.setCode,
  });
};
