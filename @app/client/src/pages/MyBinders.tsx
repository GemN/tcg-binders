import { BinderVisibility, useMyBindersQuery } from "@app/graphql";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BinderGallery } from "@/components/BinderGallery";
import { Loading } from "@/components/Loading";
import { ModalBinderSettings } from "@/components/ModalBinderSettings";
import { Seo } from "@/components/Seo";
import { getCardImageBaseUrl, getCardScryfallId } from "@/lib/cardImageUrl";
import { useSession } from "@/providers/SessionContext";

interface SelectedSettingsBinder {
  id: string;
  name: string;
  visibility: BinderVisibility;
}

export const MyBinders = () => {
  const { t } = useTranslation(["common"]);
  const { session } = useSession();
  const ownerId = session?.user.id || "";
  const [settingsBinder, setSettingsBinder] =
    useState<SelectedSettingsBinder | null>(null);
  const { data, loading, refetch } = useMyBindersQuery({
    variables: { ownerId },
    skip: !ownerId,
    fetchPolicy: "cache-and-network",
  });

  const binders =
    data?.bindersCollection?.edges.map(({ node }) => ({
      cardCount: node.binderCardCount ?? 0,
      coverImageUrl: getCardImageBaseUrl(node.binderCards?.edges[0]?.node.card),
      coverScryfallId: getCardScryfallId(node.binderCards?.edges[0]?.node.card),
      id: node.id,
      name: node.name,
      shortId: node.shortId,
      visibility: node.visibility,
    })) || [];

  const handleSettingsOpen = (binder: SelectedSettingsBinder) => {
    setSettingsBinder({
      id: binder.id,
      name: binder.name,
      visibility: binder.visibility,
    });
  };

  const handleSettingsDeleted = () => {
    setSettingsBinder(null);
    void refetch();
  };

  const handleSettingsOpenChange = (open: boolean) => {
    if (!open) {
      setSettingsBinder(null);
    }
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="h1">{t("common:my_binders.title")}</h1>
      <Seo
        metadata={{
          canonicalPath: "/my-binders",
          robots: "noindex,follow",
          title: t("common:seo.my_binders.title"),
        }}
      />
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loading />
          </div>
        ) : binders.length > 0 ? (
          <BinderGallery
            binders={binders}
            onOpenSettings={handleSettingsOpen}
          />
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              {t("common:my_binders.empty")}
            </p>
          </div>
        )}
      </div>

      {settingsBinder && (
        <ModalBinderSettings
          binderId={settingsBinder.id}
          binderName={settingsBinder.name}
          binderVisibility={settingsBinder.visibility}
          open={!!settingsBinder}
          onDeleted={handleSettingsDeleted}
          onOpenChange={handleSettingsOpenChange}
          onVisibilityUpdated={refetch}
        />
      )}
    </>
  );
};
