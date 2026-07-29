import { type ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { serializeJsonLd } from "@/lib/jsonLd";
import {
  resolveSeoMetadata,
  SEO_BRAND,
  type SeoMetadata,
} from "@/lib/seoMetadata";

interface SeoProps {
  metadata: SeoMetadata;
}

export const Seo = ({ metadata }: SeoProps): ReactElement[] => {
  const { i18n } = useTranslation();
  const {
    canonicalUrl,
    description,
    jsonLd,
    locale,
    robots,
    social,
    title,
  } = resolveSeoMetadata({
    language: i18n.language,
    metadata,
    origin: window.location.origin,
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const content: ReactElement[] = [<title key="title">{title}</title>];

  if (description) {
    content.push(
      <meta key="description" content={description} name="description" />
    );
  }

  if (robots) {
    content.push(
      <meta key="robots" content={robots} name="robots" />
    );
  }

  if (canonicalUrl) {
    content.push(
      <link key="canonical" href={canonicalUrl} rel="canonical" />
    );
  }

  if (social) {
    content.push(
      <meta key="og:type" content="website" property="og:type" />,
      <meta
        key="og:site_name"
        content={SEO_BRAND}
        property="og:site_name"
      />,
      <meta
        key="og:locale"
        content={social.locale}
        property="og:locale"
      />,
      <meta key="og:title" content={social.title} property="og:title" />,
      <meta
        key="og:description"
        content={social.description}
        property="og:description"
      />,
      <meta key="og:url" content={social.url} property="og:url" />,
      <meta
        key="og:image"
        content={social.imageUrl}
        property="og:image"
      />,
      <meta
        key="og:image:alt"
        content={social.imageAlt}
        property="og:image:alt"
      />,
      <meta
        key="twitter:card"
        content="summary_large_image"
        name="twitter:card"
      />,
      <meta
        key="twitter:title"
        content={social.title}
        name="twitter:title"
      />,
      <meta
        key="twitter:description"
        content={social.description}
        name="twitter:description"
      />,
      <meta
        key="twitter:image"
        content={social.imageUrl}
        name="twitter:image"
      />,
      <meta
        key="twitter:image:alt"
        content={social.imageAlt}
        name="twitter:image:alt"
      />
    );
  }

  if (jsonLd) {
    content.push(
      <script
        key="json-ld"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(jsonLd),
        }}
        id="seo-json-ld"
        type="application/ld+json"
      />
    );
  }

  return content;
};
