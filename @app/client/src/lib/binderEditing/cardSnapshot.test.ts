import assert from "node:assert/strict";
import test from "node:test";

import type { CurrencyCode, MarketPriceSource } from "@app/graphql";

import { createBinderEditingCardSnapshot } from "./cardSnapshot.ts";

test("creates the neutral card snapshot used by Binder Editing", () => {
  const snapshot = createBinderEditingCardSnapshot({
    cardSet: { code: "DFT", name: "Draft Test" },
    collectorNumber: "150",
    externalId: "external-card-id",
    finishes: ["nonfoil", null, "foil"],
    id: "card-id",
    imageUrl: "https://example.com/lightning-bolt.jpg",
    marketPrices: {
      edges: [
        {
          node: {
            amount: "123.45",
            buyUrl: "https://example.com/buy",
            currency: "THB" as CurrencyCode,
            finish: "foil",
            priceDate: "2026-08-08",
            source: "cardmarket" as MarketPriceSource,
          },
        },
      ],
    },
    mtgCardDetail: {
      oracleText: "Lightning Bolt deals 3 damage to any target.",
      scryfallId: "scryfall-id",
      typeLine: "Instant",
    },
    name: "Lightning Bolt",
    rarity: "uncommon",
    releasedAt: "2025-01-24",
  });

  assert.equal(snapshot.id, "card-id");
  assert.deepEqual(snapshot.finishes, ["nonfoil", "foil"]);
  assert.equal(snapshot.marketPrices[0]?.amount, 123.45);
  assert.equal(snapshot.setCode, "DFT");
});
