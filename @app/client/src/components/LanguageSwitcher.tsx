import { Globe } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button.tsx";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";

interface Language {
  code: string;
  label: string;
  shortLabel: string;
}
const languages: Language[] = [
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
  },
  {
    code: "th",
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
        <Button variant="ghost" className="h-9 px-2 sm:px-3">
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
            <span className="mr-2 text-xs text-current/70">
              {lang.shortLabel}
            </span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
