import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, mock, test } from "node:test";

import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import type { Root } from "react-dom/client";

import enBinder from "@/assets/locales/en/binder.json";
import {
  DetailProbe,
  HeaderProbe,
} from "@/components/BinderPageView.identity.testFixtures";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

Object.defineProperties(globalThis, {
  document: { configurable: true, value: dom.window.document },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  navigator: { configurable: true, value: dom.window.navigator },
  Node: { configurable: true, value: dom.window.Node },
  window: { configurable: true, value: dom.window },
});

interface ReactActEnvironmentGlobal {
  IS_REACT_ACT_ENVIRONMENT: boolean;
}

(globalThis as typeof globalThis & ReactActEnvironmentGlobal)
  .IS_REACT_ACT_ENVIRONMENT = true;

const renderNull = () => null;

const moduleMocks = [
  mock.module("@/components/BinderCardViewPanel", {
    namedExports: { BinderCardViewPanel: renderNull },
  }),
  mock.module("@/components/BinderPageControls", {
    namedExports: { BinderPageControls: renderNull },
  }),
  mock.module("@/components/BinderPageHeader", {
    namedExports: { BinderPageHeader: HeaderProbe },
  }),
  mock.module("@/components/ModalBinderCardDetail", {
    namedExports: { ModalBinderCardDetail: DetailProbe },
  }),
  mock.module("@/components/ModalBulkBinderCardPrice", {
    namedExports: { ModalBulkBinderCardPrice: renderNull },
  }),
];

const [
  { act },
  { createRoot },
  { I18nextProvider, initReactI18next },
  { BinderPageView },
] = await Promise.all([
  import("react"),
  import("react-dom/client"),
  import("react-i18next"),
  import("./BinderPageView.tsx"),
]);

const i18n = createInstance();
let root: Root | null = null;

before(async () => {
  await i18n.use(initReactI18next).init({
    fallbackLng: "en",
    lng: "en",
    resources: { en: { binder: enBinder } },
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
});

after(() => {
  moduleMocks.forEach((moduleMock) => moduleMock.restore());
  dom.window.close();
});

const noop = () => undefined;

interface RenderBinderPageViewOptions {
  binderIdentity: string;
}

const renderBinderPageView = async ({
  binderIdentity,
}: RenderBinderPageViewOptions) => {
  const container = document.getElementById("root");
  assert.ok(container);
  root ||= createRoot(container);

  await act(async () => {
    root?.render(
      createElement(
        I18nextProvider,
        { i18n },
        createElement(BinderPageView, {
          activeFilterCount: 0,
          binderIdentity,
          binderName: "Same binder name",
          binderNote: "Same binder note",
          binderTcgId: "mtg",
          binderVisibility: "unlisted" as never,
          canGoNextDetailCard: false,
          canGoPreviousDetailCard: false,
          canUseCommerce: false,
          cardsPerPage: 20,
          filterState: {} as never,
          isBulkPriceOpen: false,
          isDeletingSelectedBinderCards: false,
          isDetailLoading: false,
          isFiltered: false,
          isFilteredCountExact: true,
          isMobile: false,
          isOwnerView: true,
          isPageLoading: false,
          isSelectionMode: false,
          pageIndex: 0,
          requiresReload: false,
          selectedBinderCard: null,
          selectedBinderCardCount: 0,
          selectedBinderCardIds: new Set<string>(),
          selectedBinderCards: [],
          selectedCardIndex: null,
          showConvertedMarketPrices: true,
          sortMode: "seller_order",
          totalBinderCards: 0,
          viewMode: "grid",
          visibleBinderCards: [],
          onAddToCart: noop,
          onBulkPriceApplied: noop,
          onBulkPriceOpenChange: noop,
          onClearCardSelection: noop,
          onClearFilters: noop,
          onDeleteSelectedBinderCards: noop,
          onDetailOpenChange: noop,
          onFilterStateChange: noop,
          onGoNextDetailCard: noop,
          onGoPreviousDetailCard: noop,
          onNextPage: noop,
          onOpenBulkPrice: noop,
          onOpenCard: noop,
          onPreviousPage: noop,
          onSelectVisibleBinderCards: noop,
          onSelectionModeChange: noop,
          onSortChange: noop,
          onToggleCardSelection: noop,
          onViewChange: noop,
        })
      )
    );
  });
};

const getProbe = (testId: string): HTMLButtonElement => {
  const probe = document.querySelector(`[data-testid="${testId}"]`);
  assert.ok(probe instanceof dom.window.HTMLButtonElement);
  return probe as HTMLButtonElement;
};

test("resets equal-metadata header and detail state when binder identity changes", async () => {
  await renderBinderPageView({ binderIdentity: "binder-a" });

  await act(async () => {
    getProbe("header-probe").click();
    getProbe("detail-probe").click();
  });
  assert.equal(getProbe("header-probe").textContent, "locally saved");
  assert.equal(getProbe("detail-probe").textContent, "reload required");

  await renderBinderPageView({ binderIdentity: "binder-b" });

  assert.equal(getProbe("header-probe").textContent, "Same binder name");
  assert.equal(getProbe("detail-probe").textContent, "ready");
});
