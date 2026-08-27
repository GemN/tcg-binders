import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, mock, test } from "node:test";

import type { CardListingFieldsFragment } from "@app/graphql";
import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import type { Root } from "react-dom/client";

import enCard from "@/assets/locales/en/card.json";
import enCheckout from "@/assets/locales/en/checkout.json";
import enCommon from "@/assets/locales/en/common.json";
import type { CardListingSellerProfile } from "@/components/CardListingsTable";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

Object.defineProperties(globalThis, {
  CustomEvent: { configurable: true, value: dom.window.CustomEvent },
  document: { configurable: true, value: dom.window.document },
  DocumentFragment: {
    configurable: true,
    value: dom.window.DocumentFragment,
  },
  Element: { configurable: true, value: dom.window.Element },
  Event: { configurable: true, value: dom.window.Event },
  EventTarget: { configurable: true, value: dom.window.EventTarget },
  getComputedStyle: {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window),
  },
  HTMLButtonElement: {
    configurable: true,
    value: dom.window.HTMLButtonElement,
  },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  localStorage: { configurable: true, value: dom.window.localStorage },
  MouseEvent: { configurable: true, value: dom.window.MouseEvent },
  MutationObserver: {
    configurable: true,
    value: dom.window.MutationObserver,
  },
  navigator: { configurable: true, value: dom.window.navigator },
  Node: { configurable: true, value: dom.window.Node },
  NodeFilter: { configurable: true, value: dom.window.NodeFilter },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  window: { configurable: true, value: dom.window },
});

interface ReactActEnvironmentGlobal {
  IS_REACT_ACT_ENVIRONMENT: boolean;
}

(
  globalThis as typeof globalThis & ReactActEnvironmentGlobal
).IS_REACT_ACT_ENVIRONMENT = true;

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
  },
});

const [
  { act },
  { createRoot },
  { I18nextProvider, initReactI18next },
  { MemoryRouter },
  { CardListingsTable },
  { CartProvider },
  { useCart },
] = await Promise.all([
  import("react"),
  import("react-dom/client"),
  import("react-i18next"),
  import("react-router"),
  import("./CardListingsTable.tsx"),
  import("@/providers/CartProvider"),
  import("@/providers/CartContext"),
]);

const i18n = createInstance();
let root: Root | null = null;

const createListing = (quantity = 2) =>
  ({
    binder: {
      binderCardCount: 1,
      id: "binder-id",
      name: "Trade binder",
      nodeId: "binder-node-id",
      note: "",
      ownerId: "seller-id",
      shortId: "trade-binder",
      stats: { viewCount: 0 },
      tcgId: "mtg",
      visibility: "public",
    },
    card: {
      cardSet: { code: "TST", name: "Test Set" },
      collectorNumber: "1",
      finishes: ["normal"],
      id: "card-id",
      imageUrl: null,
      marketPrices: { edges: [] },
      mtgCardDetail: { scryfallId: null },
      name: "Test Card",
      rarity: "common",
      releasedAt: "2026-01-01",
    },
    condition: "near_mint",
    dynamicPriceRule: null,
    finish: "normal",
    id: "listing-id",
    language: "en",
    priceAmount: "2.50",
    priceCurrency: "EUR",
    quantity,
  }) as unknown as CardListingFieldsFragment;

const seller = {
  country: "FR",
  id: "seller-id",
  nickname: "Seller",
} as CardListingSellerProfile;

const CartNotificationProbe = () => {
  const {
    items,
    lastAddedCartItem,
    undoLastCartAddition,
    updateCartItemQuantity,
  } = useCart();
  const cartItem = items.find((item) => item.binderCardId === "listing-id");
  const handleSilentIncrease = () => {
    if (!cartItem) return;

    updateCartItemQuantity(cartItem.binderCardId, cartItem.quantity + 1);
  };
  const handleUndo = () => {
    undoLastCartAddition();
  };

  return createElement(
    "div",
    null,
    createElement(
      "output",
      { "data-testid": "cart-notification-quantity" },
      lastAddedCartItem?.quantity ?? ""
    ),
    createElement(
      "output",
      { "data-testid": "cart-item-quantity" },
      cartItem?.quantity ?? ""
    ),
    createElement(
      "button",
      { onClick: handleSilentIncrease, type: "button" },
      "Silent increase"
    ),
    createElement(
      "button",
      { onClick: handleUndo, type: "button" },
      "Undo probe"
    )
  );
};

