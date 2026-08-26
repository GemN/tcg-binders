import assert from "node:assert/strict";
import test from "node:test";

import type {
  CardCondition,
  CurrencyCode,
  LanguageCode,
  MarketPriceSource,
} from "@app/graphql";

import {
  binderImportItemsToDraftCards,
  createDraftCardSnapshot,
} from "./draftBinder.ts";
import type { BinderImportResolvedItem } from "./import/types.ts";

const excellentCondition = "excellent" as CardCondition;
const japaneseLanguage = "ja" as LanguageCode;
const jpyCurrency = "JPY" as CurrencyCode;
const thbCurrency = "THB" as CurrencyCode;
const cardmarketSource = "cardmarket" as MarketPriceSource;

const resolvedImportItem: BinderImportResolvedItem = {
  card: {
    id: "card-id",
    externalId: "external-card-id",
    name: "Lightning Bolt",
    collectorNumber: "150",
    rarity: "uncommon",
    finishes: ["nonfoil", null, "foil"],
    imageUrl: "https://example.com/lightning-bolt.jpg",
    releasedAt: "2025-01-24",
    cardSet: {
      id: "set-id",
      code: "DFT",
      name: "Draft Test",
      releaseAt: "2025-01-24",
    },
    mtgCardDetail: {
      oracleText: "Lightning Bolt deals 3 damage to any target.",
      scryfallId: "scryfall-id",
      typeLine: "Instant",
    },
    marketPrices: {
      edges: [
        {
          node: {
            amount: "123.45",
            buyUrl: "https://example.com/buy",
            currency: thbCurrency,
            finish: "foil",
            priceDate: "2026-08-08",
            source: cardmarketSource,
          },
        },
      ],
    },
  },
  finish: "foil",
  item: {
    condition: excellentCondition,
    finish: "etched",
    language: japaneseLanguage,
    name: "Lightning Bolt",
    priceAmount: "321.00",
    priceCurrency: jpyCurrency,
    quantity: 4,
    sourceLine: 7,
  },
};

test("maps every resolved import field into a persisted draft card input", () => {
  const result = binderImportItemsToDraftCards([resolvedImportItem]);

  assert.deepEqual(result, [
    {
      card: {
        id: "card-id",
        externalId: "external-card-id",
        name: "Lightning Bolt",
        collectorNumber: "150",
        rarity: "uncommon",
        finishes: ["nonfoil", "foil"],
        imageUrl: "https://example.com/lightning-bolt.jpg",
        releasedAt: "2025-01-24",
        setCode: "DFT",
        setName: "Draft Test",
        mtgCardDetail: {
          oracleText: "Lightning Bolt deals 3 damage to any target.",
          scryfallId: "scryfall-id",
          typeLine: "Instant",
        },
        marketPrices: [
          {
            amount: 123.45,
            buyUrl: "https://example.com/buy",
            currency: thbCurrency,
            finish: "foil",
            priceDate: "2026-08-08",
            source: cardmarketSource,
          },
        ],
      },
      options: {
        condition: excellentCondition,
        finish: "foil",
        language: japaneseLanguage,
        priceAmount: "321.00",
        priceCurrency: jpyCurrency,
        quantity: 4,
      },
    },
  ]);
  assert.notStrictEqual(result[0].card, resolvedImportItem.card);
});

test("normalizes sparse card snapshots and missing import pricing", () => {
  const result = binderImportItemsToDraftCards([
    {
      ...resolvedImportItem,
      card: {
        ...resolvedImportItem.card,
        cardSet: null,
        marketPrices: null,
        mtgCardDetail: null,
      },
      finish: "nonfoil",
      item: {
        ...resolvedImportItem.item,
        priceAmount: undefined,
        priceCurrency: undefined,
        quantity: 1,
      },
    },
  ]);

  assert.deepEqual(result[0].card, {
    ...createDraftCardSnapshot(resolvedImportItem.card),
    setCode: undefined,
    setName: undefined,
    mtgCardDetail: null,
    marketPrices: [],
  });
  assert.deepEqual(result[0].options, {
    condition: excellentCondition,
    finish: "nonfoil",
    language: japaneseLanguage,
    priceAmount: null,
    priceCurrency: undefined,
    quantity: 1,
  });
});
