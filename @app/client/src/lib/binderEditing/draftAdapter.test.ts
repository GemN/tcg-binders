import assert from "node:assert/strict";
import test from "node:test";

import type { CardCondition, CurrencyCode, LanguageCode } from "@app/graphql";

import type { DraftBinder } from "../draftBinderTypes.ts";
import { createDraftBinderEditingAdapter } from "./draftAdapter.ts";

test("persists the complete add intention through the Draft adapter", async () => {
  let draft: DraftBinder = {
    cards: [],
    name: "",
    note: "",
    tcgId: "mtg",
  };
  const editing = createDraftBinderEditingAdapter({
    store: {
      read: () => draft,
      write: (updater) => {
        draft = updater(draft);
        return draft;
      },
    },
  });
  const firstCard = {
    externalId: "first-external",
    finishes: ["normal"],
    id: "first",
    marketPrices: [],
    name: "First",
  };
  const positionedCard = {
    externalId: "positioned-external",
    finishes: ["foil"],
    id: "positioned",
    marketPrices: [],
    name: "Positioned",
  };

  await editing.addCard({ card: firstCard });
  await editing.addCard({
    card: positionedCard,
    condition: "excellent" as CardCondition,
    dynamicPriceRule: "CKD X",
    language: "ja" as LanguageCode,
    note: "  showcase  ",
    position: 0,
    priceAmount: "42.00",
    priceCurrency: "THB" as CurrencyCode,
    quantity: 3,
  });

  assert.deepEqual(
    draft.cards.map(({ cardId, position }) => ({ cardId, position })),
    [
      { cardId: "positioned", position: 0 },
      { cardId: "first", position: 1 },
    ]
  );
  assert.deepEqual(
    {
      condition: draft.cards[0]?.condition,
      dynamicPriceRule: draft.cards[0]?.dynamicPriceRule,
      finish: draft.cards[0]?.finish,
      language: draft.cards[0]?.language,
      note: draft.cards[0]?.note,
      priceAmount: draft.cards[0]?.priceAmount,
      priceCurrency: draft.cards[0]?.priceCurrency,
      quantity: draft.cards[0]?.quantity,
    },
    {
      condition: "excellent",
      dynamicPriceRule: "CKD X",
      finish: "foil",
      language: "ja",
      note: "showcase",
      priceAmount: "42.00",
      priceCurrency: "THB",
      quantity: 3,
    }
  );
});

test("keeps append and remove reindexing semantics in the Draft adapter", async () => {
  let draft: DraftBinder = {
    cards: [],
    name: "",
    note: "",
    tcgId: "mtg",
  };
  const editing = createDraftBinderEditingAdapter({
    store: {
      read: () => draft,
      write: (updater) => {
        draft = updater(draft);
        return draft;
      },
    },
  });
  const createCard = (id: string) => ({
    externalId: `${id}-external`,
    finishes: ["normal"],
    id,
    marketPrices: [],
    name: id,
  });

  await editing.addCards({
    cards: [{ card: createCard("first") }, { card: createCard("second") }],
  });
  const firstDraftId = draft.cards[0]?.draftId || "";
  await editing.removeCard(firstDraftId);

  assert.deepEqual(
    draft.cards.map(({ cardId, position }) => ({ cardId, position })),
    [{ cardId: "second", position: 0 }]
  );
});

test("stores identical and differing duplicate card intentions as distinct rows", async () => {
  let draft: DraftBinder = {
    cards: [],
    name: "",
    note: "",
    tcgId: "mtg",
  };
  const editing = createDraftBinderEditingAdapter({
    store: {
      read: () => draft,
      write: (updater) => {
        draft = updater(draft);
        return draft;
      },
    },
  });
  const card = {
    externalId: "duplicate-external",
    finishes: ["normal"],
    id: "duplicate",
    marketPrices: [],
    name: "Duplicate",
  };
  const firstIntention = {
    card,
    condition: "near_mint" as CardCondition,
    finish: "normal",
    language: "en" as LanguageCode,
    note: "English copy",
    quantity: 1,
  };

  await editing.addCards({
    cards: [
      firstIntention,
      {
        card,
        condition: "excellent" as CardCondition,
        finish: "normal",
        language: "ja" as LanguageCode,
        note: "Japanese copy",
        quantity: 2,
      },
      firstIntention,
    ],
  });

  assert.deepEqual(
    draft.cards.map((draftCard) => ({
      condition: draftCard.condition,
      language: draftCard.language,
      note: draftCard.note,
      position: draftCard.position,
      quantity: draftCard.quantity,
    })),
    [
      {
        condition: "near_mint",
        language: "en",
        note: "English copy",
        position: 0,
        quantity: 1,
      },
      {
        condition: "excellent",
        language: "ja",
        note: "Japanese copy",
        position: 1,
        quantity: 2,
      },
      {
        condition: "near_mint",
        language: "en",
        note: "English copy",
        position: 2,
        quantity: 1,
      },
    ]
  );
});

test("never persists non-finite or negative CK prices in a Draft binder", async () => {
  let draft: DraftBinder = {
    cards: [],
    name: "",
    note: "",
    tcgId: "mtg",
  };
  const editing = createDraftBinderEditingAdapter({
    store: {
      read: () => draft,
      write: (updater) => {
        draft = updater(draft);
        return draft;
      },
    },
  });
  const createCard = (id: string) => ({
    externalId: `${id}-external`,
    finishes: ["normal"],
    id,
    marketPrices: [],
    name: id,
  });
  const cardIds = ["before", "nan", "infinity", "negative", "after"];
  const sourcePriceAmounts = [2, Number.NaN, Number.POSITIVE_INFINITY, -1, 3];

  await editing.addCards({
    cards: cardIds.map((id) => ({ card: createCard(id) })),
  });
  const outcome = await editing.applyCardKingdomMultiplier({
    cards: draft.cards.map((draftCard, index) => ({
      binderCardId: draftCard.draftId,
      sourcePriceAmount: sourcePriceAmounts[index] ?? null,
    })),
    multiplier: 25,
  });

  assert.deepEqual(outcome, {
    applied: 2,
    failed: 3,
    failedIndexes: [1, 2, 3],
    skipped: 0,
  });
  assert.deepEqual(
    draft.cards.map((draftCard) => draftCard.priceAmount),
    ["50.00", null, null, null, "75.00"]
  );
});
