import { BinderVisibility, useMyBindersQuery } from "@app/graphql";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BinderGallery } from "@/components/BinderGallery";
import { Loading } from "@/components/Loading";
import { ModalBinderSettings } from "@/components/ModalBinderSettings";
import { Seo } from "@/components/Seo";
import { NAVBAR_CONTENT_OFFSET_CLASS_NAME } from "@/config/layout";
import { getCardImageBaseUrl, getCardScryfallId } from "@/lib/cardImageUrl";
import { cn } from "@/lib/utils";
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
      <Seo
        metadata={{
          canonicalPath: "/my-binders",
          robots: "noindex,follow",
          title: t("common:seo.my_binders.title"),
        }}
      />
      <div className={cn("bg-surface", NAVBAR_CONTENT_OFFSET_CLASS_NAME)}>
        <div
          className={cn(
            "w-full px-4 pb-4 pt-2 sm:px-6 sm:py-6 lg:px-[60px]"
          )}
        >
          <h1 className="text-[40px] font-medium leading-[48px]">
            {t("common:my_binders.title")}
          </h1>
        </div>
      </div>
      <div
        className={cn(
          "flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-[60px]"
        )}
      >
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loading />
          </div>
        ) : (
          <BinderGallery
            binders={binders}
            onOpenSettings={handleSettingsOpen}
          />
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
