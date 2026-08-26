import assert from "node:assert/strict";
import test from "node:test";

import { createBinderImporter } from "./binderImporter.ts";
import {
  createInMemoryCardCatalog,
  createInMemoryImportDestination,
} from "./testing.ts";
import type { BinderImportCardRecord, BinderImportProgress } from "./types.ts";

const lightningBolt: BinderImportCardRecord = {
  cardSet: { code: "TST", name: "Test Set" },
  collectorNumber: "123",
  externalId: "lightning-bolt-id",
  finishes: ["normal", "foil"],
  id: "card-id",
  name: "Lightning Bolt",
};

test("prepares and commits a case-insensitive import through the deep interface", async () => {
  const destination = createInMemoryImportDestination();
  const importer = createBinderImporter({
    cardCatalog: createInMemoryCardCatalog([lightningBolt]),
    destination,
  });
  const matchingProgress: BinderImportProgress[] = [];
  const preparation = await importer.prepare({
    format: "text",
    onProgress: (progress) => matchingProgress.push(progress),
    tcgId: "mtg",
    text: "2 lightning bolt (tst) 123 *F*",
  });

  assert.equal(preparation.matchedItems.length, 1);
  assert.equal(preparation.matchedItems[0]?.card.id, "card-id");
  assert.equal(preparation.matchedItems[0]?.finish, "foil");
  assert.deepEqual(preparation.unmatchedItems, []);
  assert.deepEqual(matchingProgress, [
    { completed: 0, total: 1 },
    { completed: 1, total: 1 },
  ]);

  const insertionProgress: BinderImportProgress[] = [];
  const result = await importer.commit(
    preparation.matchedItems,
    (progress) => insertionProgress.push(progress)
  );

  assert.deepEqual(result, {
    failedInsertCount: 0,
    importedCount: 1,
  });
  assert.equal(destination.importedItems.length, 1);
  assert.deepEqual(insertionProgress, [{ completed: 1, total: 1 }]);
});

test("returns matched, unmatched, and rejected source rows for partial review", async () => {
  const importer = createBinderImporter({
    cardCatalog: createInMemoryCardCatalog([lightningBolt]),
    destination: createInMemoryImportDestination(),
  });
  const preparation = await importer.prepare({
    format: "text",
    onProgress: () => undefined,
    tcgId: "mtg",
    text: [
      "1 Lightning Bolt (TST) 123",
      "unsupported",
      "1 Missing Card (TST) 999",
    ].join("\n"),
  });

  assert.equal(preparation.matchedItems.length, 1);
  assert.deepEqual(
    preparation.unmatchedItems.map((item) => item.name),
    ["Missing Card"]
  );
  assert.deepEqual(
    preparation.rejectedLines.map((line) => line.line),
    [2]
  );
});

test("returns an unmatched result without writing to the destination", async () => {
  const destination = createInMemoryImportDestination();
  const importer = createBinderImporter({
    cardCatalog: createInMemoryCardCatalog([]),
    destination,
  });
  const preparation = await importer.prepare({
    format: "text",
    onProgress: () => undefined,
    tcgId: "mtg",
    text: "1 Missing Card (TST) 999",
  });

  assert.deepEqual(preparation.matchedItems, []);
  assert.equal(preparation.unmatchedItems.length, 1);
  assert.deepEqual(destination.importedItems, []);
});
