import {
  createProductJsonLd,
  type JsonLdNode,
  type SeoProductInput,
} from "../lib/jsonLd.ts";
import type { SeoJsonLdDefinition } from "../lib/seoMetadata.ts";

export interface CardPageJsonLdInput {
  description: string;
  product: SeoProductInput;
}

export const createCardPageJsonLd = ({
  description,
  product,
}: CardPageJsonLdInput): SeoJsonLdDefinition =>
  ({ canonicalUrl, locale, origin, title }) => {
    const productJsonLd = createProductJsonLd(product, origin);
    const pageNode: JsonLdNode = {
      "@id": `${canonicalUrl}#page`,
      "@type": "WebPage",
      description,
      inLanguage: locale,
      mainEntity: {
        "@id": `${canonicalUrl}#product`,
      },
      name: title,
      url: canonicalUrl,
    };
    const productNode: JsonLdNode = {
      ...productJsonLd,
      "@id": `${canonicalUrl}#product`,
      url: canonicalUrl,
    };

    return {
      "@context": "https://schema.org",
      "@graph": [pageNode, productNode],
    };
  };
