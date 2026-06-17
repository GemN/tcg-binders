import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useUserContext } from "@/providers/UserContextContext";

export const SettingsOrganization = () => {
  const { t } = useTranslation(["common"]);
  const { currentContext } = useUserContext();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="h1">{t("common:organization.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("common:organization.subtitle")}
        </p>
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t("common:organization.details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">
              {t("common:organization.name")}:
            </span>{" "}
            {currentContext?.organizationName || t("common:not_available")}
          </div>
          <div>
            <span className="text-muted-foreground">
              {t("common:organization.role")}:
            </span>{" "}
            {currentContext?.role || t("common:not_available")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
