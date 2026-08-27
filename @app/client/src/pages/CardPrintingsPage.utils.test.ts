import assert from "node:assert/strict";
import test from "node:test";

import {
  type AvailableCardPrinting,
  getDisplayedCardPrintings,
  type SortableCardPrinting,
  sortCardPrintings,
} from "./CardPrintingsPage.utils.ts";

const printings: SortableCardPrinting[] = [
  {
    id: "older-without-price",
    lowestPrice: null,
    releasedAt: "2020-01-01",
  },
  {
    id: "newer-expensive",
    lowestPrice: 20,
    releasedAt: "2024-01-01",
  },
  {
    id: "newer-cheap",
    lowestPrice: 5,
    releasedAt: "2023-01-01",
  },
  {
    id: "oldest-cheap",
    lowestPrice: 5,
    releasedAt: "2019-01-01",
  },
];

test("sorts printings by descending release date by default", () => {
  assert.deepEqual(
    sortCardPrintings(printings, "release_date").map(({ id }) => id),
    [
      "newer-expensive",
      "newer-cheap",
      "older-without-price",
      "oldest-cheap",
    ]
  );
});

test("filters unavailable printings before sorting when requested", () => {
  const availablePrintings: AvailableCardPrinting[] = [
    { id: "available", listingCount: 2, lowestPrice: 10, releasedAt: null },
    { id: "unavailable", listingCount: 0, lowestPrice: 5, releasedAt: null },
  ];

  assert.deepEqual(
    getDisplayedCardPrintings(
      availablePrintings,
      "price_asc",
      true
    ).map(({ id }) => id),
    ["available"]
  );
  assert.deepEqual(
    getDisplayedCardPrintings(
      availablePrintings,
      "price_asc",
      false
    ).map(({ id }) => id),
    ["unavailable", "available"]
  );
});

test("sorts printings by ascending lowest price with missing prices last", () => {
  assert.deepEqual(
    sortCardPrintings(printings, "price_asc").map(({ id }) => id),
    [
      "newer-cheap",
      "oldest-cheap",
      "newer-expensive",
      "older-without-price",
    ]
  );
});

test("sorts printings by descending lowest price with missing prices last", () => {
  assert.deepEqual(
    sortCardPrintings(printings, "price_desc").map(({ id }) => id),
    [
      "newer-expensive",
      "newer-cheap",
      "oldest-cheap",
      "older-without-price",
    ]
  );
});

test("uses release date and id as deterministic price-sort fallbacks", () => {
  const tiedPrintings: SortableCardPrinting[] = [
    { id: "b", lowestPrice: 5, releasedAt: "2024-01-01" },
    { id: "older", lowestPrice: 5, releasedAt: "2023-01-01" },
    { id: "a", lowestPrice: 5, releasedAt: "2024-01-01" },
  ];

  assert.deepEqual(
    sortCardPrintings(tiedPrintings, "price_asc").map(({ id }) => id),
    ["a", "b", "older"]
  );
});
