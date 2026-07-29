import assert from "node:assert/strict";
import test from "node:test";

import { createThreeShuffledStreams } from "./homeCardStreams.ts";

const isCyclicRotation = (
  items: readonly number[],
  candidate: readonly number[]
) => {
  return items.some((_, startIndex) =>
    items.every(
      (_, index) =>
        candidate[index] === items[(startIndex + index) % items.length]
    )
  );
};

test("repeats the same lane-specific shuffles for the same cards", () => {
  const cards = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  assert.deepEqual(
    createThreeShuffledStreams(cards),
    createThreeShuffledStreams(cards)
  );
});

test("creates three distinct non-rotational shuffles for seven and nine cards", () => {
  [7, 9].forEach((itemCount) => {
    const items = Array.from({ length: itemCount }, (_, index) => index);
    const streams = createThreeShuffledStreams(items);
    const serializedStreams = streams.map((stream) => stream.join(","));

    assert.equal(new Set(serializedStreams).size, 3);
    streams.forEach((stream) => {
      assert.equal(isCyclicRotation(items, stream), false);
    });
  });
});

test("returns three empty streams for an empty card list", () => {
  assert.deepEqual(createThreeShuffledStreams([]), [[], [], []]);
});

test("every non-empty stream is a full permutation of the cards", () => {
  for (let itemCount = 1; itemCount <= 12; itemCount += 1) {
    const items = Array.from({ length: itemCount }, (_, index) => index);
    const streams = createThreeShuffledStreams(items);

    streams.forEach((stream) => {
      assert.equal(stream.length, itemCount);
      assert.deepEqual(
        [...stream].sort((left, right) => left - right),
        items
      );
    });
  }
});
