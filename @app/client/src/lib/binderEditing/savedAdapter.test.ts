import assert from "node:assert/strict";
import { mock, test } from "node:test";

import type { CardCondition, CurrencyCode, LanguageCode } from "@app/graphql";

import {
  createSavedBinderEditingAdapter,
  type SavedBinderEditingWrites,
} from "./savedAdapter.ts";

const createWrites = (): SavedBinderEditingWrites => ({
  addCards: mock.fn(async (objects) => objects.length),
  removeCard: mock.fn(async () => 1),
  renameBinder: mock.fn(async () => 1),
  updateBinderNote: mock.fn(async () => 1),
  updateCard: mock.fn(async () => ({ affectedCount: 1 })),
});

test("maps Binder Editing intentions at the saved GraphQL adapter", async () => {
  const addCards = mock.fn<SavedBinderEditingWrites["addCards"]>(
    async (objects) => objects.length
  );
  const updateCard = mock.fn<SavedBinderEditingWrites["updateCard"]>(
    async () => ({ affectedCount: 1 })
  );
  const refresh = mock.fn(async () => undefined);
  const editing = createSavedBinderEditingAdapter({
    binderId: "binder-id",
    refresh,
    tcgId: "mtg",
    writes: { ...createWrites(), addCards, updateCard },
  });

  await editing.addCard({
    card: {
      externalId: "external-id",
      finishes: ["foil"],
      id: "card-id",
      marketPrices: [],
      name: "Card",
    },
    condition: "excellent" as CardCondition,
    language: "ja" as LanguageCode,
    quantity: 2,
  });
  await editing.updateCard("binder-card-id", {
    cardId: "variant-id",
    finish: "foil",
    priceAmount: "42.00",
    priceCurrency: "THB" as CurrencyCode,
  });

  assert.deepEqual(addCards.mock.calls[0].arguments[0], [
    {
      binderId: "binder-id",
      cardId: "card-id",
      condition: "excellent",
      dynamicPriceRule: undefined,
      finish: "foil",
      language: "ja",
      note: "",
      position: 0,
      priceAmount: undefined,
      priceCurrency: undefined,
      quantity: 2,
      tcgId: "mtg",
    },
  ]);
  assert.deepEqual(updateCard.mock.calls[0].arguments, [
    "binder-card-id",
    {
      cardId: "variant-id",
      finish: "foil",
      priceAmount: "42.00",
      priceCurrency: "THB",
    },
  ]);
  assert.equal(refresh.mock.callCount(), 2);
});
