import {
  CurrencyCode,
  MarketPriceSource,
  useCurrentCurrencyRatesQuery,
} from "@app/graphql";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type ConvertAmountToLocalCurrency,
  isSupportedCurrency,
  isSupportedPriceSource,
  PricingSettingsContext,
  type SupportedCurrency,
  type SupportedPriceSource,
} from "@/providers/PricingSettingsContext";

interface PricingSettingsProviderProps {
  children: ReactNode;
}

const currencyStorageKey = "tcgbinder.currency";
const priceSourceStorageKey = "tcgbinder.price_source";

const defaultCurrency = CurrencyCode.Thb;
const defaultPriceSource = MarketPriceSource.Tcgplayer;

const readStoredCurrency = (): SupportedCurrency => {
  if (typeof window === "undefined") return defaultCurrency;

  const storedCurrency = window.localStorage.getItem(currencyStorageKey);
  return storedCurrency && isSupportedCurrency(storedCurrency)
    ? storedCurrency
    : defaultCurrency;
};

const readStoredPriceSource = (): SupportedPriceSource => {
  if (typeof window === "undefined") return defaultPriceSource;

  const storedPriceSource = window.localStorage.getItem(priceSourceStorageKey);
  return storedPriceSource && isSupportedPriceSource(storedPriceSource)
    ? storedPriceSource
    : defaultPriceSource;
};

export const PricingSettingsProvider = ({
  children,
}: PricingSettingsProviderProps) => {
  const [currency, setCurrency] =
    useState<SupportedCurrency>(readStoredCurrency);
  const [priceSource, setPriceSource] = useState<SupportedPriceSource>(
    readStoredPriceSource
  );
  const { data, error } = useCurrentCurrencyRatesQuery({
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    window.localStorage.setItem(currencyStorageKey, currency);
  }, [currency]);

  useEffect(() => {
    window.localStorage.setItem(priceSourceStorageKey, priceSource);
  }, [priceSource]);

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  const rates = useMemo(() => {
    const nextRates: Partial<Record<SupportedCurrency, number>> = {
      [CurrencyCode.Usd]: 1,
    };

    data?.currencyRatesCollection?.edges.forEach(({ node }) => {
      if (!isSupportedCurrency(node.quoteCurrency)) {
        return;
      }

      const rate = Number(node.rate);
      if (Number.isFinite(rate) && rate > 0) {
        nextRates[node.quoteCurrency] = rate;
      }
    });

    return nextRates;
  }, [data?.currencyRatesCollection?.edges]);

  const convertAmountToLocalCurrency = useCallback<ConvertAmountToLocalCurrency>(
    (amount, sourceCurrency) => {
      if (!Number.isFinite(amount) || amount < 0) return null;
      if (!isSupportedCurrency(sourceCurrency)) return null;
      if (sourceCurrency === currency) return amount;

      const sourceRate = rates[sourceCurrency];
      const targetRate = rates[currency];
      if (!sourceRate || !targetRate) return null;

      return (amount / sourceRate) * targetRate;
    },
    [currency, rates]
  );

  const value = useMemo(
    () => ({
      convertAmountToLocalCurrency,
      currency,
      priceSource,
      setCurrency,
      setPriceSource,
    }),
    [convertAmountToLocalCurrency, currency, priceSource]
  );

  return (
    <PricingSettingsContext.Provider value={value}>
      {children}
    </PricingSettingsContext.Provider>
  );
};
