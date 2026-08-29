import {
  usePublicBindersByOwnerQuery,
  useUserProfileByNicknameQuery,
} from "@app/graphql";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { BinderGallery } from "@/components/BinderGallery";
import { CountryFlag } from "@/components/CountryFlag";
import { Loading } from "@/components/Loading";
import { Seo } from "@/components/Seo";
import { UserAvatar } from "@/components/UserAvatar";
import { NAVBAR_CONTENT_OFFSET_CLASS_NAME } from "@/config/layout";
import { countriesByISOCode, type ISOCode } from "@/lib/countries";
import type { SeoMetadata } from "@/lib/seoMetadata";
import { cn } from "@/lib/utils";
import { NotFound } from "@/pages/NotFound";

import { getPublicProfileBinders } from "./UserProfile.binders.ts";

export const UserProfile = () => {
  const { t } = useTranslation(["common"]);
  const { nickname = "" } = useParams();
  const { data, loading } = useUserProfileByNicknameQuery({
    variables: { nickname },
    skip: !nickname,
  });
  const profile = data?.userProfilesCollection?.edges[0]?.node;
  const { data: bindersData, loading: areBindersLoading } =
    usePublicBindersByOwnerQuery({
      variables: { ownerId: profile?.id || "" },
      skip: !profile?.id,
      fetchPolicy: "network-only",
    });
  const seoNickname = profile?.nickname || nickname;
  const seoMetadata: SeoMetadata = {
    canonicalPath: seoNickname
      ? `/user/${encodeURIComponent(seoNickname)}`
      : undefined,
    robots: "noindex,follow",
    title: seoNickname
      ? t("common:seo.user_profile.title", { nickname: seoNickname })
      : t("common:seo.user_profile.fallback_title"),
  };

  if (loading && !data) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center justify-center",
          NAVBAR_CONTENT_OFFSET_CLASS_NAME
        )}
      >
        <Loading />
      </div>
    );
  }

  if (!profile) {
    return <NotFound />;
  }

  const countryCode = profile.country.trim().toUpperCase();
  const countryName = countriesByISOCode[countryCode as ISOCode]?.name;
  const binders = getPublicProfileBinders(bindersData);

  return (
    <>
      <Seo metadata={seoMetadata} />
      <div className={cn("bg-surface", NAVBAR_CONTENT_OFFSET_CLASS_NAME)}>
        <div className="flex w-full items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6 lg:px-[60px]">
          <UserAvatar className="size-12 text-base" name={profile.nickname} />
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <h1 className="font-display truncate text-3xl font-medium tracking-normal text-foreground sm:text-[40px] sm:leading-[48px]">
              {profile.nickname}
            </h1>
            {countryCode && (
              <CountryFlag
                code={countryCode}
                label={countryName}
                className="h-4 w-6 sm:h-5 sm:w-7"
              />
            )}
          </div>
        </div>
      </div>
      <section className="flex w-full flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-[60px]">
        <h2 className="mb-4 font-display text-[24px] font-medium leading-8 sm:mb-5">
          {t("common:user_profile.collection")}
        </h2>
        {areBindersLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loading />
          </div>
        ) : (
          <BinderGallery binders={binders} readOnly />
        )}
      </section>
    </>
  );
};
