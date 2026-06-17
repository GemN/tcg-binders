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
    code: "fr",
    label: "Français",
    shortLabel: "FR",
  },
];
interface LanguageSwitcherProps {}

export const LanguageSwitcher: FC<LanguageSwitcherProps> = () => {
  const { i18n } = useTranslation();
  const handleLanguageChange = (lang: Language) => async () => {
    await i18n.changeLanguage(lang.code);
  };
  const currentLanguage = i18n.language;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={handleLanguageChange(lang)}
            className={`cursor-pointer ${currentLanguage === lang.code ? "bg-muted" : ""}`}
          >
            <span className="mr-2 text-xs text-muted-foreground">
              {lang.shortLabel}
            </span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
