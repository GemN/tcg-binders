import assert from "node:assert/strict";
import test from "node:test";

import { getRarityColor } from "./getRarityColor.ts";

test("maps standard rarities to their icon colors", () => {
  assert.equal(getRarityColor("common"), "#1E1E1E");
  assert.equal(getRarityColor("uncommon"), "#8B8F97");
  assert.equal(getRarityColor("rare"), "#C49A32");
  assert.equal(getRarityColor("mythic"), "#D25A2C");
});

test("normalizes rarity case", () => {
  assert.equal(getRarityColor("MyThIc"), "#D25A2C");
});

test("falls back to the common color for unknown rarities", () => {
  assert.equal(getRarityColor("special"), "#1E1E1E");
});
