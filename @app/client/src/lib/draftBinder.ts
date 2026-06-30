import {
  type BinderCardsInsertInput,
  type BinderCardsUpdateInput,
} from "@app/graphql";

import type {
  DraftBinderCard,
  DraftCardSnapshot,
} from "@/hooks/useDraftBinder";
import type {
  BinderCardDetailRecord,
  BinderCardRecord,
} from "@/lib/binderCardPricing";
import type { BinderSortMode } from "@/lib/binderPage";

interface SortableDraftBinderCard extends DraftBinderCard {
  card: DraftCardSnapshot;
}

const getSortablePriceAmount = (draftCard: DraftBinderCard): number | null => {
  const priceAmount = Number(draftCard.priceAmount);
  return Number.isFinite(priceAmount) ? priceAmount : null;
};

const compareNullableNumbers = (
  left: number | null,
  right: number | null,
  direction: "asc" | "desc"
): number => {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;

  return direction === "asc" ? left - right : right - left;
};

const compareNullableStringsDesc = (
  left: string | null | undefined,
  right: string | null | undefined
): number => {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  return right.localeCompare(left);
};

export const sortDraftBinderCards = (
  draftCards: DraftBinderCard[],
  sortMode: BinderSortMode
): DraftBinderCard[] => {
  return [...draftCards].sort((left, right) => {
    if (sortMode === "name") {
      return (
        left.card.name.localeCompare(right.card.name) ||
        compareNullableStringsDesc(left.card.releasedAt, right.card.releasedAt)
      );
    }

    if (sortMode === "release_date") {
      return (
        compareNullableStringsDesc(left.card.releasedAt, right.card.releasedAt) ||
        left.card.name.localeCompare(right.card.name)
      );
    }

    if (sortMode === "last_added") {
      return (
        compareNullableStringsDesc(left.createdAt, right.createdAt) ||
        left.position - right.position
      );
    }

    if (sortMode === "price_asc" || sortMode === "price_desc") {
      return (
        compareNullableNumbers(
          getSortablePriceAmount(left),
          getSortablePriceAmount(right),
          sortMode === "price_asc" ? "asc" : "desc"
        ) || left.card.name.localeCompare(right.card.name)
      );
    }

    return left.position - right.position;
  });
};

export const draftBinderCardToBinderCardRecord = (
  draftCard: SortableDraftBinderCard
): BinderCardDetailRecord => {
  return {
    __typename: "BinderCards",
    id: draftCard.draftId,
    condition: draftCard.condition,
    dynamicPriceRule: draftCard.dynamicPriceRule || null,
    finish: draftCard.finish,
    language: draftCard.language,
    priceAmount: draftCard.priceAmount ?? null,
    priceCurrency: draftCard.priceCurrency ?? null,
    quantity: draftCard.quantity,
    card: {
      __typename: "Cards",
      id: draftCard.card.id,
      name: draftCard.card.name,
      collectorNumber: draftCard.card.collectorNumber,
      finishes: draftCard.card.finishes,
      imageNormalUrl: draftCard.card.imageNormalUrl,
      imageSmallUrl: draftCard.card.imageSmallUrl,
      releasedAt: draftCard.card.releasedAt,
      cardSet: draftCard.card.setCode
        ? {
            __typename: "CardSets",
            code: draftCard.card.setCode,
            name: draftCard.card.setName,
          }
        : null,
      mtgCardDetail: draftCard.card.mtgCardDetail
        ? {
            __typename: "MtgCardDetails",
            oracleText: draftCard.card.mtgCardDetail.oracleText,
            typeLine: draftCard.card.mtgCardDetail.typeLine,
          }
        : null,
      marketPrices: {
        __typename: "CardMarketPricesConnection",
        edges: draftCard.card.marketPrices.map((marketPrice) => ({
          __typename: "CardMarketPricesEdge",
          node: {
            __typename: "CardMarketPrices",
            source: marketPrice.source,
            finish: marketPrice.finish,
            amount: marketPrice.amount,
            currency: marketPrice.currency,
            buyUrl: marketPrice.buyUrl,
          },
        })),
      },
    },
  } as BinderCardDetailRecord;
};

export const draftBinderCardsToBinderCardRecords = (
  draftCards: DraftBinderCard[]
): BinderCardRecord[] => {
  return draftCards.map(draftBinderCardToBinderCardRecord);
};

export const draftBinderCardToInsertInput = (
  binderId: string,
  draftCard: DraftBinderCard
): BinderCardsInsertInput => {
  return {
    binderId,
    cardId: draftCard.cardId,
    condition: draftCard.condition,
    dynamicPriceRule: draftCard.dynamicPriceRule,
    finish: draftCard.finish,
    language: draftCard.language,
    note: draftCard.note,
    position: draftCard.position,
    priceAmount: draftCard.priceAmount,
    priceCurrency: draftCard.priceCurrency,
    quantity: draftCard.quantity,
    tcgId: "mtg",
  };
};

export const binderCardsUpdateInputToDraftPatch = (
  set: BinderCardsUpdateInput
): Partial<DraftBinderCard> => {
  const patch: Partial<DraftBinderCard> = {};

  if (set.condition != null) patch.condition = set.condition;
  if (set.dynamicPriceRule !== undefined) {
    patch.dynamicPriceRule = set.dynamicPriceRule;
  }
  if (set.finish != null) patch.finish = set.finish;
  if (set.language != null) patch.language = set.language;
  if (set.note !== undefined) patch.note = set.note ?? "";
  if (set.priceAmount !== undefined) {
    patch.priceAmount =
      set.priceAmount === null ? null : String(set.priceAmount);
  }
  if (set.priceCurrency !== undefined) patch.priceCurrency = set.priceCurrency;
  if (set.quantity != null) patch.quantity = set.quantity;

  return patch;
};
