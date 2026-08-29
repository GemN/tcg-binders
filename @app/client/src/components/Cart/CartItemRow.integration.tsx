import assert from "node:assert/strict";
import { after, afterEach, beforeEach, mock, test } from "node:test";

import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";

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

mock.module("react-i18next", {
  namedExports: {
    useTranslation: () => ({
      t: (key: string, options?: { name?: string }) => {
        if (key === "checkout:remove_item") {
          return `Remove ${options?.name} from cart`;
        }
        if (key === "checkout:decrease_quantity") {
          return `Decrease quantity for ${options?.name}`;
        }
        if (key === "checkout:increase_quantity") {
          return `Increase quantity for ${options?.name}`;
        }
        if (key === "checkout:remove") return "Remove";

        return key;
      },
    }),
  },
});

mock.module("@/components/CardImage", {
  namedExports: { CardImage: () => null },
});

mock.module("@/components/Cart/CartItemBadges", {
  namedExports: { CartItemBadges: () => null },
});

mock.module("@/providers/PricingSettingsContext", {
  namedExports: {
    usePricingSettings: () => ({
      convertAmountToLocalCurrency: () => null,
      currency: "USD",
    }),
  },
});

const [{ act, createElement }, { createRoot }, { CartItemRow }] =
  await Promise.all([
    import("react"),
    import("react-dom/client"),
    import("./CartItemRow.tsx"),
  ]);

let root: Root | null = null;

beforeEach(() => {
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
  dom.window.close();
});

test("removes a mobile cart item when decreasing its quantity from one", async () => {
  const removedItemIds: string[] = [];
  const quantityChanges: number[] = [];
  const container = document.getElementById("root");
  assert.ok(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(
      createElement(CartItemRow, {
        isSelected: false,
        item: {
          addedAt: "2026-01-01T00:00:00.000Z",
          availableQuantity: 3,
          binder: {
            id: "binder-id",
            name: "Trade binder",
            note: "",
            shortId: "trade-binder",
          },
          binderCardId: "binder-card-id",
          card: {
            collectorNumber: "1",
            imageUrl: null,
            name: "Test Card",
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
          unitPriceAmount: null,
          unitPriceCurrency: null,
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        locale: "en",
        onQuantityChange: (_binderCardId: string, quantity: number) => {
          quantityChanges.push(quantity);
        },
        onRemove: (binderCardId: string) => {
          removedItemIds.push(binderCardId);
        },
        onSelectionChange: () => undefined,
      })
    );
  });

  const mobileRemoveButton = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Remove Test Card from cart"]'
  );
  assert.ok(mobileRemoveButton);
  assert.equal(mobileRemoveButton.disabled, false);

  await act(async () => mobileRemoveButton.click());

  assert.deepEqual(removedItemIds, ["binder-card-id"]);
  assert.deepEqual(quantityChanges, []);

  const desktopDecreaseButton = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Decrease quantity for Test Card"]'
  );
  assert.ok(desktopDecreaseButton);
  assert.equal(desktopDecreaseButton.disabled, true);

  const desktopTrashButton = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Remove"]'
  );
  assert.ok(desktopTrashButton);
  assert.ok(desktopTrashButton.parentElement?.classList.contains("hidden"));
  assert.ok(desktopTrashButton.parentElement?.classList.contains("lg:flex"));
});
