import assert from "node:assert/strict";
import { mock, test } from "node:test";

import { createSavedBinderImportDestination } from "./destinations.ts";
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
    condition: "near_mint",
    finish: "normal",
    language: "en",
    name: id,
    quantity: 1,
    sourceLine: 1,
  },
});

test("retries a failed saved-binder chunk per card and reports progress", async () => {
  const firstItem = createResolvedItem("first");
  const secondItem = createResolvedItem("second");
  const addBinderCards = mock.fn(async ({ variables }) => {
    const ids = variables.objects.map(
      (object: { cardId: string }) => object.cardId
    );

    if (ids.length > 1 || ids[0] === "second") {
      throw new Error("insert failed");
    }
  });
  const consoleError = mock.method(console, "error", () => undefined);
  const destination = createSavedBinderImportDestination({
    addBinderCards,
    binderId: "binder-id",
    tcgId: "mtg",
  });
  const progress: BinderImportProgress[] = [];

  try {
    const result = await destination.importCards({
      items: [firstItem, secondItem],
      onProgress: (nextProgress) => progress.push(nextProgress),
    });

    assert.equal(addBinderCards.mock.callCount(), 3);
    assert.deepEqual(result, {
      failedInsertCount: 1,
      failedItems: [secondItem],
      importedCount: 1,
    });
    assert.deepEqual(progress, [
      { completed: 1, total: 2 },
      { completed: 2, total: 2 },
    ]);
  } finally {
    consoleError.mock.restore();
  }
});
