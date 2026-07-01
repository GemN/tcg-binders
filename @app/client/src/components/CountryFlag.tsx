import flagCnIconUrl from "flag-icons/flags/4x3/cn.svg?url";
import flagDeIconUrl from "flag-icons/flags/4x3/de.svg?url";
import flagEsIconUrl from "flag-icons/flags/4x3/es.svg?url";
import flagFrIconUrl from "flag-icons/flags/4x3/fr.svg?url";
import flagGbIconUrl from "flag-icons/flags/4x3/gb.svg?url";
import flagGrIconUrl from "flag-icons/flags/4x3/gr.svg?url";
import flagIlIconUrl from "flag-icons/flags/4x3/il.svg?url";
import flagInIconUrl from "flag-icons/flags/4x3/in.svg?url";
import flagItIconUrl from "flag-icons/flags/4x3/it.svg?url";
import flagJpIconUrl from "flag-icons/flags/4x3/jp.svg?url";
import flagKrIconUrl from "flag-icons/flags/4x3/kr.svg?url";
import flagPtIconUrl from "flag-icons/flags/4x3/pt.svg?url";
import flagRuIconUrl from "flag-icons/flags/4x3/ru.svg?url";
import flagSaIconUrl from "flag-icons/flags/4x3/sa.svg?url";
import flagThIconUrl from "flag-icons/flags/4x3/th.svg?url";
import flagTwIconUrl from "flag-icons/flags/4x3/tw.svg?url";
import flagUnIconUrl from "flag-icons/flags/4x3/un.svg?url";
import flagVaIconUrl from "flag-icons/flags/4x3/va.svg?url";
import flagXxIconUrl from "flag-icons/flags/4x3/xx.svg?url";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type FlagIconLoader = () => Promise<string>;

const preloadedFlagIconUrls: Record<string, string> = {
  cn: flagCnIconUrl,
  de: flagDeIconUrl,
  es: flagEsIconUrl,
  fr: flagFrIconUrl,
  gb: flagGbIconUrl,
  gr: flagGrIconUrl,
  il: flagIlIconUrl,
  in: flagInIconUrl,
  it: flagItIconUrl,
  jp: flagJpIconUrl,
  kr: flagKrIconUrl,
  pt: flagPtIconUrl,
  ru: flagRuIconUrl,
  sa: flagSaIconUrl,
  th: flagThIconUrl,
  tw: flagTwIconUrl,
  un: flagUnIconUrl,
  va: flagVaIconUrl,
  xx: flagXxIconUrl,
};

const lazyFlagIconLoaders = import.meta.glob(
  [
    "../../node_modules/flag-icons/flags/4x3/*.svg",
    "!../../node_modules/flag-icons/flags/4x3/cn.svg",
    "!../../node_modules/flag-icons/flags/4x3/de.svg",
    "!../../node_modules/flag-icons/flags/4x3/es.svg",
    "!../../node_modules/flag-icons/flags/4x3/fr.svg",
    "!../../node_modules/flag-icons/flags/4x3/gb.svg",
    "!../../node_modules/flag-icons/flags/4x3/gr.svg",
    "!../../node_modules/flag-icons/flags/4x3/il.svg",
    "!../../node_modules/flag-icons/flags/4x3/in.svg",
    "!../../node_modules/flag-icons/flags/4x3/it.svg",
    "!../../node_modules/flag-icons/flags/4x3/jp.svg",
    "!../../node_modules/flag-icons/flags/4x3/kr.svg",
    "!../../node_modules/flag-icons/flags/4x3/pt.svg",
    "!../../node_modules/flag-icons/flags/4x3/ru.svg",
    "!../../node_modules/flag-icons/flags/4x3/sa.svg",
    "!../../node_modules/flag-icons/flags/4x3/th.svg",
    "!../../node_modules/flag-icons/flags/4x3/tw.svg",
    "!../../node_modules/flag-icons/flags/4x3/un.svg",
    "!../../node_modules/flag-icons/flags/4x3/va.svg",
    "!../../node_modules/flag-icons/flags/4x3/xx.svg",
  ],
  {
    import: "default",
    query: "?url",
  }
) as Record<string, FlagIconLoader>;

const normalizeFlagCode = (code: string) => code.trim().toLowerCase();

const getFlagIconPath = (code: string) =>
  `../../node_modules/flag-icons/flags/4x3/${code}.svg`;

const getPreloadedFlagIconUrl = (code: string) => {
  const normalizedCode = normalizeFlagCode(code);
  return preloadedFlagIconUrls[normalizedCode] || null;
};

const loadFlagIconUrl = async (code: string) => {
  const normalizedCode = normalizeFlagCode(code);
  const loadFlagIcon =
    lazyFlagIconLoaders[getFlagIconPath(normalizedCode)] ||
    lazyFlagIconLoaders[getFlagIconPath("xx")];

  if (!loadFlagIcon) {
    return flagXxIconUrl;
  }

  return loadFlagIcon();
};

interface CountryFlagProps {
  className?: string;
  code: string;
  label?: string;
}

export const CountryFlag = ({ className, code, label }: CountryFlagProps) => {
  const [flagIconUrl, setFlagIconUrl] = useState<string | null>(() =>
    getPreloadedFlagIconUrl(code)
  );

  useEffect(() => {
    const preloadedFlagIconUrl = getPreloadedFlagIconUrl(code);

    if (preloadedFlagIconUrl) {
      setFlagIconUrl(preloadedFlagIconUrl);
      return;
    }

    let isCurrent = true;

    setFlagIconUrl(null);
    loadFlagIconUrl(code)
      .then((nextFlagIconUrl) => {
        if (isCurrent) {
          setFlagIconUrl(nextFlagIconUrl);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setFlagIconUrl(flagXxIconUrl);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [code]);

  if (!flagIconUrl) {
    return (
      <span
        aria-hidden={label ? undefined : true}
        aria-label={label}
        className={cn(
          "inline-block shrink-0 rounded-[2px] bg-muted shadow-[0_0_0_1px_rgba(0,0,0,0.16)]",
          className
        )}
        role={label ? "img" : undefined}
      />
    );
  }

  return (
    <img
      alt={label || ""}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-block shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.16)]",
        className
      )}
      src={flagIconUrl}
    />
  );
};
