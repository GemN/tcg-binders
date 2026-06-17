import type { FC } from "react";
import { useTranslation } from "react-i18next";

interface NotFoundProps {}

export const NotFound: FC<NotFoundProps> = () => {
  const { t } = useTranslation(["common"]);
  return (
    <div className="p-6">
      <h1>{t("common:not_found.title")}</h1>
      <p>{t("common:not_found.description")}</p>
    </div>
  );
};
