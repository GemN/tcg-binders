import type {
  CardCondition,
  CurrencyCode,
  LanguageCode,
  MarketPriceSource,
} from "@app/graphql";

export const binderImportConditions = [
  "excellent",
  "good",
  "light_played",
  "mint",
  "near_mint",
  "played",
  "poor",
] as const satisfies readonly `${CardCondition}`[];

export const binderImportCurrencies = [
  "EUR",
  "GBP",
  "JPY",
  "THB",
  "USD",
] as const satisfies readonly `${CurrencyCode}`[];

export const binderImportLanguages = [
  "ar",
  "de",
  "en",
  "es",
  "fr",
  "grc",
  "he",
  "it",
  "ja",
  "ko",
  "la",
  "ph",
  "pt",
  "qya",
  "ru",
  "sa",
  "zhs",
  "zht",
] as const satisfies readonly `${LanguageCode}`[];

export type BinderImportCondition = CardCondition;
export type BinderImportCurrency = CurrencyCode;
export type BinderImportFormat = "text" | "manabox_csv";
export type BinderImportLanguage = LanguageCode;

export interface BinderImportItem {
  collectorNumber?: string;
  condition: BinderImportCondition;
  externalId?: string;
  finish: string;
  language: BinderImportLanguage;
  name: string;
  priceAmount?: string;
  priceCurrency?: BinderImportCurrency;
  quantity: number;
  setCode?: string;
  sourceLine: number;
}

export interface BinderImportRejectedLine {
  line: number;
  reason: string;
  value: string;
}

export interface BinderImportParseResult {
  items: BinderImportItem[];
  rejectedLines: BinderImportRejectedLine[];
}

export interface BinderImportCardSet {
  code?: string | null;
  id?: string;
  name?: string;
  releaseAt?: string | null;
}

export interface BinderImportMtgCardDetail {
  oracleText?: string | null;
  scryfallId?: string | null;
  typeLine?: string | null;
}

export interface BinderImportMarketPrice {
  amount: number | string;
  buyUrl?: string | null;
  currency: CurrencyCode;
  finish: string;
  priceDate: string;
  source: MarketPriceSource;
}

export interface BinderImportCardRecord {
  cardSet?: BinderImportCardSet | null;
  collectorNumber?: string | null;
  externalId: string;
  finishes: Array<string | null>;
  id: string;
  imageUrl?: string | null;
  marketPrices?: {
    edges: Array<{ node: BinderImportMarketPrice }>;
  } | null;
  mtgCardDetail?: BinderImportMtgCardDetail | null;
  name: string;
  rarity?: string | null;
  releasedAt?: string | null;
}

export interface BinderImportResolvedItem {
  card: BinderImportCardRecord;
  finish: string;
  item: BinderImportItem;
}

export interface BinderImportResolveResult {
  matchedItems: BinderImportResolvedItem[];
  unmatchedItems: BinderImportItem[];
}

export interface BinderImportProgress {
  completed: number;
  total: number;
}

export interface BinderImportCardCatalogRequest {
  items: BinderImportItem[];
  onProgress: (progress: BinderImportProgress) => void;
  tcgId: string;
}

export interface BinderImportCardCatalog {
  findCards: (
    request: BinderImportCardCatalogRequest
  ) => Promise<BinderImportCardRecord[]>;
}

export interface BinderImportDestinationResult {
  coherenceFailed?: boolean;
  failedInsertCount: number;
  failedItems?: BinderImportResolvedItem[];
  importedCount: number;
}

export interface BinderImportDestinationRequest {
  items: BinderImportResolvedItem[];
  onProgress: (progress: BinderImportProgress) => void;
}

export interface BinderImportDestination {
  importCards: (
    request: BinderImportDestinationRequest
  ) => Promise<BinderImportDestinationResult>;
}

export interface BinderImportPrepareRequest {
  format: BinderImportFormat;
  onProgress: (progress: BinderImportProgress) => void;
  tcgId: string;
  text: string;
}

export interface BinderImportPreparation {
  matchedItems: BinderImportResolvedItem[];
  rejectedLines: BinderImportRejectedLine[];
  unmatchedItems: BinderImportItem[];
}

export interface BinderImporter {
  commit: (
    items: BinderImportResolvedItem[],
    onProgress: (progress: BinderImportProgress) => void
  ) => Promise<BinderImportDestinationResult>;
  prepare: (
    request: BinderImportPrepareRequest
  ) => Promise<BinderImportPreparation>;
}
