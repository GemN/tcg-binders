import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, mock, test } from "node:test";

import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";

import enCommon from "@/assets/locales/en/common.json";

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
  KeyboardEvent: { configurable: true, value: dom.window.KeyboardEvent },
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

(globalThis as typeof globalThis & ReactActEnvironmentGlobal)
  .IS_REACT_ACT_ENVIRONMENT = true;

const graphqlModuleMock = mock.module("@app/graphql", {
  namedExports: {
    CurrencyCode: {
      Eur: "EUR",
      Gbp: "GBP",
      Thb: "THB",
      Usd: "USD",
    },
    MarketPriceSource: {
      Cardkingdom: "cardkingdom",
      Cardmarket: "cardmarket",
      Tcgplayer: "tcgplayer",
    },
    useCurrentCurrencyRatesQuery: () => ({
      data: undefined,
      error: undefined,
    }),
  },
});

const [
  { act, createElement },
  { createRoot },
  { I18nextProvider, initReactI18next },
  { PriceSourceSwitcher },
  { PricingSettingsProvider },
] = await Promise.all([
  import("react"),
  import("react-dom/client"),
  import("react-i18next"),
  import("./PriceSourceSwitcher.tsx"),
  import("@/providers/PricingSettingsProvider"),
]);

const i18n = createInstance();
let root: Root | null = null;

before(async () => {
  await i18n.use(initReactI18next).init({
    fallbackLng: "en",
    lng: "en",
    resources: { en: { common: enCommon } },
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

test("keeps the price source menu open when converted prices are toggled", async () => {
  const container = document.getElementById("root");
  assert.ok(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(
      createElement(
        I18nextProvider,
        { i18n },
        createElement(
          PricingSettingsProvider,
          null,
          createElement(PriceSourceSwitcher)
        )
      )
    );
  });

  const trigger = document.querySelector(
    '[data-slot="dropdown-menu-trigger"]'
  );
  assert.ok(trigger instanceof HTMLButtonElement);

  await act(async () => {
    trigger.dispatchEvent(
      new MouseEvent("pointerdown", {
        bubbles: true,
        button: 0,
      })
    );
  });

  const menu = document.querySelector('[role="menu"]');
  const convertPricesItem = document.querySelector(
    '[role="menuitemcheckbox"]'
  );
  assert.ok(menu instanceof HTMLElement);
  assert.ok(convertPricesItem instanceof HTMLElement);
  assert.equal(convertPricesItem.textContent?.includes("Convert prices"), true);
  assert.equal(convertPricesItem.getAttribute("aria-checked"), "true");

  await act(async () => convertPricesItem.click());

  assert.equal(convertPricesItem.getAttribute("aria-checked"), "false");
  assert.equal(menu.getAttribute("data-state"), "open");
  assert.equal(document.body.contains(convertPricesItem), true);
});
