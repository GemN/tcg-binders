import { CardCondition, CurrencyCode, LanguageCode } from "@app/graphql";

import {
  defaultCardCondition,
  defaultCardFinish,
  defaultCardLanguage,
} from "@/config/card";

import type { BinderImportCardRecord, BinderImportItem } from "./types";

export const cardLookupPageSize = 30;
export const externalIdLookupBatchSize = 30;
export const printLookupBatchSize = 10;
export const splitCardNameSeparator = " // ";

const supportedCurrencies = new Set<string>(Object.values(CurrencyCode));
const supportedLanguages = new Set<string>(Object.values(LanguageCode));
const supportedConditions = new Set<string>(Object.values(CardCondition));

export const parseQuantity = (value: string | undefined): number | null => {
  const quantity = Number.parseInt(value || "", 10);
  if (!Number.isInteger(quantity) || quantity <= 0) return null;
  return quantity;
};

export const parsePriceAmount = (value: string): string | undefined => {
  if (!value) return undefined;

  const input = value.trim();
  const amount = Number(input);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  return input;
};

export const parseCurrency = (value: string): CurrencyCode | undefined => {
  const currency = value.toUpperCase();
  if (!supportedCurrencies.has(currency)) return undefined;
  return currency as CurrencyCode;
};

export const parseCondition = (value: string): CardCondition => {
  const condition = value.toLowerCase();
  if (supportedConditions.has(condition)) {
    return condition as CardCondition;
  }

  return defaultCardCondition;
};

export const parseLanguage = (value: string): LanguageCode => {
  const language = value.toLowerCase().replace("_cn", "s").replace("_tw", "t");
  if (supportedLanguages.has(language)) {
    return language as LanguageCode;
  }

  return defaultCardLanguage;
};

export const getAvailableFinish = (
  preferredFinish: string,
  finishes: Array<string | null>
): string => {
  const availableFinishes = finishes.filter(
    (finish): finish is string => !!finish
  );

  if (availableFinishes.includes(preferredFinish)) {
    return preferredFinish;
  }

  if (availableFinishes.includes(defaultCardFinish)) {
    return defaultCardFinish;
  }

  return availableFinishes[0] || defaultCardFinish;
};

export const chunkItems = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

export const uniqueItemsByKey = (
  items: BinderImportItem[],
  getKey: (item: BinderImportItem) => string
): BinderImportItem[] => {
  const byKey = new Map<string, BinderImportItem>();

  items.forEach((item) => {
    const key = getKey(item);
    if (key && !byKey.has(key)) {
      byKey.set(key, item);
    }
  });

  return [...byKey.values()];
};

export const getBatchSourceItems = (
  sourceItems: BinderImportItem[],
  batchItems: BinderImportItem[],
  getKey: (item: BinderImportItem) => string
): BinderImportItem[] => {
  const batchKeys = new Set(batchItems.map(getKey));
  return sourceItems.filter((item) => batchKeys.has(getKey(item)));
};

export const getPrintLookupKey = (item: BinderImportItem): string => {
  return [normalizeValue(item.name), normalizeValue(item.collectorNumber || "")]
    .filter(Boolean)
    .join("|");
};

export const getPrintKey = (
  name: string,
  setCode: string | null | undefined,
  collectorNumber: string | null | undefined
): string => {
  return [
    normalizeValue(name),
    normalizeValue(setCode || ""),
    normalizeValue(collectorNumber || ""),
  ].join("|");
};

export const getCardNameAliases = (name: string): string[] => {
  const firstFaceName = name.split(splitCardNameSeparator)[0]?.trim();
  if (!firstFaceName || firstFaceName === name) return [name];
  return [name, firstFaceName];
};

export const indexCardsForImport = (
  cards: BinderImportCardRecord[]
): {
  byExternalId: Map<string, BinderImportCardRecord>;
  byPrintKey: Map<string, BinderImportCardRecord>;
} => {
  const byExternalId = new Map(
    cards.map((card) => [normalizeValue(card.externalId), card])
  );
  const byPrintKey = new Map<string, BinderImportCardRecord>();

  cards.forEach((card) => {
    getCardNameAliases(card.name).forEach((name) => {
      const key = getPrintKey(name, card.cardSet?.code, card.collectorNumber);
      if (!byPrintKey.has(key)) {
        byPrintKey.set(key, card);
      }
    });
  });

  return { byExternalId, byPrintKey };
};

export const normalizeValue = (value: string): string => {
  return value.trim().toLowerCase();
};
