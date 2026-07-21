import { countriesByISOCode, type ISOCode } from "@/lib/countries";

export const getOnboardingPath = (nextPath: string) => {
  if (nextPath.startsWith("/onboarding")) {
    return nextPath;
  }

  return `/onboarding?next=${encodeURIComponent(nextPath)}`;
};

export const getRegistrationCountry = (): ISOCode | undefined => {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  const locales = navigator.languages.length
    ? navigator.languages
    : [navigator.language];

  for (const locale of locales) {
    const region = locale
      .replace(/_/g, "-")
      .split("-")
      .slice(1)
      .find((part) => /^[a-zA-Z]{2}$/.test(part))
      ?.toUpperCase() as ISOCode | undefined;

    if (region && countriesByISOCode[region]) {
      return region;
    }
  }

  if (locales.some((locale) => locale.toLowerCase().startsWith("th"))) {
    return "TH";
  }

  return undefined;
};
