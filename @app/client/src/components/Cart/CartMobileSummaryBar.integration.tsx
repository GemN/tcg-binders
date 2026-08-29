import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, test } from "node:test";

import type { CurrencyCode } from "@app/graphql";
import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";

import enCheckout from "@/assets/locales/en/checkout.json";
import thCheckout from "@/assets/locales/th/checkout.json";
import { getCartSelectionState } from "@/components/Cart/cartSelection";
import { type CartItem, getCartCurrencyTotals } from "@/lib/cart";

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

const [
  { act, createElement, useMemo, useState },
  { createRoot },
  { I18nextProvider, initReactI18next },
  { CartMobileSummaryBar },
] = await Promise.all([
  import("react"),
  import("react-dom/client"),
  import("react-i18next"),
  import("./CartMobileSummaryBar.tsx"),
]);

const i18n = createInstance();
let root: Root | null = null;

const createCartItem = (
  binderCardId: string,
  unitPriceAmount: number,
  unitPriceCurrency: CurrencyCode
): CartItem => ({
  addedAt: "2026-01-01T00:00:00.000Z",
  availableQuantity: 3,
  binder: {
    id: "binder-id",
    name: "Trade binder",
    note: "",
    shortId: "trade-binder",
  },
  binderCardId,
  card: {
    collectorNumber: "1",
    imageUrl: null,
    name: `Card ${binderCardId}`,
    scryfallId: null,
    setCode: "TST",
    setName: "Test Set",
  },
  condition: null,
  finish: null,
  isPreview: false,
  language: null,
  quantity: 1,
  seller: {
    country: "FR",
    id: "seller-id",
    nickname: "Seller",
  },
  unitPriceAmount,
  unitPriceCurrency,
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const cartItems = [
  createCartItem("eur-card", 2, "EUR" as CurrencyCode),
  createCartItem("thb-card", 30, "THB" as CurrencyCode),
];

const getElement = <T extends Element>(selector: string): T => {
  const element = document.querySelector(selector);
  assert.ok(element);

  return element as T;
};

interface CartMobileSummaryBarHarnessProps {
  locale: string;
}

// eslint-disable-next-line react-refresh/only-export-components
const CartMobileSummaryBarHarness = ({
  locale,
}: CartMobileSummaryBarHarnessProps) => {
  const [firstItemQuantity, setFirstItemQuantity] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    () => new Set()
  );
  const items = useMemo(
    () =>
      cartItems.map((item, index) =>
        index === 0 ? { ...item, quantity: firstItemQuantity } : item
      ),
    [firstItemQuantity]
  );
  const selectedItems = items.filter((item) =>
    selectedItemIds.has(item.binderCardId)
  );
  const handleGenerateMessages = () => undefined;
  const handleSelectionChange = (isSelected: boolean) => {
    setSelectedItemIds(
      isSelected ? new Set(items.map((item) => item.binderCardId)) : new Set()
    );
  };
  const handleDeselectFirst = () => {
    setSelectedItemIds((currentItemIds) => {
      const nextItemIds = new Set(currentItemIds);
      nextItemIds.delete(items[0].binderCardId);
      return nextItemIds;
    });
  };
  const handleIncreaseFirstQuantity = () => {
    setFirstItemQuantity((quantity) => quantity + 1);
  };

  return createElement(
    "div",
    null,
    createElement(CartMobileSummaryBar, {
      isGenerateDisabled: selectedItems.length === 0,
      locale,
      selectionState: getCartSelectionState(items, selectedItemIds),
      totals: getCartCurrencyTotals(selectedItems),
      onGenerateMessages: handleGenerateMessages,
      onSelectionChange: handleSelectionChange,
    }),
    createElement(
      "button",
      {
        "data-testid": "deselect-first",
        onClick: handleDeselectFirst,
        type: "button",
      },
      "Deselect first"
    ),
    createElement(
      "button",
      {
        "data-testid": "increase-first",
        onClick: handleIncreaseFirstQuantity,
        type: "button",
      },
      "Increase first"
    )
  );
};

before(async () => {
  await i18n.use(initReactI18next).init({
    fallbackLng: "en",
    lng: "en",
    resources: {
      en: { checkout: enCheckout },
      th: { checkout: thCheckout },
    },
  });
});

beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
});

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
    root = null;
  }
  document.body.innerHTML = "";
  await i18n.changeLanguage("en");
});

after(() => {
  dom.window.close();
});

const renderSummaryBar = async (locale: string) => {
  const container = document.getElementById("root");
  assert.ok(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(
      createElement(
        I18nextProvider,
        { i18n },
        createElement(CartMobileSummaryBarHarness, { locale })
      )
    );
  });
};

test("selects all states and updates the selected cumulative total", async () => {
  await renderSummaryBar("en");

  const selectAll = getElement<HTMLButtonElement>("#cart-mobile-select-all");
  const total = getElement<HTMLElement>('[data-testid="cart-mobile-total"]');
  const createMessages = [...document.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === "Create order messages"
  );
  assert.ok(createMessages);
  assert.equal(selectAll.getAttribute("data-state"), "unchecked");
  assert.equal(total.textContent?.trim(), "-");
  assert.equal(createMessages.disabled, true);

  await act(async () => selectAll.click());

  assert.equal(selectAll.getAttribute("data-state"), "checked");
  assert.equal(total.textContent?.trim(), "2.00 € + ฿30");
  assert.equal(createMessages.disabled, false);

  await act(async () =>
    getElement<HTMLButtonElement>('[data-testid="deselect-first"]').click()
  );

  assert.equal(selectAll.getAttribute("data-state"), "indeterminate");
  assert.equal(total.textContent?.trim(), "฿30");

  await act(async () => selectAll.click());
  await act(async () =>
    getElement<HTMLButtonElement>('[data-testid="increase-first"]').click()
  );

  assert.equal(selectAll.getAttribute("data-state"), "checked");
  assert.equal(total.textContent?.trim(), "4.00 € + ฿30");

  await act(async () => selectAll.click());

  assert.equal(selectAll.getAttribute("data-state"), "unchecked");
  assert.equal(total.textContent?.trim(), "-");
  assert.equal(createMessages.disabled, true);
});

test("renders the full Thai controls and multi-currency total", async () => {
  await i18n.changeLanguage("th");
  await renderSummaryBar("th");

  const selectAll = getElement<HTMLButtonElement>("#cart-mobile-select-all");
  await act(async () => selectAll.click());

  assert.equal(
    document.querySelector('label[for="cart-mobile-select-all"]')?.textContent,
    "ทั้งหมด"
  );
  assert.equal(
    getElement<HTMLElement>('[data-testid="cart-mobile-total"]').textContent,
    "2.00 € + ฿30"
  );
  assert.ok(
    [...document.querySelectorAll("button")].some(
      (button) => button.textContent?.trim() === "สร้างข้อความสั่งซื้อ"
    )
  );
});
