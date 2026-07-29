import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { Seo } from "@/components/Seo";
import type { SeoMetadata } from "@/lib/seoMetadata";

interface NotFoundProps {
  metadata?: SeoMetadata;
}

export const NotFound: FC<NotFoundProps> = ({ metadata }) => {
  const { t } = useTranslation(["common"]);
  const seoMetadata: SeoMetadata = metadata || {
    robots: "noindex,follow",
    title: t("common:seo.not_found.title"),
  };

  return (
    <div className="p-6">
      <Seo metadata={seoMetadata} />
      <h1>{t("common:not_found.title")}</h1>
      <p>{t("common:not_found.description")}</p>
    </div>
  );
};
