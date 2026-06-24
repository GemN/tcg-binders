import { CurrencyCode, MarketPriceSource } from "@app/graphql";
import { createContext, useContext } from "react";

export const supportedCurrencies = [
  CurrencyCode.Thb,
  CurrencyCode.Usd,
  CurrencyCode.Eur,
  CurrencyCode.Gbp,
] as const;

export const supportedPriceSources = [
  MarketPriceSource.Tcgplayer,
  MarketPriceSource.Cardkingdom,
  MarketPriceSource.Cardmarket,
] as const;

export type SupportedCurrency = (typeof supportedCurrencies)[number];
export type SupportedPriceSource = (typeof supportedPriceSources)[number];

export interface PricingSettingsContextValue {
  convertAmount: (
    amount: number,
    sourceCurrency: CurrencyCode
  ) => number | null;
  currency: SupportedCurrency;
  priceSource: SupportedPriceSource;
  setCurrency: (currency: SupportedCurrency) => void;
  setPriceSource: (priceSource: SupportedPriceSource) => void;
}

export const PricingSettingsContext =
  createContext<PricingSettingsContextValue | null>(null);

export const usePricingSettings = () => {
  const context = useContext(PricingSettingsContext);
  if (!context) {
    throw new Error("usePricingSettings must be used within PricingSettingsProvider");
  }
  return context;
};

export const isSupportedCurrency = (
  currency: string
): currency is SupportedCurrency => {
  return supportedCurrencies.includes(currency as SupportedCurrency);
};

export const isSupportedPriceSource = (
  priceSource: string
): priceSource is SupportedPriceSource => {
  return supportedPriceSources.includes(priceSource as SupportedPriceSource);
};
