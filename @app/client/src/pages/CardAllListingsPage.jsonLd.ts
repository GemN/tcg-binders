import {
  createItemListJsonLd,
  type SeoProductInput,
} from "../lib/jsonLd.ts";
import type { SeoJsonLdDefinition } from "../lib/seoMetadata.ts";

export interface CardAllListingsPageJsonLdInput {
  description: string;
  products: SeoProductInput[];
}

export const createCardAllListingsPageJsonLd = ({
  description,
  products,
}: CardAllListingsPageJsonLdInput): SeoJsonLdDefinition =>
  ({ canonicalUrl, locale, origin, title }) => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    description,
    inLanguage: locale,
    mainEntity: createItemListJsonLd(products, origin),
    name: title,
    url: canonicalUrl,
  });
