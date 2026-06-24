const currencySymbols: Record<
  string,
  { symbol: string; position: "prefix" | "suffix" }
> = {
  EUR: { symbol: "€", position: "suffix" },
  GBP: { symbol: "£", position: "prefix" },
  THB: { symbol: "฿", position: "prefix" },
  USD: { symbol: "$", position: "prefix" },
};

export const getCurrencyFractionDigits = (currency: string) => {
  return currency === "THB" ? 0 : 2;
};

export const formatCurrency = (
  amount: number,
  currency: string,
  locale: string
) => {
  const fractionDigits = getCurrencyFractionDigits(currency);
  const display = currencySymbols[currency];

  if (!display) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  }

  const sign = amount < 0 ? "-" : "";
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(amount));

  if (display.position === "suffix") {
    return `${sign}${formattedAmount} ${display.symbol}`;
  }

  return `${sign}${display.symbol}${formattedAmount}`;
};
