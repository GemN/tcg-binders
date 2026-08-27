// Exercises the Home import flow through the real modal and router wiring.

import assert from "node:assert/strict";
import {
  after,
  afterEach,
  before,
  beforeEach,
  mock,
  test,
} from "node:test";

import type { CardsFilter, StringFilter } from "@app/graphql";
import i18next from "i18next";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";

import enBinder from "@/assets/locales/en/binder.json";
import enCommon from "@/assets/locales/en/common.json";
import {
  type BinderEditing,
  BinderEditingCoherenceError,
} from "@/lib/binderEditing";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

Object.defineProperties(globalThis, {
  CustomEvent: { configurable: true, value: dom.window.CustomEvent },
  document: { configurable: true, value: dom.window.document },
  Element: { configurable: true, value: dom.window.Element },
  Event: { configurable: true, value: dom.window.Event },
  EventTarget: { configurable: true, value: dom.window.EventTarget },
  getComputedStyle: {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window),
  },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  HTMLInputElement: {
    configurable: true,
    value: dom.window.HTMLInputElement,
  },
  HTMLTextAreaElement: {
    configurable: true,
    value: dom.window.HTMLTextAreaElement,
  },
  KeyboardEvent: { configurable: true, value: dom.window.KeyboardEvent },
  localStorage: { configurable: true, value: dom.window.localStorage },
  MouseEvent: { configurable: true, value: dom.window.MouseEvent },
  MutationObserver: {
    configurable: true,
    value: dom.window.MutationObserver,
  },
  navigator: { configurable: true, value: dom.window.navigator },
  Node: { configurable: true, value: dom.window.Node },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  window: { configurable: true, value: dom.window },
});

interface ReactActEnvironmentGlobal {
  IS_REACT_ACT_ENVIRONMENT: boolean;
}

(globalThis as typeof globalThis & ReactActEnvironmentGlobal)
  .IS_REACT_ACT_ENVIRONMENT = true;

interface ImportLookupResult {
  data: {
    cardsCollection: {
      edges: Array<{ node: unknown }>;
      pageInfo: {
        endCursor: null;
        hasNextPage: boolean;
      };
    };
  };
}

interface LoadCardsOptions {
  variables: {
    filter: CardsFilter;
  };
}

type LoadCards = (options: LoadCardsOptions) => Promise<ImportLookupResult>;

const loadCards = mock.fn<LoadCards>();

const graphqlModuleMock = mock.module("@app/graphql", {
  namedExports: {
    CardCondition: {
      Excellent: "excellent",
      Good: "good",
      LightPlayed: "light_played",
      Mint: "mint",
      NearMint: "near_mint",
      Played: "played",
      Poor: "poor",
    },
    CurrencyCode: {
      Eur: "EUR",
      Gbp: "GBP",
      Jpy: "JPY",
      Thb: "THB",
      Usd: "USD",
    },
    LanguageCode: {
      Ar: "ar",
      De: "de",
      En: "en",
      Es: "es",
      Fr: "fr",
      Grc: "grc",
      He: "he",
      It: "it",
      Ja: "ja",
      Ko: "ko",
      La: "la",
      Ph: "ph",
      Pt: "pt",
      Qya: "qya",
      Ru: "ru",
      Sa: "sa",
      Zhs: "zhs",
      Zht: "zht",
    },
    MarketPriceSource: {
      Cardkingdom: "cardkingdom",
      Cardmarket: "cardmarket",
      Tcgplayer: "tcgplayer",
    },
    useAddBinderCardsMutation: () => [mock.fn(), { loading: false }],
    useCardSearchQuery: () => ({
      data: undefined,
      fetchMore: mock.fn(),
      loading: false,
      previousData: undefined,
    }),
    useCardsForBinderImportLazyQuery: () => [
      loadCards,
      { loading: false },
    ],
    useCardsForBinderImportQuery: () => ({
      data: { cardsCollection: { edges: [] } },
    }),
    useCurrentCurrencyRatesQuery: () => ({ data: undefined, error: undefined }),
  },
});

