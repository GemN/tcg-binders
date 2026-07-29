import type { SeoJsonLdDefinition } from "../lib/seoMetadata.ts";

export interface HomeJsonLdInput {
  description: string;
  name: string;
}

export const createHomeJsonLd = ({
  description,
  name,
}: HomeJsonLdInput): SeoJsonLdDefinition =>
  ({ canonicalUrl, locale }) => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    description,
    inLanguage: locale,
    name,
    url: canonicalUrl,
  });
