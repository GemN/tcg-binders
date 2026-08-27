import assert from "node:assert/strict";
import { mock, test } from "node:test";

import {
  type BinderEditingBackend,
  createBinderEditing,
} from "./core.ts";
import {
  BinderEditingCoherenceError,
  BinderEditingError,
} from "./types.ts";

const createCard = (id: string) => ({
  card: {
    externalId: `${id}-external`,
    finishes: ["normal"],
    id,
    marketPrices: [],
    name: id,
  },
});

const createBackend = (): BinderEditingBackend => ({
  addCards: mock.fn(async () => undefined),
  cohere: mock.fn(async () => undefined),
  removeCard: mock.fn(async () => true),
  renameBinder: mock.fn(async () => true),
  updateBinderNote: mock.fn(async () => true),
  updateCard: mock.fn(async () => ({ applied: true })),
});

test("normalizes metadata and waits for coherence after the write", async () => {
  const events: string[] = [];
  const backend = createBackend();
  backend.renameBinder = async (name) => {
    events.push(`rename:${name}`);
    return true;
  };
  backend.updateBinderNote = async (note) => {
    events.push(`note:${note}`);
    return true;
  };
  backend.cohere = async () => {
    events.push("cohere");
  };
  const editing = createBinderEditing({ backend });

  await editing.renameBinder("  Trade Binder  ");
  await editing.updateBinderNote("  Meet at the shop  ");

  assert.deepEqual(events, [
    "rename:Trade Binder",
    "cohere",
    "note:Meet at the shop",
    "cohere",
  ]);
});

test("rejects language-neutral invalid input before writing", async () => {
  const addCards = mock.fn(async () => undefined);
  const renameBinder = mock.fn(async () => true);
  const updateCard = mock.fn(async () => ({ applied: true }));
  const backend = {
    ...createBackend(),
    addCards,
    renameBinder,
    updateCard,
  };
  const editing = createBinderEditing({ backend });

  await assert.rejects(
    editing.renameBinder("   "),
    (error) =>
      error instanceof BinderEditingError && error.reason === "name_required"
  );
  await assert.rejects(
    editing.addCard({ ...createCard("invalid"), quantity: 0 }),
    (error) =>
      error instanceof BinderEditingError &&
      error.reason === "invalid_quantity"
  );
  await assert.rejects(
    editing.updateCard("card-id", { quantity: 0 }),
    (error) =>
      error instanceof BinderEditingError &&
      error.reason === "invalid_quantity"
  );

  assert.equal(addCards.mock.callCount(), 0);
  assert.equal(renameBinder.mock.callCount(), 0);
  assert.equal(updateCard.mock.callCount(), 0);
});

test("classifies adapter failures without leaking transport errors", async () => {
  const backend = createBackend();
  backend.renameBinder = async () => {
    throw new Error("network unavailable");
  };
  const editing = createBinderEditing({ backend });

  await assert.rejects(
    editing.renameBinder("Binder"),
    (error) =>
      error instanceof BinderEditingError && error.reason === "write_failed"
  );
});

test("retries failed add chunks per card and coheres once", async () => {
  const cohere = mock.fn(async () => undefined);
  const backend = { ...createBackend(), cohere };
  const addCalls: string[][] = [];
  backend.addCards = async (cards) => {
    const ids = cards.map((card) => card.card.id);
    addCalls.push(ids);
    if (ids.length > 1 || ids[0] === "second") throw new Error("failed");
  };
  const progress: Array<{ completed: number; total: number }> = [];
  const editing = createBinderEditing({ backend });

  const outcome = await editing.addCards({
    cards: [createCard("first"), createCard("second")],
    onProgress: (nextProgress) => progress.push(nextProgress),
  });

  assert.deepEqual(addCalls, [["first", "second"], ["first"], ["second"]]);
  assert.deepEqual(outcome, {
    applied: 1,
    failed: 1,
    failedIndexes: [1],
    skipped: 0,
  });
  assert.deepEqual(progress, [
    { completed: 1, total: 2 },
    { completed: 2, total: 2 },
  ]);
  assert.equal(cohere.mock.callCount(), 1);
});

test("classifies a single add refresh failure after preserving its outcome", async () => {
  const addCards = mock.fn(async () => undefined);
  const backend = { ...createBackend(), addCards };
  backend.cohere = async () => {
    throw new Error("refresh failed");
  };
  const editing = createBinderEditing({ backend });

  await assert.rejects(editing.addCard(createCard("added")), (error) => {
    assert.ok(error instanceof BinderEditingCoherenceError);
    assert.deepEqual(error.outcome, {
      applied: 1,
      failed: 0,
      failedIndexes: [],
      skipped: 0,
    });
    return true;
  });
  assert.equal(addCards.mock.callCount(), 1);
});

