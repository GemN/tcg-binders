import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, mock, test } from "node:test";

import type { BinderVisibility, PublicBindersByOwnerQuery } from "@app/graphql";
import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import type { ComponentProps, ReactElement } from "react";
import type { Root } from "react-dom/client";

import enBinder from "@/assets/locales/en/binder.json";
import enCommon from "@/assets/locales/en/common.json";

import type { BinderGalleryBinder } from "./BinderGallery.tsx";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

Object.defineProperties(globalThis, {
  CustomEvent: { configurable: true, value: dom.window.CustomEvent },
  document: { configurable: true, value: dom.window.document },
  Element: { configurable: true, value: dom.window.Element },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  navigator: { configurable: true, value: dom.window.navigator },
  Node: { configurable: true, value: dom.window.Node },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  window: { configurable: true, value: dom.window },
});

interface ReactActEnvironmentGlobal {
  IS_REACT_ACT_ENVIRONMENT: boolean;
}

(
  globalThis as typeof globalThis & ReactActEnvironmentGlobal
).IS_REACT_ACT_ENVIRONMENT = true;

interface ButtonNewBinderMockProps {
  trigger?: ReactElement;
}

const renderButtonNewBinderMock = ({ trigger }: ButtonNewBinderMockProps) =>
  trigger || null;

const binderVisibility = {
  Listed: "listed" as BinderVisibility,
  Private: "private" as BinderVisibility,
  Unlisted: "unlisted" as BinderVisibility,
};

const graphqlModuleMock = mock.module("@app/graphql", {
  namedExports: { BinderVisibility: binderVisibility },
});

const buttonNewBinderModuleMock = mock.module("@/components/ButtonNewBinder", {
  namedExports: { ButtonNewBinder: renderButtonNewBinderMock },
});

const [
  { act, createElement },
  { createRoot },
  { I18nextProvider, initReactI18next },
  { MemoryRouter },
  { BinderGallery },
  { getPublicProfileBinders },
] = await Promise.all([
  import("react"),
  import("react-dom/client"),
  import("react-i18next"),
  import("react-router"),
  import("./BinderGallery.tsx"),
  import("../pages/UserProfile.binders.ts"),
]);

const i18n = createInstance();
let root: Root | null = null;

const binder: BinderGalleryBinder = {
  cardCount: 2,
  id: "binder-id",
  name: "Public binder",
  shortId: "public-binder",
  visibility: binderVisibility.Listed,
};

before(async () => {
  await i18n.use(initReactI18next).init({
    fallbackLng: "en",
    lng: "en",
    resources: { en: { binder: enBinder, common: enCommon } },
  });
});

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 390,
  });
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
  buttonNewBinderModuleMock.restore();
  graphqlModuleMock.restore();
  dom.window.close();
});

interface RenderGalleryOptions {
  readOnly?: true;
}

const renderGallery = async ({ readOnly }: RenderGalleryOptions) => {
  const container = document.getElementById("root");
  assert.ok(container);
  root = createRoot(container);
  const galleryProps: ComponentProps<typeof BinderGallery> = {
    binders: [binder],
    onOpenSettings: () => undefined,
  };

  if (readOnly) {
    galleryProps.readOnly = true;
  }

  await act(async () => {
    root?.render(
      createElement(
        I18nextProvider,
        { i18n },
        createElement(
          MemoryRouter,
          null,
          createElement(BinderGallery, galleryProps)
        )
      )
    );
  });
};

test("renders public binders without owner controls in read-only mode", async () => {
  await renderGallery({ readOnly: true });

  assert.equal(document.querySelector('[aria-label="New Binder"]'), null);
  assert.equal(
    document.querySelector('[aria-label="Open settings for Public binder"]'),
    null
  );
  assert.ok(document.querySelector('a[href="/binder/public-binder"]'));
  assert.equal(document.body.textContent?.includes("2 cards"), true);
});

test("preserves add, visibility, and settings controls in editable mode", async () => {
  await renderGallery({});

  assert.ok(document.querySelector('[aria-label="New Binder"]'));
  assert.ok(
    document.querySelector('[aria-label="Open settings for Public binder"]')
  );
  assert.ok(document.querySelector('[aria-label="Public"]'));
});

test("keeps the two-column mobile gallery and its card shrinkable", async () => {
  await renderGallery({ readOnly: true });

  const gallery = document.querySelector('[data-slot="binder-gallery"]');
  const binderLink = document.querySelector('a[href="/binder/public-binder"]');
  assert.ok(gallery instanceof HTMLElement);
  assert.ok(binderLink instanceof HTMLElement);
  assert.equal(gallery.classList.contains("grid-cols-2"), true);
  assert.equal(gallery.classList.contains("min-w-0"), true);
  assert.equal(binderLink.classList.contains("min-w-0"), true);
  assert.equal(binderLink.parentElement?.classList.contains("min-w-0"), true);
  assert.equal(
    binderLink.firstElementChild?.classList.contains("min-w-0"),
    true
  );
});

type PublicBinderNode = NonNullable<
  PublicBindersByOwnerQuery["bindersCollection"]
>["edges"][number]["node"];

const createBinderNode = (
  id: string,
  visibility: BinderVisibility
): PublicBinderNode => ({
  binderCardCount: 2,
  binderCards: { edges: [] },
  id,
  name: `Binder ${id}`,
  shortId: `short-${id}`,
  visibility,
});

const createBindersData = (
  nodes: PublicBinderNode[]
): PublicBindersByOwnerQuery => ({
  bindersCollection: {
    edges: nodes.map((node) => ({ node })),
  },
});

test("maps only listed binders from mixed public profile query data", () => {
  const binders = getPublicProfileBinders(
    createBindersData([
      createBinderNode("listed", binderVisibility.Listed),
      createBinderNode("unlisted", binderVisibility.Unlisted),
      createBinderNode("private", binderVisibility.Private),
    ])
  );

  assert.deepEqual(
    binders.map(({ id }) => id),
    ["listed"]
  );
});

test("removes a cached binder after its normalized visibility changes", () => {
  const cachedBinder = createBinderNode("cached", binderVisibility.Listed);

  assert.equal(
    getPublicProfileBinders(createBindersData([cachedBinder])).length,
    1
  );

  cachedBinder.visibility = binderVisibility.Private;

  assert.deepEqual(
    getPublicProfileBinders(createBindersData([cachedBinder])),
    []
  );
});
