import {
  createItemListJsonLd,
  type SeoProductInput,
} from "../lib/jsonLd.ts";
import type { SeoJsonLdDefinition } from "../lib/seoMetadata.ts";

export interface BinderPageJsonLdInput {
  cardCount?: number | null;
  description: string;
  products: SeoProductInput[];
}

export const createBinderPageJsonLd = ({
  cardCount,
  description,
  products,
}: BinderPageJsonLdInput): SeoJsonLdDefinition =>
  ({ canonicalUrl, locale, origin, title }) => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    description,
    inLanguage: locale,
    ...(products.length
      ? {
          mainEntity: {
            ...createItemListJsonLd(products, origin),
            numberOfItems: cardCount ?? products.length,
          },
        }
      : {}),
    name: title,
    url: canonicalUrl,
  });