before(async () => {
  await i18n.use(initReactI18next).init({
    fallbackLng: "en",
    lng: "en",
    resources: {
      en: { card: enCard, checkout: enCheckout, common: enCommon },
    },
  });
});

beforeEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = '<div id="root"></div>';
});

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
    root = null;
  }
  document.body.innerHTML = "";
});

after(() => {
  graphqlModuleMock.restore();
  dom.window.close();
});

const renderTable = async (listing = createListing()) => {
  const container = document.getElementById("root");
  assert.ok(container);
  root ||= createRoot(container);

  await act(async () => {
    root?.render(
      createElement(
        I18nextProvider,
        { i18n },
        createElement(
          MemoryRouter,
          null,
          createElement(
            CartProvider,
            null,
            createElement(CardListingsTable, {
              formatPrice: () => ({ converted: null, original: "€2.50" }),
              isSellerLoading: false,
              listings: [listing],
              sellerProfilesById: new Map([[seller.id, seller]]),
            }),
            createElement(CartNotificationProbe)
          )
        )
      )
    );
  });
};

interface StoredCartItemOptions {
  availableQuantity: number;
  quantity: number;
}

const storeCartItem = ({
  availableQuantity,
  quantity,
}: StoredCartItemOptions) => {
  const timestamp = "2026-01-01T00:00:00.000Z";

  window.localStorage.setItem(
    "tcgbinder.cart.v1",
    JSON.stringify({
      items: [
        {
          addedAt: timestamp,
          availableQuantity,
          binder: {
            id: "binder-id",
            name: "Trade binder",
            note: "",
            shortId: "trade-binder",
          },
          binderCardId: "listing-id",
          card: {
            collectorNumber: "1",
            imageUrl: null,
            name: "Test Card",
            scryfallId: null,
            setCode: "TST",
            setName: "Test Set",
          },
          condition: "near_mint",
          finish: "normal",
          isPreview: false,
          language: "en",
          quantity,
          seller: {
            country: "FR",
            id: "seller-id",
            nickname: "Seller",
          },
          unitPriceAmount: 2.5,
          unitPriceCurrency: "EUR",
          updatedAt: timestamp,
        },
      ],
      version: 1,
    })
  );
};

const getButton = (name: string): HTMLButtonElement | null => {
  const buttons = [...document.querySelectorAll("button")];
  return (
    buttons.find(
      (button) =>
        button.textContent?.trim() === name ||
        button.getAttribute("aria-label") === name
    ) ?? null
  );
};

const getDisplayedQuantity = (nextButton: HTMLButtonElement): string | null => {
  return nextButton.previousElementSibling?.textContent?.trim() ?? null;
};

const getNotificationQuantity = (): string | null => {
  return (
    document
      .querySelector('[data-testid="cart-notification-quantity"]')
      ?.textContent?.trim() ?? null
  );
};

const getCartItemQuantity = (): string | null => {
  return (
    document
      .querySelector('[data-testid="cart-item-quantity"]')
      ?.textContent?.trim() ?? null
  );
};

test("replaces Add to cart with a notifying quantity selector capped at availability", async () => {
  await renderTable();

  const addButton = getButton("Add to cart");
  assert.ok(addButton);

  await act(async () => addButton.click());

  assert.equal(getButton("Add to cart"), null);
  assert.equal(getNotificationQuantity(), "1");
  const incrementButton = getButton("Next");
  assert.ok(incrementButton);
  assert.equal(getDisplayedQuantity(incrementButton), "1");
  assert.equal(incrementButton.disabled, false);

  await act(async () => incrementButton.click());

  assert.equal(getDisplayedQuantity(incrementButton), "2");
  assert.equal(incrementButton.disabled, true);
  assert.equal(getNotificationQuantity(), "2");
});

interface StoredCartSnapshot {
  items: unknown[];
}

