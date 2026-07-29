import assert from "node:assert/strict";
import test from "node:test";

import type {
  BinderByShortIdQuery,
  BinderCardSummaryFieldsFragment,
  BinderVisibility,
  UserProfileByIdQuery,
} from "@app/graphql";
import type { TFunction } from "i18next";

import { serializeJsonLd } from "../lib/jsonLd.ts";
import type { SeoContext } from "../lib/seoMetadata.ts";
import {
  type BinderPageSeoMetadataInput,
  createBinderPageSeoMetadata,
} from "./BinderPage.seo.ts";

type BinderTranslationFunction = TFunction<
  ["binder", "checkout", "common"]
>;

interface TestTranslationOptions {
  count?: number;
  name?: string;
  seller?: string;
}

const createEnglishTranslation = (): BinderTranslationFunction =>
  ((key: string, options?: TestTranslationOptions) => {
    switch (key) {
      case "binder:seo.public.title":
        return `${options?.name} by ${options?.seller} - MTG`;
      case "binder:seo.public.short_title":
        return `${options?.name} - MTG`;
      case "binder:seo.public.fallback_title":
        return "MTG Binder";
      case "binder:seo.public.description":
        return `Browse ${options?.count} Magic: The Gathering cards in ${options?.seller}'s "${options?.name}" binder, including prices, conditions, languages, and availability.`;
      case "common:seo.not_found.title":
        return "Page Not Found";
      default:
        throw new Error(`Unexpected translation key: ${key}`);
    }
  }) as BinderTranslationFunction;

const createThaiTranslation = (): BinderTranslationFunction =>
  ((key: string, options?: TestTranslationOptions) => {
    switch (key) {
      case "binder:seo.public.title":
        return `${options?.name} โดย ${options?.seller} - MTG`;
      case "binder:seo.public.short_title":
        return `${options?.name} - MTG`;
      case "binder:seo.public.fallback_title":
        return "แฟ้มการ์ด MTG";
      case "binder:seo.public.description":
        return `เลือกดูการ์ด Magic: The Gathering ${options?.count} ใบในแฟ้ม "${options?.name}" ของ ${options?.seller} พร้อมราคา สภาพ ภาษา และจำนวนที่มี`;
      case "common:seo.not_found.title":
        return "ไม่พบหน้า";
      default:
        throw new Error(`Unexpected translation key: ${key}`);
    }
  }) as BinderTranslationFunction;

interface BinderDataInput {
  name?: string;
  visibility?: BinderVisibility;
}

const createBinderData = ({
  name = "Modern Staples",
  visibility = "listed" as BinderVisibility,
}: BinderDataInput = {}): BinderByShortIdQuery => ({
  binderByShortId: {
    binderCardCount: 84,
    id: "binder-id",
    name,
    nodeId: "binder-node-id",
    note: "",
    ownerId: "owner-id",
    shortId: "ABC123",
    stats: null,
    tcgId: "mtg",
    visibility,
  },
  binderCardsByShortId: {
    edges: [],
    pageInfo: {
      hasNextPage: false,
    },
    totalCount: 84,
  },
});

const createOwnerData = (
  nickname = "gem"
): UserProfileByIdQuery => ({
  userProfilesCollection: {
    edges: [
      {
        node: {
          country: "TH",
          id: "owner-id",
          nickname,
        },
      },
    ],
  },
});

const binderCards = [
  {
    id: "binder-card-id",
    priceAmount: "125",
    priceCurrency: "THB",
    quantity: 2,
    card: {
      cardSet: {
        code: "mh3",
        name: "Modern Horizons 3",
      },
      collectorNumber: "42",
      id: "card-id",
      imageUrl: "/card.jpg",
      name: "Test Card",
    },
  },
] as BinderCardSummaryFieldsFragment[];

const baseInput: BinderPageSeoMetadataInput = {
  binderQuery: {
    data: createBinderData(),
    loading: false,
  },
  isPublicPreview: false,
  ownerProfileQuery: {
    data: createOwnerData(),
    loading: false,
  },
  shortId: "ABC123",
  t: createEnglishTranslation(),
  visibleBinderCards: binderCards,
};

const seoContext: SeoContext = {
  canonicalUrl: "https://megabinder.example/binder/ABC123",
  locale: "en",
  origin: "https://megabinder.example",
  title: "Modern Staples by gem - MTG | MegaBinder",
};

