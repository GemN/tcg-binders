import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { useBinderByShortIdQuery } from "@app/graphql";

import { Loading } from "@/components/Loading";
import { NotFound } from "@/pages/NotFound";

export const BinderPage = () => {
  const { t } = useTranslation(["common"]);
  const { shortId = "" } = useParams();
  const { data, loading } = useBinderByShortIdQuery({
    variables: { shortId },
    skip: !shortId,
  });

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loading />
      </div>
    );
  }

  const binder = data?.binderByShortId;
  if (!binder) {
    return <NotFound />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="h1">{binder.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("common:binder.short_url", { shortId: binder.shortId })}
        </p>
      </div>
    </div>
  );
};
