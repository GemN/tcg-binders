import type {
  CardCondition,
  CurrencyCode,
  LanguageCode,
  MarketPriceSource,
} from "@app/graphql";

const defaultCardConditionValue = "near_mint" satisfies `${CardCondition}`;
const defaultCurrencyCodeValue = "THB" satisfies `${CurrencyCode}`;
const defaultLanguageCodeValue = "en" satisfies `${LanguageCode}`;

export interface BinderEditingDomainDefaults {
  condition: CardCondition;
  currency: CurrencyCode;
  language: LanguageCode;
}

export const binderEditingDomainDefaults: BinderEditingDomainDefaults = {
  condition: defaultCardConditionValue as CardCondition,
  currency: defaultCurrencyCodeValue as CurrencyCode,
  language: defaultLanguageCodeValue as LanguageCode,
};

export type BinderEditingFailureReason =
  | "card_not_found"
  | "coherence_failed"
  | "invalid_card"
  | "invalid_multiplier"
  | "invalid_price"
  | "invalid_quantity"
  | "name_required"
  | "write_failed";

export class BinderEditingError extends Error {
  readonly cause?: unknown;
  readonly reason: BinderEditingFailureReason;

  constructor(reason: BinderEditingFailureReason, cause?: unknown) {
    super(reason);
    this.name = "BinderEditingError";
    this.cause = cause;
    this.reason = reason;
  }
}

export class BinderEditingCoherenceError extends BinderEditingError {
  readonly outcome?: BinderEditingBulkOutcome;

  constructor(cause: unknown, outcome?: BinderEditingBulkOutcome) {
    super("coherence_failed", cause);
    this.name = "BinderEditingCoherenceError";
    this.outcome = outcome;
  }
}

export interface BinderEditingMarketPrice {
  amount: number;
  buyUrl?: string | null;
  currency: CurrencyCode;
  finish: string;
  priceDate: string;
  source: MarketPriceSource;
}

export interface BinderEditingMtgCardDetailSnapshot {
  oracleText?: string | null;
  scryfallId?: string | null;
  typeLine?: string | null;
}

export interface BinderEditingCardSnapshot {
  collectorNumber?: string | null;
  externalId: string;
  finishes: string[];
  id: string;
  imageUrl?: string | null;
  marketPrices: BinderEditingMarketPrice[];
  mtgCardDetail?: BinderEditingMtgCardDetailSnapshot | null;
  name: string;
  rarity?: string | null;
  releasedAt?: string | null;
  setCode?: string | null;
  setName?: string | null;
}

export interface BinderEditingCardInput {
  card: BinderEditingCardSnapshot;
  condition?: CardCondition;
  dynamicPriceRule?: string | null;
  finish?: string;
  language?: LanguageCode;
  note?: string;
  position?: number;
  priceAmount?: string | null;
  priceCurrency?: CurrencyCode | null;
  quantity?: number;
}

export interface BinderEditingCardUpdate {
  card?: BinderEditingCardSnapshot;
  cardId?: string;
  condition?: CardCondition;
  dynamicPriceRule?: string | null;
  finish?: string;
  language?: LanguageCode;
  note?: string | null;
  priceAmount?: string | null;
  priceCurrency?: CurrencyCode | null;
  quantity?: number;
}

export interface BinderEditingProgress {
  completed: number;
  total: number;
}

export interface BinderEditingBulkOutcome {
  applied: number;
  failed: number;
  failedIndexes: number[];
  skipped: number;
}

export interface BinderEditingBulkPriceCard {
  binderCardId: string;
  sourcePriceAmount: number | null;
}

export interface BinderEditingAddCardsRequest {
  cards: BinderEditingCardInput[];
  onProgress?: (progress: BinderEditingProgress) => void;
}

export interface BinderEditingBulkPriceRequest {
  cards: BinderEditingBulkPriceCard[];
  multiplier: number;
}

export interface BinderEditing {
  addCard: (card: BinderEditingCardInput) => Promise<void>;
  addCards: (
    request: BinderEditingAddCardsRequest
  ) => Promise<BinderEditingBulkOutcome>;
  applyCardKingdomMultiplier: (
    request: BinderEditingBulkPriceRequest
  ) => Promise<BinderEditingBulkOutcome>;
  removeCard: (binderCardId: string) => Promise<void>;
  removeCards: (binderCardIds: string[]) => Promise<BinderEditingBulkOutcome>;
  renameBinder: (name: string) => Promise<void>;
  updateBinderNote: (note: string) => Promise<void>;
  updateCard: (
    binderCardId: string,
    update: BinderEditingCardUpdate
  ) => Promise<void>;
}

export const isBinderEditingError = (
  error: unknown,
  reason?: BinderEditingFailureReason
): error is BinderEditingError => {
  return (
    error instanceof BinderEditingError &&
    (reason === undefined || error.reason === reason)
  );
};

export const isBinderEditingCoherenceError = (
  error: unknown
): error is BinderEditingCoherenceError => {
  return error instanceof BinderEditingCoherenceError;
};
