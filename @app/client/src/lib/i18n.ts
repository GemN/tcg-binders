import { setDefaultOptions } from "date-fns";
import { enGB, fr } from "date-fns/locale";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enCommon from "@/assets/locales/en/common.json";
import enLogin from "@/assets/locales/en/login.json";
import frCommon from "@/assets/locales/fr/common.json";
import frLogin from "@/assets/locales/fr/login.json";

export const defaultNS = "common";
export const resources = {
  en: {
    common: enCommon,
    login: enLogin,
  },
  fr: {
    common: frCommon,
    login: frLogin,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    defaultNS,
    resources,
    fallbackLng: "en",
    ns: ["common", "login"],
    interpolation: {
      escapeValue: false,
    },
  });

const configureDateFnsLocale = (language: string) => {
  const locale = language === "fr" ? fr : enGB;
  setDefaultOptions({ locale });
};

configureDateFnsLocale(i18n.language);
i18n.on("languageChanged", configureDateFnsLocale);

export default i18n;
