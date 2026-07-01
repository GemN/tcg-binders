import { CurrencyCode } from "@app/graphql";

import type { BinderCardDetailRecord } from "@/lib/binderCardPricing";
import {
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/providers/PricingSettingsContext";

import type { BinderCardVariant, ModalBinderCardRecord } from "./types";

const customCkdMultiplierStorageKey =
  "tcgbinder.binder_card.custom_ckd_multiplier";
const priceCurrencyStorageKey = "tcgbinder.binder_card.price_currency";

export const formatFallbackLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const getDefaultFinish = (
  finishes: readonly (string | null)[]
): string => {
  const cleanFinishes = finishes.filter((finish): finish is string => !!finish);
  if (cleanFinishes.includes("normal")) return "normal";
  if (cleanFinishes.includes("nonfoil")) return "nonfoil";
  return cleanFinishes[0] || "normal";
};

export const formatPriceInputValue = (
  amount: number | string | null | undefined
): string => {
  if (amount === null || amount === undefined) return "";
  return String(amount);
};

export const readStoredCustomCkdMultiplier = (): string => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(customCkdMultiplierStorageKey) || "";
};

export const writeStoredCustomCkdMultiplier = (multiplier: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(customCkdMultiplierStorageKey, multiplier);
};

export const readStoredBinderCardPriceCurrency = (
  fallbackCurrency: SupportedCurrency
): SupportedCurrency => {
  if (typeof window === "undefined") return fallbackCurrency;

  const storedCurrency = window.localStorage.getItem(priceCurrencyStorageKey);
  return storedCurrency && isSupportedCurrency(storedCurrency)
    ? storedCurrency
    : fallbackCurrency;
};

export const writeStoredBinderCardPriceCurrency = (
  currency: CurrencyCode
) => {
  if (typeof window === "undefined") return;
  if (!isSupportedCurrency(currency)) return;

  window.localStorage.setItem(priceCurrencyStorageKey, currency);
};

export const shouldIgnoreModalNavigationKey = (
  target: EventTarget | null
): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    "input, textarea, select, [contenteditable='true'], [role='combobox'], [role='textbox'], [role='radio'], [role='radiogroup'], [data-slot='select-content'], [aria-expanded='true']"
  );
};

export const getCardDetail = (
  card: ModalBinderCardRecord["card"] | null | undefined
): NonNullable<BinderCardDetailRecord["card"]>["mtgCardDetail"] | null => {
  if (!card || !("mtgCardDetail" in card)) return null;
  const detail = card.mtgCardDetail;

  if (!detail || !("typeLine" in detail) || !("oracleText" in detail)) {
    return null;
  }

  return detail;
};

export const arePriceAmountsEqual = (
  currentAmount: number | string | null | undefined,
  nextAmount: string | null
): boolean => {
  if (
    (currentAmount === null || currentAmount === undefined) &&
    nextAmount === null
  ) {
    return true;
  }

  if (
    currentAmount === null ||
    currentAmount === undefined ||
    nextAmount === null
  ) {
    return false;
  }

  return Number(currentAmount) === Number(nextAmount);
};

export const getVariantLabel = (variant: BinderCardVariant): string => {
  const setCode = variant.cardSet?.code || "MTG";
  const collectorNumber = variant.collectorNumber
    ? ` #${variant.collectorNumber}`
    : "";
  return `${setCode}${collectorNumber}`;
};
