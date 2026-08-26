import assert from "node:assert/strict";
import test from "node:test";

import {
  type PricingSettingsStorage,
  readStoredShowConvertedMarketPrices,
  showConvertedMarketPricesStorageKey,
  writeStoredShowConvertedMarketPrices,
} from "./pricingSettingsStorage.ts";

class MemoryPricingSettingsStorage implements PricingSettingsStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

test("defaults converted market prices on when no preference is stored", () => {
  const storage = new MemoryPricingSettingsStorage();

  assert.equal(readStoredShowConvertedMarketPrices(storage), true);
});

test("restores an explicitly disabled converted market price preference", () => {
  const storage = new MemoryPricingSettingsStorage();
  storage.setItem(showConvertedMarketPricesStorageKey, "false");

  assert.equal(readStoredShowConvertedMarketPrices(storage), false);
});

test("defaults converted market prices on for an invalid stored value", () => {
  const storage = new MemoryPricingSettingsStorage();
  storage.setItem(showConvertedMarketPricesStorageKey, "invalid");

  assert.equal(readStoredShowConvertedMarketPrices(storage), true);
});

test("persists converted market price preferences as boolean strings", () => {
  const storage = new MemoryPricingSettingsStorage();

  writeStoredShowConvertedMarketPrices(storage, false);
  assert.equal(storage.getItem(showConvertedMarketPricesStorageKey), "false");

  writeStoredShowConvertedMarketPrices(storage, true);
  assert.equal(storage.getItem(showConvertedMarketPricesStorageKey), "true");
});
