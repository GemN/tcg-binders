import assert from "node:assert/strict";
import test from "node:test";

import { getPriceComparison } from "./priceComparison.ts";

test("reports a listing below market with a localized absolute percentage", () => {
  assert.deepEqual(getPriceComparison(74.6, 100, "en"), {
    direction: "below",
    label: "25%",
  });
});

test("reports a listing above market with a localized absolute percentage", () => {
  assert.deepEqual(getPriceComparison(125, 100, "en"), {
    direction: "above",
    label: "25%",
  });
});

test("reports an equal listing and market price as even", () => {
  assert.deepEqual(getPriceComparison(100, 100, "en"), {
    direction: "even",
    label: "0%",
  });
});

test("does not compare missing prices", () => {
  assert.equal(getPriceComparison(null, 100, "en"), null);
  assert.equal(getPriceComparison(100, null, "en"), null);
  assert.equal(getPriceComparison(undefined, 100, "en"), null);
  assert.equal(getPriceComparison(100, undefined, "en"), null);
});

test("does not compare against a nonpositive market price", () => {
  assert.equal(getPriceComparison(100, 0, "en"), null);
  assert.equal(getPriceComparison(100, -1, "en"), null);
});

test("does not compare non-finite prices", () => {
  assert.equal(getPriceComparison(Number.NaN, 100, "en"), null);
  assert.equal(getPriceComparison(Number.POSITIVE_INFINITY, 100, "en"), null);
  assert.equal(getPriceComparison(100, Number.NaN, "en"), null);
  assert.equal(getPriceComparison(100, Number.NEGATIVE_INFINITY, "en"), null);
});
