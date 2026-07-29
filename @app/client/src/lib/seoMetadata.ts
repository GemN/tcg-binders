import type { JsonLdNode, SeoProductInput } from "./jsonLd.ts";

export const SEO_BRAND = "MegaBinder";
export const SEO_DEFAULT_SOCIAL_IMAGE_PATH = "/bg-home.jpg";

const MAX_DYNAMIC_TITLE_LENGTH = 65;

export type SeoLocale = "en" | "th";
export type SeoRobots = "index,follow" | "noindex,follow";

export interface SeoContext {
  canonicalUrl: string;
  locale: SeoLocale;
  origin: string;
  title: string;
}

export type SeoJsonLdDefinition = (context: SeoContext) => JsonLdNode;

export interface SeoMetadata {
  canonicalPath?: string;
  description?: string;
  imagePath?: string | null;
  jsonLd?: SeoJsonLdDefinition;
  robots?: SeoRobots;
  shortTitle?: string;
  title: string;
}

export interface ResolveSeoMetadataInput {
  language: string;
  metadata: SeoMetadata;
  origin: string;
}

export interface ResolvedSeoSocialMetadata {
  description: string;
  imageAlt: string;
  imageUrl: string;
  locale: string;
  title: string;
  url: string;
}

export interface ResolvedSeoMetadata {
  canonicalUrl?: string;
  description?: string;
  jsonLd?: JsonLdNode;
  locale: SeoLocale;
  robots?: SeoRobots;
  social?: ResolvedSeoSocialMetadata;
  title: string;
}

export interface SeoQueryResolutionInput {
  hasError: boolean;
  hasResponse: boolean;
  isLoading: boolean;
}

export const resolveSeoMetadata = ({
  language,
  metadata,
  origin,
}: ResolveSeoMetadataInput): ResolvedSeoMetadata => {
  const locale: SeoLocale = language.startsWith("th") ? "th" : "en";
  const preferredTitle = `${metadata.title} | ${SEO_BRAND}`;
  const title =
    preferredTitle.length <= MAX_DYNAMIC_TITLE_LENGTH || !metadata.shortTitle
      ? preferredTitle
      : `${metadata.shortTitle} | ${SEO_BRAND}`;
  let canonicalUrl: string | undefined;

  if (metadata.canonicalPath) {
    const canonical = new URL(metadata.canonicalPath, origin);
    canonical.hash = "";
    canonical.search = "";
    canonicalUrl = canonical.toString();
  }

  const context: SeoContext | undefined = canonicalUrl
    ? {
        canonicalUrl,
        locale,
        origin,
        title,
      }
    : undefined;
  const social: ResolvedSeoSocialMetadata | undefined =
    metadata.description && canonicalUrl
      ? {
          description: metadata.description,
          imageAlt: title,
          imageUrl: new URL(
            metadata.imagePath || SEO_DEFAULT_SOCIAL_IMAGE_PATH,
            origin
          ).toString(),
          locale: locale === "th" ? "th_TH" : "en_GB",
          title,
          url: canonicalUrl,
        }
      : undefined;

  return {
    canonicalUrl,
    description: metadata.description,
    jsonLd:
      metadata.jsonLd && context ? metadata.jsonLd(context) : undefined,
    locale,
    robots: metadata.robots,
    social,
    title,
  };
};

export const isSeoQueryResolved = ({
  hasError,
  hasResponse,
  isLoading,
}: SeoQueryResolutionInput): boolean =>
  !isLoading && !hasError && hasResponse;

export const getCardPrintLabel = (
  product: SeoProductInput
): string | null => {
  if (!product.setCode || !product.collectorNumber) return null;

  return `${product.setCode.toUpperCase()} #${product.collectorNumber}`;
};
