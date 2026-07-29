type JsonLdPrimitive = boolean | number | string | null;
type JsonLdValue = JsonLdNode | JsonLdPrimitive | JsonLdValue[];

export interface JsonLdNode {
  [key: string]: JsonLdValue;
}

export interface SeoOfferInput {
  currency: string | null | undefined;
  price: number | string | null | undefined;
  quantity: number | null | undefined;
}

export interface SeoProductInput {
  collectorNumber?: string | null;
  id: string;
  imageUrl?: string | null;
  name: string;
  offer?: SeoOfferInput;
  setCode?: string | null;
}

const getJsonLdAbsoluteUrl = (
  pathOrUrl: string,
  origin: string
): string => {
  if (!origin) return pathOrUrl;

  return new URL(pathOrUrl, origin).toString();
};

export const createProductJsonLd = (
  product: SeoProductInput,
  origin: string
): JsonLdNode => {
  const productUrl = getJsonLdAbsoluteUrl(
    `/card/${product.id}`,
    origin
  );
  const jsonLd: JsonLdNode = {
    "@id": `${productUrl}#product`,
    "@type": "Product",
    category: "Magic: The Gathering card",
    name: product.name,
    sku: product.id,
    url: productUrl,
  };

  if (product.imageUrl) {
    jsonLd.image = getJsonLdAbsoluteUrl(product.imageUrl, origin);
  }

  const offerPrice = product.offer?.price;
  const hasOfferPrice =
    typeof offerPrice === "number" ||
    (typeof offerPrice === "string" && offerPrice.trim().length > 0);
  const price = Number(offerPrice);
  const quantity = product.offer?.quantity;
  if (
    hasOfferPrice &&
    Number.isFinite(price) &&
    price >= 0 &&
    product.offer?.currency &&
    quantity !== null &&
    quantity !== undefined &&
    quantity > 0
  ) {
    jsonLd.offers = {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      inventoryLevel: {
        "@type": "QuantitativeValue",
        value: quantity,
      },
      price: String(offerPrice),
      priceCurrency: product.offer.currency,
      url: productUrl,
    };
  }

  return jsonLd;
};

export const createItemListJsonLd = (
  products: SeoProductInput[],
  origin: string
): JsonLdNode => ({
  "@type": "ItemList",
  itemListElement: products.map((product, index) => ({
    "@type": "ListItem",
    item: createProductJsonLd(product, origin),
    position: index + 1,
  })),
});

export const serializeJsonLd = (jsonLd: JsonLdNode): string =>
  JSON.stringify(jsonLd)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
