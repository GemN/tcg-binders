import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import * as ts from "typescript";

import {
  createItemListJsonLd,
  createProductJsonLd,
  type JsonLdNode,
  serializeJsonLd,
} from "./jsonLd.ts";
import {
  getCardPrintLabel,
  isSeoQueryResolved,
  resolveSeoMetadata,
  type SeoContext,
} from "./seoMetadata.ts";

test("keeps the SEO renderer free of page routing decisions", () => {
  const seoSource = readFileSync(
    new URL("../components/Seo.tsx", import.meta.url),
    "utf8"
  );
  const metadataSource = readFileSync(
    new URL("./seoMetadata.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(seoSource, /\bkind\b|switch\s*\(|buildSeoDocument/);
  assert.doesNotMatch(seoSource, /createElement/);
  assert.doesNotMatch(
    metadataSource,
    /type\s+SeoPage\b|buildSeoDocument|switch\s*\(\s*page/
  );
  assert.match(seoSource, /metadata:\s*SeoMetadata/);
  assert.equal(
    existsSync(new URL("./seo.tsx", import.meta.url)),
    false,
    "the obsolete lib SEO component must be removed"
  );
  assert.equal(
    existsSync(new URL("./seoHead.ts", import.meta.url)),
    false,
    "the obsolete head renderer must be removed"
  );
});

interface TsxSourceFileInput {
  relativePath: string;
}

const readTsxSourceFile = ({
  relativePath,
}: TsxSourceFileInput): ts.SourceFile => {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");

  return ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
};

interface NodeContainsJsxTagInput {
  node: ts.Node;
  tagName: string;
}

const nodeContainsJsxTag = ({
  node,
  tagName,
}: NodeContainsJsxTagInput): boolean => {
  let containsTag = false;

  const visit = (child: ts.Node) => {
    const jsxTagName = ts.isJsxElement(child)
      ? child.openingElement.tagName
      : ts.isJsxSelfClosingElement(child)
        ? child.tagName
        : null;

    if (jsxTagName && ts.isIdentifier(jsxTagName) && jsxTagName.text === tagName) {
      containsTag = true;
      return;
    }

    ts.forEachChild(child, visit);
  };

  visit(node);
  return containsTag;
};

interface LoadingBranchInput {
  sourceFile: ts.SourceFile;
}

const getLoadingBranches = ({
  sourceFile,
}: LoadingBranchInput): ts.IfStatement[] => {
  const loadingBranches: ts.IfStatement[] = [];

  const visit = (node: ts.Node) => {
    if (
      ts.isIfStatement(node) &&
      nodeContainsJsxTag({ node: node.thenStatement, tagName: "Loading" })
    ) {
      loadingBranches.push(node);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return loadingBranches;
};

interface SeoComponentStructure {
  body: ts.Block;
  contentDeclaration: ts.VariableDeclaration;
  sourceFile: ts.SourceFile;
}

const getSeoComponentStructure = (): SeoComponentStructure => {
  const sourceFile = readTsxSourceFile({
    relativePath: "../components/Seo.tsx",
  });
  let seoComponent: ts.ArrowFunction | undefined;

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "Seo" &&
        declaration.initializer &&
        ts.isArrowFunction(declaration.initializer)
      ) {
        seoComponent = declaration.initializer;
      }
    }
  }

  assert.ok(seoComponent, "Seo must remain an arrow function");
  assert.ok(
    seoComponent.type &&
      ts.isArrayTypeNode(seoComponent.type) &&
      ts.isTypeReferenceNode(seoComponent.type.elementType) &&
      ts.isIdentifier(seoComponent.type.elementType.typeName) &&
      seoComponent.type.elementType.typeName.text === "ReactElement",
    "Seo must return ReactElement[]"
  );
  assert.ok(ts.isBlock(seoComponent.body), "Seo must have a block body");

  let contentDeclaration: ts.VariableDeclaration | undefined;

  for (const statement of seoComponent.body.statements) {
    if (!ts.isVariableStatement(statement)) continue;

    contentDeclaration = statement.declarationList.declarations.find(
      (declaration) =>
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "content"
    );
    if (contentDeclaration) break;
  }

  assert.ok(contentDeclaration, "Seo must declare its content array");

  return {
    body: seoComponent.body,
    contentDeclaration,
    sourceFile,
  };
};

interface JsxElementsInput {
  node: ts.Node;
  tagName: string;
}

const getJsxElements = ({
  node,
  tagName,
}: JsxElementsInput): Array<ts.JsxElement | ts.JsxSelfClosingElement> => {
  const elements: Array<ts.JsxElement | ts.JsxSelfClosingElement> = [];

  const visit = (child: ts.Node) => {
    if (
      ts.isJsxElement(child) &&
      ts.isIdentifier(child.openingElement.tagName) &&
      child.openingElement.tagName.text === tagName
    ) {
      elements.push(child);
    }

    if (
      ts.isJsxSelfClosingElement(child) &&
      ts.isIdentifier(child.tagName) &&
      child.tagName.text === tagName
    ) {
      elements.push(child);
    }

    ts.forEachChild(child, visit);
  };

  visit(node);
  return elements;
};

test("renders declarative metadata as an explicit JSX content list", () => {
  const { body, contentDeclaration, sourceFile } =
    getSeoComponentStructure();

  assert.ok(
    contentDeclaration.type &&
      ts.isArrayTypeNode(contentDeclaration.type) &&
      contentDeclaration.initializer &&
      ts.isArrayLiteralExpression(contentDeclaration.initializer),
    "content must be an explicitly typed JSX array"
  );

  const [titleElement] = contentDeclaration.initializer.elements;

  assert.ok(
    titleElement &&
      ts.isJsxElement(titleElement) &&
      ts.isIdentifier(titleElement.openingElement.tagName) &&
      titleElement.openingElement.tagName.text === "title",
    "content must begin with a title element"
  );
  assert.ok(
    titleElement.children.some(
      (child) =>
        ts.isJsxExpression(child) &&
        child.expression &&
        ts.isIdentifier(child.expression) &&
        child.expression.text === "title"
    ),
    "the title element must render the derived title"
  );

  for (const tagName of ["meta", "link", "script"]) {
    assert.ok(
      getJsxElements({ node: body, tagName }).length > 0,
      `Seo must contain explicit <${tagName}> JSX`
    );
  }

  assert.ok(
    body.statements.some(
      (statement) =>
        ts.isReturnStatement(statement) &&
        statement.expression &&
        ts.isIdentifier(statement.expression) &&
        statement.expression.text === "content"
    ),
    "Seo must return the content array"
  );
  assert.doesNotMatch(sourceFile.text, /createElement/);
});

test("wires resolved SEO metadata into optional JSX sections", () => {
  const { body, sourceFile } = getSeoComponentStructure();
  const source = sourceFile.text;

  assert.match(source, /useTranslation\s*\(\s*\)/);
  assert.match(
    source,
    /resolveSeoMetadata\s*\(\s*\{[\s\S]*language:\s*i18n\.language[\s\S]*metadata[\s\S]*origin:\s*window\.location\.origin/
  );
  assert.match(source, /document\.documentElement\.lang\s*=\s*locale/);

  for (const tagName of ["meta", "link", "script"]) {
    assert.ok(
      getJsxElements({ node: body, tagName }).length > 0,
      `Seo must append explicit <${tagName}> JSX`
    );
  }

  assert.match(source, /type="application\/ld\+json"/);
  assert.match(source, /dangerouslySetInnerHTML=/);
  assert.match(source, /serializeJsonLd\s*\(\s*jsonLd\s*\)/);
  assert.doesNotMatch(source, /metadata\.(?:locale|canonicalUrl|social)\b/);
});

test("resolves an absolute canonical URL, English social values, and one brand", () => {
  const resolved = resolveSeoMetadata({
    language: "en-US",
    metadata: {
      canonicalPath: "/binder/ABC123?public=true&sort=name#cards",
      description: "Browse an MTG binder.",
      title: "Modern Staples by gem - MTG",
    },
    origin: "https://megabinder.example",
  });

  assert.equal(
    resolved.canonicalUrl,
    "https://megabinder.example/binder/ABC123"
  );
  assert.equal(resolved.locale, "en");
  assert.equal(
    resolved.title,
    "Modern Staples by gem - MTG | MegaBinder"
  );
  assert.equal(resolved.social?.locale, "en_GB");
  assert.equal(
    resolved.social?.imageUrl,
    "https://megabinder.example/bg-home.jpg"
  );
  assert.equal(resolved.social?.title, resolved.title);
});

test("resolves Thai social locale and an absolute page image URL", () => {
  const resolved = resolveSeoMetadata({
    language: "th-TH",
    metadata: {
      canonicalPath: "/card/card-id",
      description: "รายละเอียดการ์ด",
      imagePath: "/black-lotus.jpg",
      title: "รายละเอียด Black Lotus",
    },
    origin: "https://megabinder.example",
  });

  assert.equal(resolved.locale, "th");
  assert.equal(resolved.social?.locale, "th_TH");
  assert.equal(
    resolved.social?.imageUrl,
    "https://megabinder.example/black-lotus.jpg"
  );
});

test("uses the raw short title when the branded preferred title is too long", () => {
  const longTitle = `${"A".repeat(80)} by seller - MTG`;
  const shortTitle = "Modern Staples - MTG";
  const resolved = resolveSeoMetadata({
    language: "en",
    metadata: {
      shortTitle,
      title: longTitle,
    },
    origin: "https://megabinder.example",
  });

  assert.equal(resolved.title, `${shortTitle} | MegaBinder`);
});

test("omits unresolved optional metadata", () => {
  const resolved = resolveSeoMetadata({
    language: "en",
    metadata: {
      title: "Page Not Found",
    },
    origin: "https://megabinder.example",
  });

  assert.equal(resolved.canonicalUrl, undefined);
  assert.equal(resolved.description, undefined);
  assert.equal(resolved.jsonLd, undefined);
  assert.equal(resolved.robots, undefined);
  assert.equal(resolved.social, undefined);
});

test("passes exact final context to the page JSON-LD definition", () => {
  let receivedContext: SeoContext | undefined;
  const jsonLdNode: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "WebPage",
  };
  const resolved = resolveSeoMetadata({
    language: "th",
    metadata: {
      canonicalPath: "/card/card-id?finish=foil#listings",
      jsonLd: (context) => {
        receivedContext = context;
        return jsonLdNode;
      },
      title: "รายละเอียด Black Lotus",
    },
    origin: "https://megabinder.example",
  });

  assert.deepEqual(receivedContext, {
    canonicalUrl: "https://megabinder.example/card/card-id",
    locale: "th",
    origin: "https://megabinder.example",
    title: "รายละเอียด Black Lotus | MegaBinder",
  });
  assert.equal(resolved.jsonLd, jsonLdNode);
});

test("keeps route and unresolved page loading fallbacks visual-only", () => {
  const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
  const pagePaths = [
    "../pages/BinderPage.tsx",
    "../pages/CardPage.tsx",
    "../pages/CardAllListingsPage.tsx",
    "../pages/CardVariantsPage.tsx",
    "../pages/UserProfile.tsx",
    "../pages/settings/SettingsUserProfile.tsx",
  ];

  assert.doesNotMatch(
    appSource,
    /<Seo\b|createRouteLoadingSeoMetadata|loadingFallback/
  );
  assert.match(appSource, /<Suspense fallback=\{<RouteLoading \/>\}>/);

  for (const relativePath of pagePaths) {
    const sourceFile = readTsxSourceFile({ relativePath });
    const loadingBranches = getLoadingBranches({ sourceFile });

    assert.equal(
      loadingBranches.length,
      1,
      `${relativePath} must have one unresolved loading branch`
    );
    assert.equal(
      nodeContainsJsxTag({
        node: loadingBranches[0].thenStatement,
        tagName: "Seo",
      }),
      false,
      `${relativePath} must not render Seo while unresolved`
    );
  }
});

test("keeps query errors unresolved while recognizing responses", () => {
  assert.equal(
    isSeoQueryResolved({
      hasError: false,
      hasResponse: false,
      isLoading: true,
    }),
    false
  );
  assert.equal(
    isSeoQueryResolved({
      hasError: true,
      hasResponse: true,
      isLoading: false,
    }),
    false
  );
  assert.equal(
    isSeoQueryResolved({
      hasError: false,
      hasResponse: true,
      isLoading: false,
    }),
    true
  );
});

test("supports sparse card print metadata", () => {
  assert.equal(
    getCardPrintLabel({
      id: "sparse-card",
      name: "Black Lotus",
    }),
    null
  );
  assert.equal(
    getCardPrintLabel({
      collectorNumber: "232",
      id: "card-id",
      name: "Black Lotus",
      setCode: "lea",
    }),
    "LEA #232"
  );
});

test("preserves one static fallback and hands it to React ownership", () => {
  const indexHtml = readFileSync(
    new URL("../../index.html", import.meta.url),
    "utf8"
  );
  const mainSource = readFileSync(new URL("../main.tsx", import.meta.url), "utf8");
  const titleTags =
    indexHtml.match(/<title(?:\s[^>]*)?>.*?<\/title>/g) || [];

  assert.deepEqual(titleTags, [
    "<title data-seo-fallback>Share Your MTG Binder | MegaBinder</title>",
  ]);
  assert.match(
    mainSource,
    /document\.querySelector\(\s*"title\[data-seo-fallback\]"\s*\)\?\.remove\(\)/
  );
  assert.doesNotMatch(
    mainSource,
    /removeSeoFallbackTitle|SEO_FALLBACK_TITLE/
  );
});

test("only emits valid, available Offers", () => {
  const itemList = createItemListJsonLd(
    [
      {
        id: "valid",
        name: "Valid",
        offer: { currency: "THB", price: "100", quantity: 2 },
      },
      {
        id: "missing-price",
        name: "Missing price",
        offer: { currency: "THB", price: null, quantity: 1 },
      },
      {
        id: "unavailable",
        name: "Unavailable",
        offer: { currency: "THB", price: "50", quantity: 0 },
      },
      {
        id: "blank-price",
        name: "Blank price",
        offer: { currency: "THB", price: "", quantity: 1 },
      },
    ],
    "https://megabinder.example"
  );
  const serialized = serializeJsonLd(itemList);

  assert.equal(serialized.match(/"offers"/g)?.length, 1);
  assert.match(serialized, /"price":"100"/);
  assert.doesNotMatch(serialized, /"price":"null"/);
});

test("creates card Product schema without page-specific branching", () => {
  const jsonLd = createProductJsonLd(
    {
      id: "card-id",
      imageUrl: "/card.jpg",
      name: "Black Lotus",
    },
    "https://megabinder.example"
  );

  assert.equal(jsonLd["@type"], "Product");
  assert.equal(jsonLd.url, "https://megabinder.example/card/card-id");
  assert.equal(jsonLd.image, "https://megabinder.example/card.jpg");
});

test("escapes hostile script content in JSON-LD", () => {
  const serialized = serializeJsonLd({
    "@type": "Thing",
    name: "</script><script>alert('xss')</script>",
  } as JsonLdNode);

  assert.doesNotMatch(serialized, /<\/script>/i);
  assert.match(serialized, /\\u003c\/script\\u003e/i);
});