test("removes the listing instead of storing quantity zero", async () => {
  await renderTable();

  const addButton = getButton("Add to cart");
  assert.ok(addButton);
  await act(async () => addButton.click());

  const removeButton = getButton("Remove");
  assert.ok(removeButton);
  await act(async () => removeButton.click());

  assert.ok(getButton("Add to cart"));
  assert.equal(getButton("Next"), null);
  assert.equal(getNotificationQuantity(), "");
  await act(async () => getButton("Undo probe")?.click());
  assert.ok(getButton("Add to cart"));
  const storedCart = JSON.parse(
    window.localStorage.getItem("tcgbinder.cart.v1") ?? "{}"
  ) as StoredCartSnapshot;
  assert.deepEqual(storedCart.items, []);
});

test("invalidates the listing notification and undo after a decrease", async () => {
  await renderTable(createListing(3));

  const addButton = getButton("Add to cart");
  assert.ok(addButton);
  await act(async () => addButton.click());

  const incrementButton = getButton("Next");
  assert.ok(incrementButton);
  await act(async () => incrementButton.click());
  assert.equal(getNotificationQuantity(), "2");

  const decrementButton = getButton("Previous");
  assert.ok(decrementButton);
  await act(async () => decrementButton.click());

  assert.equal(getCartItemQuantity(), "1");
  assert.equal(getNotificationQuantity(), "");
  await act(async () => getButton("Undo probe")?.click());
  assert.equal(getCartItemQuantity(), "1");
});

test("keeps the shared quantity update silent", async () => {
  storeCartItem({ availableQuantity: 3, quantity: 1 });
  await renderTable(createListing(3));

  await act(async () => getButton("Silent increase")?.click());

  assert.equal(getCartItemQuantity(), "2");
  assert.equal(getNotificationQuantity(), "");
});

test("invalidates notification and undo when live availability is reduced", async () => {
  await renderTable(createListing(3));

  const addButton = getButton("Add to cart");
  assert.ok(addButton);
  await act(async () => addButton.click());
  const incrementButton = getButton("Next");
  assert.ok(incrementButton);
  await act(async () => incrementButton.click());
  assert.equal(getNotificationQuantity(), "2");

  await renderTable(createListing(1));

  assert.equal(getCartItemQuantity(), "1");
  assert.equal(getNotificationQuantity(), "");
  await act(async () => getButton("Undo probe")?.click());
  assert.equal(getCartItemQuantity(), "1");
});

test("reconciles increased live availability and increments through the new maximum", async () => {
  storeCartItem({ availableQuantity: 1, quantity: 1 });

  await renderTable(createListing(3));

  let incrementButton = getButton("Next");
  assert.ok(incrementButton);
  assert.equal(getDisplayedQuantity(incrementButton), "1");
  assert.equal(incrementButton.disabled, false);

  await act(async () => incrementButton?.click());

  incrementButton = getButton("Next");
  assert.ok(incrementButton);
  assert.equal(getDisplayedQuantity(incrementButton), "2");
  assert.equal(incrementButton.disabled, false);

  await act(async () => incrementButton?.click());

  incrementButton = getButton("Next");
  assert.ok(incrementButton);
  assert.equal(getDisplayedQuantity(incrementButton), "3");
  assert.equal(incrementButton.disabled, true);
});

test("clamps an existing cart quantity to reduced live availability", async () => {
  storeCartItem({ availableQuantity: 5, quantity: 4 });

  await renderTable(createListing(2));

  assert.equal(getButton("Add to cart"), null);
  const incrementButton = getButton("Next");
  assert.ok(incrementButton);
  assert.equal(getDisplayedQuantity(incrementButton), "2");
  assert.equal(incrementButton.disabled, true);
});

test("removes a persisted cart item when live availability reaches zero", async () => {
  storeCartItem({ availableQuantity: 2, quantity: 2 });

  await renderTable(createListing(0));

  const addButton = getButton("Add to cart");
  assert.ok(addButton);
  assert.equal(addButton.disabled, true);
  assert.equal(getCartItemQuantity(), "");
  const storedCart = JSON.parse(
    window.localStorage.getItem("tcgbinder.cart.v1") ?? "{}"
  ) as StoredCartSnapshot;
  assert.deepEqual(storedCart.items, []);
});
