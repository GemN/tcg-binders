import { CardCondition, CurrencyCode, LanguageCode } from "@app/graphql";

export const CARD_CONDITION_OPTIONS = [
  CardCondition.Mint,
  CardCondition.NearMint,
  CardCondition.Excellent,
  CardCondition.Good,
  CardCondition.LightPlayed,
  CardCondition.Played,
  CardCondition.Poor,
] as const;

export const CARD_LANGUAGE_OPTIONS = [
  LanguageCode.En,
  LanguageCode.Fr,
  LanguageCode.De,
  LanguageCode.It,
  LanguageCode.Es,
  LanguageCode.Pt,
  LanguageCode.Ja,
  LanguageCode.Ko,
  LanguageCode.Zhs,
  LanguageCode.Zht,
] as const;

export const CARD_CURRENCY_OPTIONS = [
  CurrencyCode.Thb,
  CurrencyCode.Usd,
  CurrencyCode.Eur,
  CurrencyCode.Gbp,
  CurrencyCode.Jpy,
] as const;

export const cardLanguageFlagCodes: Record<LanguageCode, string> = {
  [LanguageCode.Ar]: "sa",
  [LanguageCode.De]: "de",
  [LanguageCode.En]: "gb",
  [LanguageCode.Es]: "es",
  [LanguageCode.Fr]: "fr",
  [LanguageCode.Grc]: "gr",
  [LanguageCode.He]: "il",
  [LanguageCode.It]: "it",
  [LanguageCode.Ja]: "jp",
  [LanguageCode.Ko]: "kr",
  [LanguageCode.La]: "va",
  [LanguageCode.Ph]: "xx",
  [LanguageCode.Pt]: "pt",
  [LanguageCode.Qya]: "un",
  [LanguageCode.Ru]: "ru",
  [LanguageCode.Sa]: "in",
  [LanguageCode.Zhs]: "cn",
  [LanguageCode.Zht]: "tw",
};

export const defaultCardCondition = CardCondition.NearMint;
export const defaultCardFinish = "normal";
export const defaultCardLanguage = LanguageCode.En;

export const isFoilCardFinish = (finish: string | null | undefined) => {
  const normalizedFinish = finish?.trim().toLowerCase();
  return !!normalizedFinish && !["normal", "nonfoil"].includes(normalizedFinish);
};
