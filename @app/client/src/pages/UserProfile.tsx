import { useUserProfileByNicknameQuery } from "@app/graphql";
import { useParams } from "react-router";

import { CountryFlag } from "@/components/CountryFlag";
import { Loading } from "@/components/Loading";
import { UserAvatar } from "@/components/UserAvatar";
import { countriesByISOCode, type ISOCode } from "@/lib/countries";
import { NotFound } from "@/pages/NotFound";

export const UserProfile = () => {
  const { nickname = "" } = useParams();
  const { data, loading } = useUserProfileByNicknameQuery({
    variables: { nickname },
    skip: !nickname,
  });
  const profile = data?.userProfilesCollection?.edges[0]?.node;

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-4">
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
