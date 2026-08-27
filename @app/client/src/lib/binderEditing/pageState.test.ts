import assert from "node:assert/strict";
import test from "node:test";

import {
  addLocallyDeletedBinderCardIds,
  type BinderCardCountAdjustment,
  createBinderCardCountAdjustment,
  excludeLocallyDeletedBinderCards,
  getAppliedBinderCardIds,
  getBinderEditingPageAccess,
  getLocallyAdjustedBinderCardCount,
  reconcileBinderCardCountAdjustment,
} from "./pageState.ts";

test("locks owner editing after coherence without enabling commerce", () => {
  assert.deepEqual(
    getBinderEditingPageAccess({
      isOwner: true,
      isPublicPreview: false,
      requiresReload: false,
    }),
    {
      canMutateBinder: true,
      canShowOwnerMetadata: true,
      canUseCommerce: false,
    }
  );
  assert.deepEqual(
    getBinderEditingPageAccess({
      isOwner: true,
      isPublicPreview: false,
      requiresReload: true,
    }),
    {
      canMutateBinder: false,
      canShowOwnerMetadata: true,
      canUseCommerce: false,
    }
  );
  assert.deepEqual(
    getBinderEditingPageAccess({
      isOwner: false,
      isPublicPreview: false,
      requiresReload: false,
    }),
    {
      canMutateBinder: false,
      canShowOwnerMetadata: false,
      canUseCommerce: true,
    }
  );
  assert.deepEqual(
    getBinderEditingPageAccess({
      isOwner: true,
      isPublicPreview: true,
      requiresReload: false,
    }),
    {
      canMutateBinder: false,
      canShowOwnerMetadata: false,
      canUseCommerce: true,
    }
  );
});

test("hides a coherently deleted single card and adjusts its stale count", () => {
  const appliedIds = getAppliedBinderCardIds(["deleted"], {
    failedIndexes: [],
  });
  const locallyDeletedIds = addLocallyDeletedBinderCardIds(
    new Set<string>(),
    appliedIds
  );

  assert.deepEqual(
    excludeLocallyDeletedBinderCards(
      [{ id: "deleted" }, { id: "kept" }],
      locallyDeletedIds
    ),
    [{ id: "kept" }]
  );
  const countAdjustment = createBinderCardCountAdjustment({
    appliedBinderCardIds: appliedIds,
    filterKey: "all-cards",
    sourceCount: 2,
  });
  assert.equal(
    getLocallyAdjustedBinderCardCount(2, countAdjustment, "all-cards"),
    1
  );
});

test("uses partial bulk outcome indexes to hide only applied deletes", () => {
  const appliedIds = getAppliedBinderCardIds(["first", "failed", "third"], {
    failedIndexes: [1],
  });
  const locallyDeletedIds = addLocallyDeletedBinderCardIds(
    new Set<string>(),
    appliedIds
  );

  assert.deepEqual(appliedIds, ["first", "third"]);
  assert.deepEqual(
    excludeLocallyDeletedBinderCards(
      [{ id: "first" }, { id: "failed" }, { id: "third" }],
      locallyDeletedIds
    ),
    [{ id: "failed" }]
  );
  const countAdjustment = createBinderCardCountAdjustment({
    appliedBinderCardIds: appliedIds,
    filterKey: "all-cards",
    sourceCount: 3,
  });
  assert.equal(
    getLocallyAdjustedBinderCardCount(3, countAdjustment, "all-cards"),
    1
  );
});

test("does not subtract tombstones outside the current filter snapshot", () => {
  const countAdjustment = createBinderCardCountAdjustment({
    appliedBinderCardIds: ["deleted-in-filter-a"],
    filterKey: "filter-a",
    sourceCount: 7,
  });

  assert.equal(
    getLocallyAdjustedBinderCardCount(7, countAdjustment, "filter-b"),
    7
  );
});

test("does not double-decrement once fresh source data omits a deletion", () => {
  let countAdjustment: BinderCardCountAdjustment | null =
    createBinderCardCountAdjustment({
      appliedBinderCardIds: ["deleted-one", "deleted-two"],
      filterKey: "all-cards",
      sourceCount: 12,
    });

  assert.equal(
    getLocallyAdjustedBinderCardCount(12, countAdjustment, "all-cards"),
    10
  );
  countAdjustment = reconcileBinderCardCountAdjustment(
    12,
    countAdjustment,
    "all-cards"
  );
  assert.ok(countAdjustment);

  assert.equal(
    getLocallyAdjustedBinderCardCount(10, countAdjustment, "all-cards"),
    10
  );
  countAdjustment = reconcileBinderCardCountAdjustment(
    10,
    countAdjustment,
    "all-cards"
  );
  assert.equal(countAdjustment, null);

  assert.equal(
    getLocallyAdjustedBinderCardCount(11, countAdjustment, "all-cards"),
    11
  );
});

test("keeps every applied bulk deletion in the count across loaded pages", () => {
  const appliedIds = getAppliedBinderCardIds(
    ["page-one", "failed-on-page-two", "page-three"],
    { failedIndexes: [1] }
  );
  const locallyDeletedIds = addLocallyDeletedBinderCardIds(
    new Set<string>(),
    appliedIds
  );
  const countAdjustment = createBinderCardCountAdjustment({
    appliedBinderCardIds: appliedIds,
    filterKey: "all-cards",
    sourceCount: 12,
  });

  assert.deepEqual(
    excludeLocallyDeletedBinderCards(
      [{ id: "failed-on-page-two" }, { id: "page-two-b" }],
      locallyDeletedIds
    ),
    [{ id: "failed-on-page-two" }, { id: "page-two-b" }]
  );
  assert.equal(
    getLocallyAdjustedBinderCardCount(12, countAdjustment, "all-cards"),
    10
  );
});
