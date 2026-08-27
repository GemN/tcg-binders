import {
  createItemListJsonLd,
  type SeoProductInput,
} from "../lib/jsonLd.ts";
import type { SeoJsonLdDefinition } from "../lib/seoMetadata.ts";

export interface CardPrintingsPageJsonLdInput {
  description: string;
  products: SeoProductInput[];
}

export const createCardPrintingsPageJsonLd = ({
  description,
  products,
}: CardPrintingsPageJsonLdInput): SeoJsonLdDefinition =>
  ({ canonicalUrl, locale, origin, title }) => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    description,
    inLanguage: locale,
    mainEntity: createItemListJsonLd(products, origin),
    name: title,
    url: canonicalUrl,
  });
