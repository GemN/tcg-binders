import {
  CardCondition,
  type BinderCardsInsertInput,
  type CardsFilter,
  type CardsForBinderImportQuery,
  CurrencyCode,
  LanguageCode,
} from "@app/graphql";

export type BinderImportFormat = "text" | "manabox_csv";

export interface BinderImportItem {
  collectorNumber?: string;
  condition: CardCondition;
  externalId?: string;
  finish: string;
  language: LanguageCode;
  name: string;
  priceAmount?: string;
  priceCurrency?: CurrencyCode;
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

export interface BinderImportResolvedItem {
  card: BinderImportCardRecord;
  finish: string;
  item: BinderImportItem;
}

export interface BinderImportResolveResult {
  matchedItems: BinderImportResolvedItem[];
  unmatchedItems: BinderImportItem[];
}

export interface BinderImportLookupBatch {
  filter: CardsFilter;
  first: number;
  items: BinderImportItem[];
}

export interface CreateBinderImportObjectsParams {
  binderId: string;
  items: BinderImportResolvedItem[];
  tcgId: string;
}

export type BinderImportCardRecord = NonNullable<
  NonNullable<
    CardsForBinderImportQuery["cardsCollection"]
  >["edges"][number]["node"]
>;

export type BinderImportInsertInput = BinderCardsInsertInput;
