import assert from "node:assert/strict";
import test from "node:test";

import { parseOracleText } from "./parseOracleText.ts";

test("keeps ordinary oracle text in a normal segment", () => {
  assert.deepEqual(parseOracleText("Flying"), [
    { isItalic: false, text: "Flying" },
  ]);
});

test("marks a complete parenthesized segment as italic", () => {
  assert.deepEqual(parseOracleText("Flying (This creature can fly.)"), [
    { isItalic: false, text: "Flying " },
    { isItalic: true, text: "(This creature can fly.)" },
  ]);
});

test("preserves multiple parenthesized segments and line breaks", () => {
  assert.deepEqual(
    parseOracleText("Flying (First reminder.)\nHaste (Second\nreminder.)"),
    [
      { isItalic: false, text: "Flying " },
      { isItalic: true, text: "(First reminder.)" },
      { isItalic: false, text: "\nHaste " },
      { isItalic: true, text: "(Second\nreminder.)" },
    ]
  );
});

test("keeps unmatched parentheses as normal text", () => {
  assert.deepEqual(parseOracleText("Flying (Unfinished reminder"), [
    { isItalic: false, text: "Flying (Unfinished reminder" },
  ]);
  assert.deepEqual(parseOracleText("Flying)"), [
    { isItalic: false, text: "Flying)" },
  ]);
});
