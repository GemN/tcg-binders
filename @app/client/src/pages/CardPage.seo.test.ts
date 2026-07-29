import assert from "node:assert/strict";
import test from "node:test";

import {
  type CardSeoMetadataInput,
  createCardSeoMetadata,
} from "./CardPage.seo.ts";

const baseInput: CardSeoMetadataInput = {
  canonicalPath: "/card/card-id",
  content: {
    description:
      "View Black Lotus card details, market prices, variants, and seller listings.",
    notFoundTitle: "Page Not Found",
    shortTitle: "Black Lotus - MTG Prices",
    title: "Black Lotus LEA #232 - MTG Prices",
  },
  isResolved: true,
  product: {
    id: "card-id",
    imageUrl: "/black-lotus.jpg",
    name: "Black Lotus",
  },
};

test("omits robots for loading and transport-error card states", () => {
  const loading = createCardSeoMetadata({
    ...baseInput,
    isResolved: false,
    product: undefined,
  });
  const transportError = createCardSeoMetadata({
    ...baseInput,
    isResolved: false,
    product: undefined,
  });

  assert.equal(loading.robots, undefined);
  assert.equal(transportError.robots, undefined);
  assert.equal(loading.canonicalPath, baseInput.canonicalPath);
  assert.equal(transportError.canonicalPath, baseInput.canonicalPath);
});

test("indexes a resolved card and emits sparse-card metadata", () => {
  const sparseCard = createCardSeoMetadata(baseInput);

  assert.equal(sparseCard.robots, "index,follow");
  assert.equal(sparseCard.description, baseInput.content.description);
  assert.equal(sparseCard.imagePath, "/black-lotus.jpg");
  assert.equal(sparseCard.shortTitle, "Black Lotus - MTG Prices");
  assert.ok(sparseCard.jsonLd);
  const jsonLd = sparseCard.jsonLd?.({
    canonicalUrl: "https://megabinder.example/card/card-id",
    locale: "en",
    origin: "https://megabinder.example",
    title: "Black Lotus LEA #232 - MTG Prices | MegaBinder",
  });
  assert.equal(jsonLd?.["@context"], "https://schema.org");
});

test("marks a confirmed missing card as a noindex not-found page", () => {
  const missing = createCardSeoMetadata({
    ...baseInput,
    product: undefined,
  });

  assert.equal(missing.robots, "noindex,follow");
  assert.equal(missing.title, "Page Not Found");
  assert.equal(missing.canonicalPath, undefined);
  assert.equal(missing.jsonLd, undefined);
});
