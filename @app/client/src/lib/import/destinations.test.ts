import assert from "node:assert/strict";
import { mock, test } from "node:test";

import type { CardCondition, LanguageCode } from "@app/graphql";

import {
  type BinderEditing,
  BinderEditingCoherenceError,
} from "../binderEditing/types.ts";
import { createBinderEditingImportDestination } from "./destinations.ts";
import type {
  BinderImportProgress,
  BinderImportResolvedItem,
} from "./types.ts";

const createResolvedItem = (id: string): BinderImportResolvedItem => ({
  card: {
    externalId: `${id}-external`,
    finishes: ["normal"],
    id,
    name: id,
  },
  finish: "normal",
  item: {
    condition: "near_mint" as CardCondition,
    finish: "normal",
    language: "en" as LanguageCode,
    name: id,
    quantity: 1,
    sourceLine: 1,
  },
});

test("delegates resolved imports to Binder Editing and maps partial outcomes", async () => {
  const firstItem = createResolvedItem("first");
  const secondItem = createResolvedItem("second");
  const addCards = mock.fn<BinderEditing["addCards"]>(async (request) => {
    request.onProgress?.({ completed: 2, total: 2 });
    return {
      applied: 1,
      failed: 1,
      failedIndexes: [1],
      skipped: 0,
    };
  });
  const binderEditing = { addCards } as unknown as BinderEditing;
  const destination = createBinderEditingImportDestination({ binderEditing });
  const progress: BinderImportProgress[] = [];

  const result = await destination.importCards({
    items: [firstItem, secondItem],
    onProgress: (nextProgress) => progress.push(nextProgress),
  });

  assert.equal(addCards.mock.callCount(), 1);
  assert.deepEqual(addCards.mock.calls[0].arguments[0].cards[0], {
    card: {
      collectorNumber: undefined,
      externalId: "first-external",
      finishes: ["normal"],
      id: "first",
      imageUrl: undefined,
      marketPrices: [],
      mtgCardDetail: null,
      name: "first",
      rarity: undefined,
      releasedAt: undefined,
      setCode: undefined,
      setName: undefined,
    },
    condition: "near_mint",
    finish: "normal",
    language: "en",
    priceAmount: undefined,
    priceCurrency: undefined,
    quantity: 1,
  });
  assert.deepEqual(result, {
    failedInsertCount: 1,
    failedItems: [secondItem],
    importedCount: 1,
  });
  assert.deepEqual(progress, [{ completed: 2, total: 2 }]);
});

test("returns the truthful import outcome when coherence fails", async () => {
  const firstItem = createResolvedItem("first");
  const secondItem = createResolvedItem("second");
  const outcome = {
    applied: 1,
    failed: 1,
    failedIndexes: [1],
    skipped: 0,
  };
  const addCards = mock.fn<BinderEditing["addCards"]>(async (request) => {
    request.onProgress?.({ completed: 2, total: 2 });
    throw new BinderEditingCoherenceError(new Error("refresh failed"), outcome);
  });
  const destination = createBinderEditingImportDestination({
    binderEditing: { addCards } as unknown as BinderEditing,
  });
  const progress: BinderImportProgress[] = [];

  const result = await destination.importCards({
    items: [firstItem, secondItem],
    onProgress: (nextProgress) => progress.push(nextProgress),
  });

  assert.deepEqual(result, {
    coherenceFailed: true,
    failedInsertCount: 1,
    failedItems: [secondItem],
    importedCount: 1,
  });
  assert.deepEqual(progress, [{ completed: 2, total: 2 }]);
});
