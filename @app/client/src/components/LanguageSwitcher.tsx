import { Globe } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { CountryFlag } from "@/components/CountryFlag";
import { Button } from "@/components/ui/Button.tsx";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";

interface Language {
  code: string;
  flagCode: string;
  label: string;
  shortLabel: string;
}
const languages: Language[] = [
  {
    code: "en",
    flagCode: "gb",
    label: "English",
    shortLabel: "EN",
  },
  {
    code: "th",
    flagCode: "th",
    label: "ไทย",
    shortLabel: "TH",
  },
];
interface LanguageSwitcherProps {}

export const LanguageSwitcher: FC<LanguageSwitcherProps> = () => {
  const { i18n, t } = useTranslation(["common"]);
  const handleLanguageChange = (lang: Language) => async () => {
    await i18n.changeLanguage(lang.code);
  };
  const currentLanguage =
    languages.find((lang) => i18n.language.startsWith(lang.code)) ||
    languages[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="link" className="h-9 px-2 sm:px-3">
          <Globe className="size-4" />
          <span>{currentLanguage.shortLabel}</span>
          <span className="sr-only">{t("common:nav.switch_language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={handleLanguageChange(lang)}
            className={`cursor-pointer ${
              currentLanguage.code === lang.code
                ? "bg-primary text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground"
                : ""
            }`}
          >
            <CountryFlag code={lang.flagCode} className="mr-2 h-3.5 w-5" />
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