const [
  { act, createElement },
  { createRoot },
  { I18nextProvider, initReactI18next },
  { MemoryRouter, Route, Routes },
  { ButtonImportBinder },
  { Home },
  { PricingSettingsProvider },
] = await Promise.all([
  import("react"),
  import("react-dom/client"),
  import("react-i18next"),
  import("react-router"),
  import("@/components/ButtonImportBinder"),
  import("./Home.tsx"),
  import("@/providers/PricingSettingsProvider"),
]);

const DRAFT_BINDER_STORAGE_KEY = "tcgbinder:draft-binder";
const importedCard = {
  id: "card-id",
  externalId: "external-card-id",
  name: "Lightning Bolt",
  collectorNumber: "123",
  rarity: "uncommon",
  finishes: ["normal", "foil"],
  imageUrl: "https://example.com/lightning-bolt.jpg",
  releasedAt: "2025-01-24",
  cardSet: {
    id: "set-id",
    code: "TST",
    name: "Test Set",
    releaseAt: "2025-01-24",
  },
  mtgCardDetail: {
    oracleText: "Lightning Bolt deals 3 damage to any target.",
    scryfallId: "scryfall-id",
    typeLine: "Instant",
  },
  marketPrices: { edges: [] },
};

const matchesImportedCardName = (
  filter: StringFilter | null | undefined
): boolean => {
  if (!filter) return false;
  if (filter.eq === importedCard.name) return true;
  if (
    filter.startsWith &&
    importedCard.name.startsWith(filter.startsWith)
  ) {
    return true;
  }
  return filter.ilike?.toLowerCase() === importedCard.name.toLowerCase();
};

const backendReturnsImportedCard = (filter: CardsFilter): boolean => {
  return [filter, ...(filter.or || [])].some((candidate) =>
    matchesImportedCardName(candidate.name)
  );
};

let root: Root | null = null;

before(async () => {
  await i18next.use(initReactI18next).init({
    fallbackLng: "en",
    lng: "en",
    resources: {
      en: {
        binder: enBinder,
        common: enCommon,
      },
    },
  });
});

beforeEach(() => {
  window.localStorage.clear();
  loadCards.mock.resetCalls();
  document.body.innerHTML = '<div id="root"></div>';
});

after(() => {
  graphqlModuleMock.restore();
  dom.window.close();
});

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
    root = null;
  }
  document.body.innerHTML = "";
});

const renderHome = async () => {
  const container = document.getElementById("root");
  assert.ok(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(
      createElement(
        I18nextProvider,
        { i18n: i18next },
        createElement(
          PricingSettingsProvider,
          null,
          createElement(
            MemoryRouter,
            { initialEntries: ["/"] },
            createElement(
              Routes,
              null,
              createElement(Route, { path: "/", element: createElement(Home) }),
              createElement(Route, {
                path: "/binder/draft",
                element: createElement("div", {
                  "data-testid": "draft-route",
                }),
              })
            )
          )
        )
      )
    );
  });
};

interface RenderImportButtonOptions {
  binderEditing: BinderEditing;
  onCoherenceFailure: () => void;
}

const renderImportButton = async ({
  binderEditing,
  onCoherenceFailure,
}: RenderImportButtonOptions) => {
  const container = document.getElementById("root");
  assert.ok(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(
      createElement(
        I18nextProvider,
        { i18n: i18next },
        createElement(ButtonImportBinder, {
          binderEditing,
          onCoherenceFailure,
          tcgId: "mtg",
        })
      )
    );
  });
};

const getButton = (label: string): HTMLButtonElement => {
  const matches = [...document.querySelectorAll("button")].filter(
    (button) => button.textContent?.trim() === label
  );

  assert.equal(matches.length, 1, `Expected one ${label} button`);
  return matches[0] as HTMLButtonElement;
};

