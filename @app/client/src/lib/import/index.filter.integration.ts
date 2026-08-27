import assert from "node:assert/strict";
import { mock, test } from "node:test";

import type { CardCondition, LanguageCode } from "@app/graphql";

import {
  createGraphqlCardCatalog,
  createGraphqlCardLookupBatches,
} from "./graphqlCardCatalog.ts";
import type { BinderImportItem } from "./types.ts";

interface LoadCardsOptions {
  variables: {
    after?: string | null;
  };
}

const createImportItem = (name: string): BinderImportItem => ({
  condition: "near_mint" as CardCondition,
  finish: "normal",
  language: "en" as LanguageCode,
  name,
  quantity: 1,
  sourceLine: 1,
});

test("escapes LIKE metacharacters in exact card name lookups", () => {
  const [batch] = createGraphqlCardLookupBatches(
    [createImportItem("Path\\100%_Card")],
    "mtg"
  );

  assert.deepEqual(batch?.filter.or?.[0]?.name, {
    ilike: "Path\\\\100\\%\\_Card",
  });
});

test("uses an escaped case-insensitive prefix for split-card lookups", () => {
  const [batch] = createGraphqlCardLookupBatches(
    [createImportItem("Path\\100%_Card")],
    "mtg"
  );

  assert.deepEqual(batch?.filter.or?.[1]?.name, {
    ilike: "Path\\\\100\\%\\_Card // %",
  });
});

test("keeps GraphQL pagination and lookup progress inside the catalog adapter", async () => {
  const card = {
    cardSet: null,
    collectorNumber: "123",
    externalId: "external-id",
    finishes: ["normal"],
    id: "card-id",
    imageUrl: null,
    marketPrices: null,
    mtgCardDetail: null,
    name: "Lightning Bolt",
    rarity: "uncommon",
    releasedAt: null,
  };
  const loadCards = mock.fn(async ({ variables }: LoadCardsOptions) => ({
    data: {
      cardsCollection: variables.after
        ? {
            edges: [{ node: card }],
            pageInfo: { endCursor: null, hasNextPage: false },
          }
        : {
            edges: [{ node: card }],
            pageInfo: { endCursor: "next-page", hasNextPage: true },
          },
    },
  }));
  const catalog = createGraphqlCardCatalog({ loadCards });
  const progress: Array<{ completed: number; total: number }> = [];
  const cards = await catalog.findCards({
    items: [createImportItem("Lightning Bolt")],
    onProgress: (nextProgress) => progress.push(nextProgress),
    tcgId: "mtg",
  });

  assert.equal(loadCards.mock.callCount(), 2);
  assert.equal(loadCards.mock.calls[1]?.arguments[0].variables.after, "next-page");
  assert.deepEqual(cards, [card]);
  assert.deepEqual(progress, [{ completed: 1, total: 1 }]);
});
