import { useUserProfileByNicknameQuery } from "@app/graphql";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { CountryFlag } from "@/components/CountryFlag";
import { Loading } from "@/components/Loading";
import { Seo } from "@/components/Seo";
import { UserAvatar } from "@/components/UserAvatar";
import { NAVBAR_CONTENT_OFFSET_CLASS_NAME } from "@/config/layout";
import { countriesByISOCode, type ISOCode } from "@/lib/countries";
import type { SeoMetadata } from "@/lib/seoMetadata";
import { cn } from "@/lib/utils";
import { NotFound } from "@/pages/NotFound";

export const UserProfile = () => {
  const { t } = useTranslation(["common"]);
  const { nickname = "" } = useParams();
  const { data, loading } = useUserProfileByNicknameQuery({
    variables: { nickname },
    skip: !nickname,
  });
  const profile = data?.userProfilesCollection?.edges[0]?.node;
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

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8",
        NAVBAR_CONTENT_OFFSET_CLASS_NAME
      )}
    >
      <Seo metadata={seoMetadata} />
      <div className="flex min-w-0 items-center gap-4 pt-6">
        <UserAvatar className="size-16 text-xl" name={profile.nickname} />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="font-display truncate text-3xl font-semibold tracking-normal text-foreground">
              {profile.nickname}
            </h1>
            {countryCode && (
              <CountryFlag
                code={countryCode}
                label={countryName}
                className="h-4 w-6"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