const clickButton = async (label: string) => {
  await act(async () => getButton(label).click());
};

const setTextareaValue = async (value: string) => {
  const textarea = document.getElementById("binder-import-input");
  assert.ok(textarea instanceof HTMLTextAreaElement);
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value"
  )?.set;
  assert.ok(valueSetter);

  await act(async () => {
    valueSetter.call(textarea, value);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

const flushImport = async () => {
  for (let index = 0; index < 5; index += 1) {
    await act(async () => Promise.resolve());
  }
};

test("case-insensitively persists a resolved Home import and navigates to the draft", async () => {
  loadCards.mock.mockImplementation(async ({ variables }) => {
    const edges = backendReturnsImportedCard(variables.filter)
      ? [{ node: importedCard }]
      : [];

    return {
      data: {
        cardsCollection: {
          edges,
          pageInfo: { endCursor: null, hasNextPage: false },
        },
      },
    };
  });
  await renderHome();
  await clickButton("Import from file");
  await setTextareaValue("2 lightning bolt (TST) 123 *F*");
  await clickButton("Import");
  await flushImport();

  assert.ok(document.querySelector('[data-testid="draft-route"]'));
  const savedDraft = window.localStorage.getItem(DRAFT_BINDER_STORAGE_KEY);
  assert.ok(savedDraft);
  const draftBinder = JSON.parse(savedDraft);

  assert.equal(draftBinder.cards.length, 1);
  assert.deepEqual(
    {
      cardId: draftBinder.cards[0].cardId,
      condition: draftBinder.cards[0].condition,
      finish: draftBinder.cards[0].finish,
      language: draftBinder.cards[0].language,
      name: draftBinder.cards[0].card.name,
      priceAmount: draftBinder.cards[0].priceAmount,
      priceCurrency: draftBinder.cards[0].priceCurrency,
      quantity: draftBinder.cards[0].quantity,
    },
    {
      cardId: "card-id",
      condition: "near_mint",
      finish: "foil",
      language: "en",
      name: "Lightning Bolt",
      priceAmount: null,
      priceCurrency: "THB",
      quantity: 2,
    }
  );
});

test("locks Binder Editing when a coherent import result is dismissed with Escape", async () => {
  loadCards.mock.mockImplementation(async ({ variables }) => ({
    data: {
      cardsCollection: {
        edges: backendReturnsImportedCard(variables.filter)
          ? [{ node: importedCard }]
          : [],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
  }));
  const onCoherenceFailure = mock.fn();
  const unusedOperation = async () => {
    throw new Error("unused operation");
  };
  const binderEditing: BinderEditing = {
    addCard: unusedOperation,
    addCards: async () => {
      throw new BinderEditingCoherenceError(new Error("refresh failed"), {
        applied: 1,
        failed: 0,
        failedIndexes: [],
        skipped: 0,
      });
    },
    applyCardKingdomMultiplier: unusedOperation,
    removeCard: unusedOperation,
    removeCards: unusedOperation,
    renameBinder: unusedOperation,
    updateBinderNote: unusedOperation,
    updateCard: unusedOperation,
  };

  await renderImportButton({ binderEditing, onCoherenceFailure });
  const trigger = document.querySelector('[data-slot="dialog-trigger"]');
  assert.ok(trigger instanceof HTMLElement);
  await act(async () => trigger.click());
  await setTextareaValue("1 lightning bolt (TST) 123");
  const importButton = [
    ...document.querySelectorAll('[data-slot="dialog-content"] button'),
  ].find((button) => button.textContent?.trim() === "Import");
  assert.ok(importButton instanceof HTMLElement);
  await act(async () => importButton.click());
  await flushImport();

  assert.equal(onCoherenceFailure.mock.callCount(), 0);
  assert.ok(document.body.textContent?.includes("Import complete — reload needed"));

  await act(async () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })
    );
  });

  assert.equal(onCoherenceFailure.mock.callCount(), 1);
});
