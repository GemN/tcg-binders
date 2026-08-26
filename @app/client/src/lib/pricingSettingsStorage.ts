export interface PricingSettingsStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export const showConvertedMarketPricesStorageKey =
  "tcgbinder.show_converted_market_prices";

export const readStoredShowConvertedMarketPrices = (
  storage: PricingSettingsStorage
): boolean => {
  return storage.getItem(showConvertedMarketPricesStorageKey) !== "false";
};

export const writeStoredShowConvertedMarketPrices = (
  storage: PricingSettingsStorage,
  showConvertedMarketPrices: boolean
): void => {
  storage.setItem(
    showConvertedMarketPricesStorageKey,
    String(showConvertedMarketPrices)
  );
};
