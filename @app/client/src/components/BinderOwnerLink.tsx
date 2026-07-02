import { Link } from "react-router";

import { CountryFlag } from "@/components/CountryFlag";
import { countriesByISOCode, type ISOCode } from "@/lib/countries";

interface BinderOwnerLinkProps {
  country: string;
  nickname: string;
}

export const BinderOwnerLink = ({
  country,
  nickname,
}: BinderOwnerLinkProps) => {
  const displayName = nickname.trim();
  const countryCode = country.trim().toUpperCase();
  const countryName = countriesByISOCode[countryCode as ISOCode]?.name;

  if (!displayName) {
    return null;
  }

  return (
    <Link
      to={`/user/${encodeURIComponent(displayName)}`}
      className="inline-flex min-w-0 items-center gap-1.5 rounded-sm text-sm text-binder-toolbar-foreground/75 underline-offset-4 hover:text-binder-toolbar-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-binder-toolbar-foreground/40"
    >
      {countryCode && (
        <CountryFlag
          code={countryCode}
          label={countryName}
          className="h-3.5 w-5"
        />
      )}
      <span className="truncate font-medium">{displayName}</span>
    </Link>
  );
};
