import { setDefaultOptions } from "date-fns";
import { enGB, th } from "date-fns/locale";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enBinder from "@/assets/locales/en/binder.json";
import enCommon from "@/assets/locales/en/common.json";
import enLogin from "@/assets/locales/en/login.json";
import thBinder from "@/assets/locales/th/binder.json";
import thCommon from "@/assets/locales/th/common.json";
import thLogin from "@/assets/locales/th/login.json";

export const defaultNS = "common";
export const resources = {
  en: {
    binder: enBinder,
    common: enCommon,
    login: enLogin,
  },
  th: {
    binder: thBinder,
    common: thCommon,
    login: thLogin,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    defaultNS,
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "th"],
    load: "languageOnly",
    ns: ["binder", "common", "login"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
      convertDetectedLanguage: (language: string) =>
        language.toLowerCase().startsWith("th") ? "th" : "en",
    },
    interpolation: {
      escapeValue: false,
    },
  });

const configureDateFnsLocale = (language: string) => {
  const locale = language.startsWith("th") ? th : enGB;
  setDefaultOptions({ locale });
};

configureDateFnsLocale(i18n.language);
i18n.on("languageChanged", configureDateFnsLocale);

export default i18n;