test("continues valid adds on both sides of an invalid input", async () => {
  const addedCardIds: string[] = [];
  const backend = createBackend();
  backend.addCards = async (cards) => {
    addedCardIds.push(...cards.map((card) => card.card.id));
  };
  const progress: Array<{ completed: number; total: number }> = [];
  const editing = createBinderEditing({ backend });

  const outcome = await editing.addCards({
    cards: [
      createCard("before"),
      { ...createCard("invalid"), quantity: 0 },
      createCard("after"),
    ],
    onProgress: (nextProgress) => progress.push(nextProgress),
  });

  assert.deepEqual(addedCardIds, ["before", "after"]);
  assert.deepEqual(outcome, {
    applied: 2,
    failed: 1,
    failedIndexes: [1],
    skipped: 0,
  });
  assert.deepEqual(progress, [
    { completed: 1, total: 3 },
    { completed: 3, total: 3 },
  ]);
});

test("reports partial bulk deletes and bulk pricing skips", async () => {
  const backend = createBackend();
  backend.removeCard = async (id) => id !== "missing";
  backend.updateCard = async (id) => ({ applied: id !== "failed" });
  const editing = createBinderEditing({ backend });

  const deleteOutcome = await editing.removeCards(["kept", "missing"]);
  const priceOutcome = await editing.applyCardKingdomMultiplier({
    cards: [
      { binderCardId: "priced", sourcePriceAmount: 2 },
      { binderCardId: "skipped", sourcePriceAmount: null },
      { binderCardId: "failed", sourcePriceAmount: 3 },
    ],
    multiplier: 25,
  });

  assert.deepEqual(deleteOutcome, {
    applied: 1,
    failed: 1,
    failedIndexes: [1],
    skipped: 0,
  });
  assert.deepEqual(priceOutcome, {
    applied: 1,
    failed: 1,
    failedIndexes: [2],
    skipped: 1,
  });
});

test("rejects invalid CK source prices per card and continues valid updates", async () => {
  const updatedCardIds: string[] = [];
  const backend = createBackend();
  backend.updateCard = async (id) => {
    updatedCardIds.push(id);
    return { applied: true };
  };
  const editing = createBinderEditing({ backend });

  const outcome = await editing.applyCardKingdomMultiplier({
    cards: [
      { binderCardId: "before", sourcePriceAmount: 2 },
      { binderCardId: "nan", sourcePriceAmount: Number.NaN },
      { binderCardId: "infinity", sourcePriceAmount: Number.POSITIVE_INFINITY },
      { binderCardId: "negative", sourcePriceAmount: -1 },
      { binderCardId: "overflow", sourcePriceAmount: Number.MAX_VALUE },
      { binderCardId: "after", sourcePriceAmount: 3 },
    ],
    multiplier: 25,
  });

  assert.deepEqual(updatedCardIds, ["before", "after"]);
  assert.deepEqual(outcome, {
    applied: 2,
    failed: 4,
    failedIndexes: [1, 2, 3, 4],
    skipped: 0,
  });
});

test("preserves a truthful bulk outcome when coherence fails", async () => {
  const backend = createBackend();
  backend.cohere = async () => {
    throw new Error("refresh failed");
  };
  const editing = createBinderEditing({ backend });

  await assert.rejects(editing.removeCards(["first", "second"]), (error) => {
    assert.ok(error instanceof BinderEditingCoherenceError);
    assert.deepEqual(error.outcome, {
      applied: 2,
      failed: 0,
      failedIndexes: [],
      skipped: 0,
    });
    return true;
  });
});

test("preserves bulk price counts when its refresh fails", async () => {
  const backend = createBackend();
  backend.updateCard = async (id) => ({ applied: id !== "failed" });
  backend.cohere = async () => {
    throw new Error("refresh failed");
  };
  const editing = createBinderEditing({ backend });

  await assert.rejects(
    editing.applyCardKingdomMultiplier({
      cards: [
        { binderCardId: "updated", sourcePriceAmount: 2 },
        { binderCardId: "failed", sourcePriceAmount: 3 },
        { binderCardId: "skipped", sourcePriceAmount: null },
      ],
      multiplier: 25,
    }),
    (error) => {
      assert.ok(error instanceof BinderEditingCoherenceError);
      assert.deepEqual(error.outcome, {
        applied: 1,
        failed: 1,
        failedIndexes: [1],
        skipped: 1,
      });
      return true;
    }
  );
});
