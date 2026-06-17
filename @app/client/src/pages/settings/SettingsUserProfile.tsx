import { useCurrentUserProfileQuery } from "@app/graphql";
import { useTranslation } from "react-i18next";

import { Loading } from "@/components/Loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export const SettingsUserProfile = () => {
  const { t } = useTranslation(["common"]);
  const { data, loading } = useCurrentUserProfileQuery({
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
    return <Loading />;
  }

  const profile = data?.currentUserProfile;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="h1">{t("common:profile.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("common:profile.subtitle")}
        </p>
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t("common:profile.details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">
              {t("common:profile.firstname")}:
            </span>{" "}
            {profile?.firstname || t("common:not_available")}
          </div>
          <div>
            <span className="text-muted-foreground">
              {t("common:profile.lastname")}:
            </span>{" "}
            {profile?.lastname || t("common:not_available")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
