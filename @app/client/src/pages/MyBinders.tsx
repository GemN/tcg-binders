import { useTranslation } from "react-i18next";

import { useMyBindersQuery } from "@app/graphql";

import { BinderGallery } from "@/components/BinderGallery";
import { Loading } from "@/components/Loading";
import { useSession } from "@/providers/SessionContext";

export const MyBinders = () => {
  const { t } = useTranslation(["common"]);
  const { session } = useSession();
  const ownerId = session?.user.id || "";
  const { data, loading } = useMyBindersQuery({
    variables: { ownerId },
    skip: !ownerId,
    fetchPolicy: "cache-and-network",
  });

  const binders =
    data?.bindersCollection?.edges.map(({ node }) => ({
      coverImageUrl:
        node.binderCards?.edges[0]?.node.card?.imageNormalUrl ||
        node.binderCards?.edges[0]?.node.card?.imageSmallUrl,
      id: node.id,
      name: node.name,
      shortId: node.shortId,
    })) || [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="h1">{t("common:my_binders.title")}</h1>
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loading />
        </div>
      ) : binders.length > 0 ? (
        <BinderGallery binders={binders} />
      ) : (
        <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">
            {t("common:my_binders.empty")}
          </p>
        </div>
      )}
    </div>
  );
};
