import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import * as ts from "typescript";

import { serializeJsonLd } from "../lib/jsonLd.ts";
import type { SeoContext } from "../lib/seoMetadata.ts";
import { createBinderPageJsonLd } from "./BinderPage.jsonLd.ts";
import { createCardAllListingsPageJsonLd } from "./CardAllListingsPage.jsonLd.ts";
import { createCardPageJsonLd } from "./CardPage.jsonLd.ts";
import { createCardVariantsPageJsonLd } from "./CardVariantsPage.jsonLd.ts";
import { createHomeJsonLd } from "./Home.jsonLd.ts";

const canonicalUrl = "https://megabinder.example/card/card-id";
const origin = "https://megabinder.example";
const products = [
  {
    id: "card-id",
    imageUrl: "/card.jpg",
    name: "Black Lotus",
    offer: {
      currency: "THB",
      price: "100",
      quantity: 1,
    },
  },
];

const createSeoContext = (
  contextCanonicalUrl: string,
  title: string
): SeoContext => ({
  canonicalUrl: contextCanonicalUrl,
  locale: "en",
  origin,
  title,
});

interface SourceFileInput {
  fileName: string;
}

const readSourceFile = ({ fileName }: SourceFileInput): ts.SourceFile => {
  const source = readFileSync(
    new URL(`./${fileName}`, import.meta.url),
    "utf8"
  );
  const scriptKind = fileName.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;

  return ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
};

interface ImportedLocalNameInput {
  exportedName: string;
  sourceFile: ts.SourceFile;
}

const getImportedLocalName = ({
  exportedName,
  sourceFile,
}: ImportedLocalNameInput): string => {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;

    const namedImports = statement.importClause?.namedBindings;
    if (!namedImports || !ts.isNamedImports(namedImports)) continue;

    for (const element of namedImports.elements) {
      const importedName = element.propertyName?.text || element.name.text;
      if (importedName === exportedName) return element.name.text;
    }
  }

  assert.fail(`${sourceFile.fileName} must import ${exportedName}`);
};

interface NodeCallInput {
  localName: string;
  node: ts.Node;
}

const nodeContainsCall = ({
  localName,
  node,
}: NodeCallInput): boolean => {
  let hasCall = false;

  const visit = (child: ts.Node) => {
    if (
      ts.isCallExpression(child) &&
      ts.isIdentifier(child.expression) &&
      child.expression.text === localName
    ) {
      hasCall = true;
      return;
    }

    ts.forEachChild(child, visit);
  };

  visit(node);
  return hasCall;
};

const getPropertyName = (
  name: ts.PropertyName | ts.BindingName
): string | null => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }

  return null;
};

interface JsonLdWiringInput {
  definitionLocalName: string;
  sourceFile: ts.SourceFile;
}

const hasJsonLdWiring = ({
  definitionLocalName,
  sourceFile,
}: JsonLdWiringInput): boolean => {
  const definitionBindings = new Set<string>();
  let isWired = false;

  const collectBindings = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      nodeContainsCall({
        localName: definitionLocalName,
        node: node.initializer,
      })
    ) {
      definitionBindings.add(node.name.text);
    }

    ts.forEachChild(node, collectBindings);
  };

  const findJsonLdProperty = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && getPropertyName(node.name) === "jsonLd") {
      if (
        nodeContainsCall({
          localName: definitionLocalName,
          node: node.initializer,
        }) ||
        (ts.isIdentifier(node.initializer) &&
          definitionBindings.has(node.initializer.text))
      ) {
        isWired = true;
        return;
      }
    }

    if (
      ts.isShorthandPropertyAssignment(node) &&
      node.name.text === "jsonLd" &&
      definitionBindings.has(node.name.text)
    ) {
      isWired = true;
      return;
    }

    ts.forEachChild(node, findJsonLdProperty);
  };

  collectBindings(sourceFile);
  findJsonLdProperty(sourceFile);
  return isWired;
};

interface JsonLdMetadataBindingInput {
  definitionLocalName: string;
  sourceFile: ts.SourceFile;
}

