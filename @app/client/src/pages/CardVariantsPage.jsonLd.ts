import {
  createItemListJsonLd,
  type SeoProductInput,
} from "../lib/jsonLd.ts";
import type { SeoJsonLdDefinition } from "../lib/seoMetadata.ts";

export interface CardVariantsPageJsonLdInput {
  description: string;
  products: SeoProductInput[];
}

export const createCardVariantsPageJsonLd = ({
  description,
  products,
}: CardVariantsPageJsonLdInput): SeoJsonLdDefinition =>
  ({ canonicalUrl, locale, origin, title }) => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    description,
    inLanguage: locale,
    mainEntity: createItemListJsonLd(products, origin),
    name: title,
    url: canonicalUrl,
  });
