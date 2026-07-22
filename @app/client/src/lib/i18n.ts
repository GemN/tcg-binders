import { setDefaultOptions } from "date-fns";
import { enGB, th } from "date-fns/locale";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enBinder from "@/assets/locales/en/binder.json";
import enCard from "@/assets/locales/en/card.json";
import enCheckout from "@/assets/locales/en/checkout.json";
import enCommon from "@/assets/locales/en/common.json";
import enLogin from "@/assets/locales/en/login.json";
import enOnboarding from "@/assets/locales/en/onboarding.json";
import enSettings from "@/assets/locales/en/settings.json";
import thBinder from "@/assets/locales/th/binder.json";
import thCard from "@/assets/locales/th/card.json";
import thCheckout from "@/assets/locales/th/checkout.json";
import thCommon from "@/assets/locales/th/common.json";
import thLogin from "@/assets/locales/th/login.json";
import thOnboarding from "@/assets/locales/th/onboarding.json";
import thSettings from "@/assets/locales/th/settings.json";

export const defaultNS = "common";
export const resources = {
  en: {
    binder: enBinder,
    card: enCard,
    checkout: enCheckout,
    common: enCommon,
    login: enLogin,
    onboarding: enOnboarding,
    settings: enSettings,
  },
  th: {
    binder: thBinder,
    card: thCard,
    checkout: thCheckout,
    common: thCommon,
    login: thLogin,
    onboarding: thOnboarding,
    settings: thSettings,
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
    ns: [
      "binder",
      "card",
      "checkout",
      "common",
      "login",
      "onboarding",
      "settings",
    ],
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
