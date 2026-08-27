import type {
  CardCondition,
  CurrencyCode,
  LanguageCode,
  MarketPriceSource,
} from "@app/graphql";

import type { BinderEditingCardSnapshot } from "./binderEditing/types";

export type DraftCardCondition = CardCondition;
export type DraftCardLanguage = LanguageCode;
export type DraftCardCurrency = CurrencyCode;

export interface DraftMarketPrice {
  amount: number;
  buyUrl?: string | null;
  currency: DraftCardCurrency;
  finish: string;
  priceDate: string;
  source: MarketPriceSource;
}

export interface DraftCardSnapshot
  extends Omit<BinderEditingCardSnapshot, "marketPrices"> {
  marketPrices: DraftMarketPrice[];
}

export interface DraftBinderCard {
  card: DraftCardSnapshot;
  cardId: string;
  condition: DraftCardCondition;
  createdAt: string;
  draftId: string;
  dynamicPriceRule?: string | null;
  finish: string;
  language: DraftCardLanguage;
  note?: string;
  position: number;
  priceAmount?: string | null;
  priceCurrency?: DraftCardCurrency | null;
  quantity: number;
}

export interface DraftBinder {
  cards: DraftBinderCard[];
  name: string;
  note: string;
  tcgId: "mtg";
}

export interface AddDraftCardOptions {
  condition?: DraftCardCondition;
  dynamicPriceRule?: string | null;
  finish?: string;
  language?: DraftCardLanguage;
  note?: string;
  position?: number;
  priceAmount?: string | null;
  priceCurrency?: DraftCardCurrency | null;
  quantity?: number;
}
