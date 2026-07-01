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
  type ConvertAmountToTargetCurrency,
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

const fallbackCurrency = CurrencyCode.Usd;
const defaultPriceSource = MarketPriceSource.Tcgplayer;

const europeanRegionCodes = new Set([
  "AD",
  "AL",
  "AT",
  "AX",
  "BA",
  "BE",
  "BG",
  "BY",
  "CH",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FO",
  "FR",
  "GG",
  "GI",
  "GR",
  "HR",
  "HU",
  "IE",
  "IM",
  "IS",
  "IT",
  "JE",
  "LI",
  "LT",
  "LU",
  "LV",
  "MC",
  "MD",
  "ME",
  "MK",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "RS",
  "RU",
  "SE",
  "SI",
  "SJ",
  "SK",
  "SM",
  "TR",
  "UA",
  "VA",
  "XK",
]);
const europeanLanguageCodes = new Set([
  "be",
  "bg",
  "bs",
  "ca",
  "cs",
  "da",
  "de",
  "el",
  "es",
  "et",
  "fi",
  "fr",
  "ga",
  "hr",
  "hu",
  "is",
  "it",
  "lt",
  "lv",
  "mk",
  "mt",
  "nl",
  "no",
  "pl",
  "pt",
  "ro",
  "sk",
  "sl",
  "sq",
  "sr",
  "sv",
  "uk",
]);

const getBrowserLocales = (): string[] => {
  if (typeof navigator === "undefined") return [];

  if (navigator.languages.length > 0) {
    return [...navigator.languages];
  }

  return navigator.language ? [navigator.language] : [];
};

const getLocaleParts = (locale: string) => {
  const parts = locale.replace(/_/g, "-").split("-");
  const language = parts[0]?.toLowerCase() || "";
  const region =
    parts
      .slice(1)
      .reverse()
      .find((part) => /^[a-zA-Z]{2}$/.test(part) || /^\d{3}$/.test(part))
      ?.toUpperCase() || null;

  return { language, region };
};

const getDefaultCurrencyForLocale = (
  locale: string
): SupportedCurrency | null => {
  const { language, region } = getLocaleParts(locale);

  if (language === "th" || region === "TH") return CurrencyCode.Thb;
  if (region === "GB" || region === "UK") return CurrencyCode.Gbp;
  if (region && europeanRegionCodes.has(region)) return CurrencyCode.Eur;
  if (!region && europeanLanguageCodes.has(language)) return CurrencyCode.Eur;

  return null;
};

const getBrowserDefaultCurrency = (): SupportedCurrency => {
  for (const locale of getBrowserLocales()) {
    const defaultCurrency = getDefaultCurrencyForLocale(locale);
    if (defaultCurrency) return defaultCurrency;
  }

  return fallbackCurrency;
};

const readStoredCurrency = (): SupportedCurrency => {
  if (typeof window === "undefined") return fallbackCurrency;

  const storedCurrency = window.localStorage.getItem(currencyStorageKey);
  return storedCurrency && isSupportedCurrency(storedCurrency)
    ? storedCurrency
    : getBrowserDefaultCurrency();
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

  const convertAmountToTargetCurrency =
    useCallback<ConvertAmountToTargetCurrency>(
      (amount, sourceCurrency, targetCurrency) => {
        if (!Number.isFinite(amount) || amount < 0) return null;
        if (!isSupportedCurrency(sourceCurrency)) return null;
        if (!isSupportedCurrency(targetCurrency)) return null;
        if (sourceCurrency === targetCurrency) return amount;

        const sourceRate = rates[sourceCurrency];
        const targetRate = rates[targetCurrency];
        if (!sourceRate || !targetRate) return null;

        return (amount / sourceRate) * targetRate;
      },
      [rates]
    );

  const convertAmountToLocalCurrency =
    useCallback<ConvertAmountToLocalCurrency>(
      (amount, sourceCurrency) => {
        return convertAmountToTargetCurrency(amount, sourceCurrency, currency);
      },
      [convertAmountToTargetCurrency, currency]
    );

  const value = useMemo(
    () => ({
      convertAmountToTargetCurrency,
      convertAmountToLocalCurrency,
      currency,
      priceSource,
      setCurrency,
      setPriceSource,
    }),
    [
      convertAmountToTargetCurrency,
      convertAmountToLocalCurrency,
      currency,
      priceSource,
    ]
  );

  return (
    <PricingSettingsContext.Provider value={value}>
      {children}
    </PricingSettingsContext.Provider>
  );
};
