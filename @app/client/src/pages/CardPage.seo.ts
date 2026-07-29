import type { SeoProductInput } from "../lib/jsonLd.ts";
import type { SeoMetadata } from "../lib/seoMetadata.ts";
import { createCardPageJsonLd } from "./CardPage.jsonLd.ts";

export interface CardSeoProduct extends SeoProductInput {
  setName?: string | null;
}

export interface CardSeoContent {
  description?: string;
  notFoundTitle: string;
  shortTitle: string;
  title: string;
}

export interface CardSeoMetadataInput {
  canonicalPath: string;
  content: CardSeoContent;
  isResolved: boolean;
  product?: CardSeoProduct;
}

export const createCardSeoMetadata = ({
  canonicalPath,
  content,
  isResolved,
  product,
}: CardSeoMetadataInput): SeoMetadata => {
  if (isResolved && !product) {
    return {
      robots: "noindex,follow",
      title: content.notFoundTitle,
    };
  }

  const jsonLd =
    isResolved && product
      ? createCardPageJsonLd({
          description: content.description || "",
          product,
        })
      : undefined;

  return {
    canonicalPath,
    description: content.description,
    imagePath: product?.imageUrl,
    jsonLd,
    robots: isResolved ? "index,follow" : undefined,
    shortTitle: content.shortTitle,
    title: content.title,
  };
};