test("builds listed binder metadata, product offers, and localized copy", () => {
  const metadata = createBinderPageSeoMetadata(baseInput);
  const jsonLd = serializeJsonLd(metadata.jsonLd?.(seoContext) || {});

  assert.equal(metadata.robots, "index,follow");
  assert.equal(metadata.title, "Modern Staples by gem - MTG");
  assert.equal(metadata.shortTitle, "Modern Staples - MTG");
  assert.equal(
    metadata.description,
    `Browse 84 Magic: The Gathering cards in gem's "Modern Staples" binder, including prices, conditions, languages, and availability.`
  );
  assert.equal(metadata.canonicalPath, "/binder/ABC123");
  assert.match(jsonLd, /"@type":"CollectionPage"/);
  assert.match(jsonLd, /"@type":"Offer"/);
  assert.match(jsonLd, /"price":"125"/);
});

test("does not index unlisted, private, or public-preview binders", () => {
  const unlisted = createBinderPageSeoMetadata({
    ...baseInput,
    binderQuery: {
      data: createBinderData({
        visibility: "unlisted" as BinderVisibility,
      }),
      loading: false,
    },
  });
  const privateBinder = createBinderPageSeoMetadata({
    ...baseInput,
    binderQuery: {
      data: createBinderData({
        visibility: "private" as BinderVisibility,
      }),
      loading: false,
    },
  });
  const publicPreview = createBinderPageSeoMetadata({
    ...baseInput,
    isPublicPreview: true,
  });

  [unlisted, privateBinder, publicPreview].forEach((metadata) => {
    assert.equal(metadata.robots, "noindex,follow");
    assert.equal(metadata.jsonLd, undefined);
  });
});

test("omits robots until both binder and owner queries resolve", () => {
  const binderUnresolved = createBinderPageSeoMetadata({
    ...baseInput,
    binderQuery: {
      data: undefined,
      loading: true,
    },
  });
  const ownerUnresolved = createBinderPageSeoMetadata({
    ...baseInput,
    ownerProfileQuery: {
      data: undefined,
      loading: true,
    },
  });
  const binderError = createBinderPageSeoMetadata({
    ...baseInput,
    binderQuery: {
      data: undefined,
      error: new Error(
        "transport error"
      ) as BinderPageSeoMetadataInput["binderQuery"]["error"],
      loading: false,
    },
  });

  assert.equal(binderUnresolved.robots, undefined);
  assert.equal(ownerUnresolved.robots, undefined);
  assert.equal(binderError.robots, undefined);
  assert.equal(binderUnresolved.jsonLd, undefined);
  assert.equal(ownerUnresolved.jsonLd, undefined);
  assert.equal(binderError.jsonLd, undefined);
});

test("marks a confirmed missing binder as a noindex not-found page", () => {
  const missing = createBinderPageSeoMetadata({
    ...baseInput,
    binderQuery: {
      data: {
        ...createBinderData(),
        binderByShortId: null,
      },
      loading: false,
    },
  });

  assert.equal(missing.robots, "noindex,follow");
  assert.equal(missing.title, "Page Not Found");
  assert.equal(missing.canonicalPath, undefined);
  assert.equal(missing.jsonLd, undefined);
});

test("uses the short binder title when the seller makes the title too long", () => {
  const metadata = createBinderPageSeoMetadata({
    ...baseInput,
    ownerProfileQuery: {
      data: createOwnerData(
        "a seller nickname that makes the preferred title much too long"
      ),
      loading: false,
    },
  });

  assert.equal(
    metadata.title,
    "Modern Staples by a seller nickname that makes the preferred title much too long - MTG"
  );
  assert.equal(metadata.shortTitle, "Modern Staples - MTG");
});

test("keeps localized binder facts raw for the SEO component", () => {
  const metadata = createBinderPageSeoMetadata({
    ...baseInput,
    t: createThaiTranslation(),
  });

  assert.equal(metadata.title, "Modern Staples โดย gem - MTG");
  assert.equal(
    metadata.description,
    'เลือกดูการ์ด Magic: The Gathering 84 ใบในแฟ้ม "Modern Staples" ของ gem พร้อมราคา สภาพ ภาษา และจำนวนที่มี'
  );
});