const getJsonLdMetadataBinding = ({
  definitionLocalName,
  sourceFile,
}: JsonLdMetadataBindingInput): string => {
  let binding: string | null = null;

  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      const jsonLdProperty = node.initializer.properties.find(
        (property) =>
          ts.isPropertyAssignment(property) &&
          getPropertyName(property.name) === "jsonLd"
      );
      if (
        jsonLdProperty &&
        ts.isPropertyAssignment(jsonLdProperty) &&
        nodeContainsCall({
          localName: definitionLocalName,
          node: jsonLdProperty.initializer,
        })
      ) {
        binding = node.name.text;
        return;
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  if (binding) return binding;

  assert.fail(
    `${sourceFile.fileName} must assign its page definition to metadata.jsonLd`
  );
};

interface CallInitializedBindingInput {
  callLocalName: string;
  sourceFile: ts.SourceFile;
}

const getCallInitializedBinding = ({
  callLocalName,
  sourceFile,
}: CallInitializedBindingInput): string => {
  let binding: string | null = null;

  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === callLocalName
    ) {
      binding = node.name.text;
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  if (binding) return binding;

  assert.fail(
    `${sourceFile.fileName} must bind the page SEO helper result`
  );
};

interface SeoMetadataConsumerInput {
  metadataBinding: string;
  sourceFile: ts.SourceFile;
}

const hasSeoMetadataConsumer = ({
  metadataBinding,
  sourceFile,
}: SeoMetadataConsumerInput): boolean => {
  const seoLocalName = getImportedLocalName({
    exportedName: "Seo",
    sourceFile,
  });
  let hasConsumer = false;

  const visit = (node: ts.Node) => {
    const isSeoElement =
      (ts.isJsxOpeningElement(node) ||
        ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      node.tagName.text === seoLocalName;

    if (
      isSeoElement &&
      node.attributes.properties.some((attribute) => {
        if (
          !ts.isJsxAttribute(attribute) ||
          attribute.name.getText(sourceFile) !== "metadata" ||
          !attribute.initializer ||
          !ts.isJsxExpression(attribute.initializer)
        ) {
          return false;
        }

        return (
          !!attribute.initializer.expression &&
          ts.isIdentifier(attribute.initializer.expression) &&
          attribute.initializer.expression.text === metadataBinding
        );
      })
    ) {
      hasConsumer = true;
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return hasConsumer;
};

test("defines the Home WebSite schema through its page interface", () => {
  const definition = createHomeJsonLd({
    description: "Create and share an MTG binder.",
    name: "MegaBinder",
  });
  const jsonLd = definition(
    createSeoContext(`${origin}/`, "Create an MTG Binder | MegaBinder")
  );

  assert.equal(jsonLd["@context"], "https://schema.org");
  assert.equal(jsonLd["@type"], "WebSite");
  assert.equal(jsonLd.url, `${origin}/`);
});

test("defines the listed Binder CollectionPage and ItemList schema", () => {
  const definition = createBinderPageJsonLd({
    cardCount: 84,
    description: "Browse 84 cards.",
    products,
  });
  const jsonLd = definition(
    createSeoContext(
      `${origin}/binder/ABC123`,
      "Modern Staples by gem - MTG | MegaBinder"
    )
  );
  const serialized = serializeJsonLd(jsonLd);

  assert.equal(jsonLd["@type"], "CollectionPage");
  assert.match(serialized, /"@type":"ItemList"/);
  assert.match(serialized, /"numberOfItems":84/);
  assert.match(serialized, /"@type":"Offer"/);
});

test("defines the Card WebPage and Product graph schema", () => {
  const definition = createCardPageJsonLd({
    description: "View Black Lotus card details.",
    product: products[0],
  });
  const jsonLd = definition(
    createSeoContext(canonicalUrl, "Black Lotus - MTG Prices | MegaBinder")
  );
  const serialized = serializeJsonLd(jsonLd);

  assert.equal(jsonLd["@context"], "https://schema.org");
  assert.match(serialized, /"@type":"WebPage"/);
  assert.match(serialized, /"@type":"Product"/);
  assert.match(serialized, /#product/);
});

test("defines listings and variants CollectionPage schemas separately", () => {
  const listingsDefinition = createCardAllListingsPageJsonLd({
    description: "Compare listings.",
    products,
  });
  const variantsDefinition = createCardVariantsPageJsonLd({
    description: "Browse variants.",
    products,
  });
  const listings = listingsDefinition(
    createSeoContext(
      `${canonicalUrl}/listings`,
      "Black Lotus for Sale | MegaBinder"
    )
  );
  const variants = variantsDefinition(
    createSeoContext(
      `${canonicalUrl}/variants`,
      "Black Lotus Variants | MegaBinder"
    )
  );

  assert.equal(listings["@type"], "CollectionPage");
  assert.equal(variants["@type"], "CollectionPage");
  assert.match(serializeJsonLd(listings), /"@type":"ItemList"/);
  assert.match(serializeJsonLd(variants), /"@type":"ItemList"/);
});

test("keeps page schema definitions out of page and SEO metadata files", () => {
  const schemaConsumerFiles = [
    "Home.tsx",
    "BinderPage.tsx",
    "BinderPage.seo.ts",
    "CardPage.tsx",
    "CardPage.seo.ts",
    "CardAllListingsPage.tsx",
    "CardVariantsPage.tsx",
  ];

  schemaConsumerFiles.forEach((fileName) => {
    const source = readFileSync(
      new URL(`./${fileName}`, import.meta.url),
      "utf8"
    );

    assert.doesNotMatch(source, /"@context"\s*:/, fileName);
    assert.doesNotMatch(
      source,
      /"@type"\s*:\s*"(WebSite|CollectionPage|WebPage)"/,
      fileName
    );
  });
});

test("wires every page definition into metadata rendered by Seo", () => {
  const home = readSourceFile({ fileName: "Home.tsx" });
  const listings = readSourceFile({
    fileName: "CardAllListingsPage.tsx",
  });
  const variants = readSourceFile({ fileName: "CardVariantsPage.tsx" });

  [
    {
      definitionName: "createHomeJsonLd",
      sourceFile: home,
    },
    {
      definitionName: "createCardAllListingsPageJsonLd",
      sourceFile: listings,
    },
    {
      definitionName: "createCardVariantsPageJsonLd",
      sourceFile: variants,
    },
  ].forEach(({ definitionName, sourceFile }) => {
    const definitionLocalName = getImportedLocalName({
      exportedName: definitionName,
      sourceFile,
    });

    const metadataBinding = getJsonLdMetadataBinding({
      definitionLocalName,
      sourceFile,
    });

    assert.equal(
      hasSeoMetadataConsumer({ metadataBinding, sourceFile }),
      true,
      `${sourceFile.fileName} must render its JSON-LD metadata binding`
    );
  });

  [
    {
      definitionName: "createBinderPageJsonLd",
      helperFileName: "BinderPage.seo.ts",
      metadataHelperName: "createBinderPageSeoMetadata",
      pageFileName: "BinderPage.tsx",
    },
    {
      definitionName: "createCardPageJsonLd",
      helperFileName: "CardPage.seo.ts",
      metadataHelperName: "createCardSeoMetadata",
      pageFileName: "CardPage.tsx",
    },
  ].forEach(
    ({
      definitionName,
      helperFileName,
      metadataHelperName,
      pageFileName,
    }) => {
      const helperSourceFile = readSourceFile({
        fileName: helperFileName,
      });
      const pageSourceFile = readSourceFile({ fileName: pageFileName });
      const definitionLocalName = getImportedLocalName({
        exportedName: definitionName,
        sourceFile: helperSourceFile,
      });
      const metadataHelperLocalName = getImportedLocalName({
        exportedName: metadataHelperName,
        sourceFile: pageSourceFile,
      });
      const metadataBinding = getCallInitializedBinding({
        callLocalName: metadataHelperLocalName,
        sourceFile: pageSourceFile,
      });

      assert.equal(
        hasJsonLdWiring({
          definitionLocalName,
          sourceFile: helperSourceFile,
        }),
        true,
        `${helperFileName} must assign ${definitionName} to jsonLd`
      );
      assert.equal(
        hasSeoMetadataConsumer({
          metadataBinding,
          sourceFile: pageSourceFile,
        }),
        true,
        `${pageFileName} must render the ${metadataHelperName} result`
      );
    }
  );
});
