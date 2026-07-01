import {
  CardCondition,
  type CardSearchFieldsFragment,
  CurrencyCode,
  LanguageCode,
  MarketPriceSource,
} from "@app/graphql";
import { useCallback, useMemo, useRef, useState } from "react";

const DRAFT_BINDER_STORAGE_KEY = "tcgbinder:draft-binder";

export type DraftCardCondition = CardCondition;
export type DraftCardLanguage = LanguageCode;
export type DraftCardCurrency = CurrencyCode;

export interface DraftMarketPrice {
  source: MarketPriceSource;
  finish: string;
  amount: number;
  currency: DraftCardCurrency;
  priceDate: string;
  buyUrl?: string | null;
}

export interface DraftMtgCardDetail {
  oracleText?: string | null;
  typeLine?: string | null;
}

export interface DraftCardSnapshot {
  id: string;
  externalId: string;
  name: string;
  collectorNumber?: string | null;
  rarity?: string | null;
  finishes: string[];
  imageSmallUrl?: string | null;
  imageNormalUrl?: string | null;
  releasedAt?: string | null;
  setCode?: string | null;
  setName?: string | null;
  mtgCardDetail?: DraftMtgCardDetail | null;
  marketPrices: DraftMarketPrice[];
}

export interface DraftBinderCard {
  draftId: string;
  cardId: string;
  quantity: number;
  finish: string;
  condition: DraftCardCondition;
  language: DraftCardLanguage;
  dynamicPriceRule?: string | null;
  priceAmount?: string | null;
  priceCurrency?: DraftCardCurrency | null;
  note?: string;
  position: number;
  createdAt: string;
  card: DraftCardSnapshot;
}

export interface DraftBinder {
  name: string;
  note: string;
  tcgId: "mtg";
  cards: DraftBinderCard[];
}

export interface AddDraftCardOptions {
  condition?: DraftCardCondition;
  finish?: string;
  language?: DraftCardLanguage;
  priceAmount?: string | null;
  priceCurrency?: DraftCardCurrency | null;
  quantity?: number;
}

const emptyDraftBinder: DraftBinder = {
  name: "",
  note: "",
  tcgId: "mtg",
  cards: [],
};

const getDefaultFinish = (finishes: string[]): string => {
  if (finishes.includes("normal")) return "normal";
  if (finishes.includes("nonfoil")) return "normal";
  return finishes[0] || "normal";
};

const createDraftId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const createDraftCardSnapshot = (
  card: CardSearchFieldsFragment
): DraftCardSnapshot => {
  return {
    id: card.id,
    externalId: card.externalId,
    name: card.name,
    collectorNumber: card.collectorNumber,
    rarity: card.rarity,
    finishes: card.finishes.filter((finish): finish is string => !!finish),
    imageSmallUrl: card.imageSmallUrl,
    imageNormalUrl: card.imageNormalUrl,
    releasedAt: card.releasedAt,
    setCode: card.cardSet?.code,
    setName: card.cardSet?.name,
    mtgCardDetail: card.mtgCardDetail
      ? {
          oracleText: card.mtgCardDetail.oracleText,
          typeLine: card.mtgCardDetail.typeLine,
        }
      : null,
    marketPrices:
      card.marketPrices?.edges.map(({ node }) => ({
        source: node.source,
        finish: node.finish,
        amount: Number(node.amount),
        currency: node.currency,
        priceDate: node.priceDate,
        buyUrl: node.buyUrl,
      })) || [],
  };
};

const normalizeMarketPrice = (
  marketPrice: Partial<DraftMarketPrice>
): DraftMarketPrice | null => {
  if (!marketPrice.source || !marketPrice.finish || !marketPrice.currency) {
    return null;
  }

  const amount = Number(marketPrice.amount);
  if (!Number.isFinite(amount)) return null;

  return {
    source: marketPrice.source,
    finish: marketPrice.finish,
    amount,
    currency: marketPrice.currency,
    priceDate: marketPrice.priceDate || "",
    buyUrl: marketPrice.buyUrl,
  };
};

const normalizeDraftCard = (
  draftCard: Partial<DraftBinderCard>,
  position: number
): DraftBinderCard | null => {
  if (!draftCard.cardId || !draftCard.card?.id || !draftCard.card.name) {
    return null;
  }

  const finishes = Array.isArray(draftCard.card.finishes)
    ? draftCard.card.finishes.filter((finish): finish is string => !!finish)
    : [];

  return {
    draftId: draftCard.draftId || createDraftId(),
    cardId: draftCard.cardId,
    quantity: Math.max(1, Number(draftCard.quantity) || 1),
    finish: draftCard.finish || getDefaultFinish(finishes),
    condition: draftCard.condition || CardCondition.NearMint,
    language: draftCard.language || LanguageCode.En,
    dynamicPriceRule: draftCard.dynamicPriceRule || null,
    priceAmount: draftCard.priceAmount ?? null,
    priceCurrency: draftCard.priceCurrency || CurrencyCode.Thb,
    note: draftCard.note || "",
    position,
    createdAt: draftCard.createdAt || new Date().toISOString(),
    card: {
      id: draftCard.card.id,
      externalId: draftCard.card.externalId || "",
      name: draftCard.card.name,
      collectorNumber: draftCard.card.collectorNumber,
      rarity: draftCard.card.rarity,
      finishes,
      imageSmallUrl: draftCard.card.imageSmallUrl,
      imageNormalUrl: draftCard.card.imageNormalUrl,
      releasedAt: draftCard.card.releasedAt,
      setCode: draftCard.card.setCode,
      setName: draftCard.card.setName,
      mtgCardDetail: draftCard.card.mtgCardDetail || null,
      marketPrices: Array.isArray(draftCard.card.marketPrices)
        ? draftCard.card.marketPrices
            .map((marketPrice) => normalizeMarketPrice(marketPrice))
            .filter(
              (marketPrice): marketPrice is DraftMarketPrice => !!marketPrice
            )
        : [],
    },
  };
};

const normalizeDraftBinder = (
  draftBinder: Partial<DraftBinder>
): DraftBinder => {
  const cards = Array.isArray(draftBinder.cards)
    ? draftBinder.cards
        .map((draftCard, index) => normalizeDraftCard(draftCard, index))
        .filter((draftCard): draftCard is DraftBinderCard => !!draftCard)
    : [];

  return {
    ...emptyDraftBinder,
    ...draftBinder,
    note: draftBinder.note || "",
    tcgId: "mtg",
    cards,
  };
};

const readDraftBinder = (): DraftBinder => {
  const savedDraft = localStorage.getItem(DRAFT_BINDER_STORAGE_KEY);

  if (!savedDraft) {
    return emptyDraftBinder;
  }

  try {
    const parsed = JSON.parse(savedDraft) as DraftBinder;
    return normalizeDraftBinder(parsed);
  } catch {
    localStorage.removeItem(DRAFT_BINDER_STORAGE_KEY);
    return emptyDraftBinder;
  }
};

const writeDraftBinder = (draftBinder: DraftBinder): void => {
  localStorage.setItem(DRAFT_BINDER_STORAGE_KEY, JSON.stringify(draftBinder));
};

const appendDraftCard = (
  currentDraft: DraftBinder,
  card: DraftCardSnapshot,
  options: AddDraftCardOptions = {}
): DraftBinder => {
  const finish = options.finish || getDefaultFinish(card.finishes);
  const quantity = Math.max(1, Number(options.quantity) || 1);
  const existingCard = currentDraft.cards.find(
    (draftCard) => draftCard.cardId === card.id && draftCard.finish === finish
  );

  if (existingCard) {
    return {
      ...currentDraft,
      cards: currentDraft.cards.map((draftCard) =>
        draftCard.draftId === existingCard.draftId
          ? { ...draftCard, quantity: draftCard.quantity + quantity }
          : draftCard
      ),
    };
  }

  const position =
    currentDraft.cards.reduce(
      (maxPosition, draftCard) => Math.max(maxPosition, draftCard.position),
      -1
    ) + 1;

  return {
    ...currentDraft,
    cards: [
      ...currentDraft.cards,
      {
        draftId: createDraftId(),
        cardId: card.id,
        quantity,
        finish,
        condition: options.condition || CardCondition.NearMint,
        language: options.language || LanguageCode.En,
        dynamicPriceRule: null,
        priceAmount: options.priceAmount ?? null,
        priceCurrency: options.priceCurrency || CurrencyCode.Thb,
        note: "",
        position,
        createdAt: new Date().toISOString(),
        card,
      },
    ],
  };
};

export const useDraftBinder = () => {
  const [draftBinder, setDraftBinder] = useState<DraftBinder>(() =>
    readDraftBinder()
  );
  const draftBinderRef = useRef(draftBinder);

  const commitDraftBinder = useCallback(
    (updater: (currentDraft: DraftBinder) => DraftBinder) => {
      const nextDraft = normalizeDraftBinder(updater(draftBinderRef.current));

      draftBinderRef.current = nextDraft;
      writeDraftBinder(nextDraft);
      setDraftBinder(nextDraft);

      return nextDraft;
    },
    []
  );

  const sortedCards = useMemo(
    () => [...draftBinder.cards].sort((a, b) => a.position - b.position),
    [draftBinder.cards]
  );

  const setName = useCallback(
    (name: string) => {
      commitDraftBinder((currentDraft) => ({
        ...currentDraft,
        name,
      }));
    },
    [commitDraftBinder]
  );

  const setNote = useCallback(
    (note: string) => {
      commitDraftBinder((currentDraft) => ({
        ...currentDraft,
        note,
      }));
    },
    [commitDraftBinder]
  );

  const addCard = useCallback(
    (card: DraftCardSnapshot, options?: AddDraftCardOptions) => {
      commitDraftBinder((currentDraft) =>
        appendDraftCard(currentDraft, card, options)
      );
    },
    [commitDraftBinder]
  );

  const addCards = useCallback(
    (
      cards: {
        card: DraftCardSnapshot;
        options?: AddDraftCardOptions;
      }[]
    ) => {
      commitDraftBinder((currentDraft) =>
        cards.reduce(
          (nextDraft, item) =>
            appendDraftCard(nextDraft, item.card, item.options),
          currentDraft
        )
      );
    },
    [commitDraftBinder]
  );

  const updateCard = useCallback(
    (draftId: string, patch: Partial<DraftBinderCard>) => {
      const nextDraft = commitDraftBinder((currentDraft) => ({
        ...currentDraft,
        cards: currentDraft.cards.map((draftCard) =>
          draftCard.draftId === draftId
            ? {
                ...draftCard,
                ...patch,
                cardId: patch.card?.id || patch.cardId || draftCard.cardId,
                quantity: Math.max(1, patch.quantity ?? draftCard.quantity),
              }
            : draftCard
        ),
      }));

      return (
        nextDraft.cards.find((draftCard) => draftCard.draftId === draftId) ||
        null
      );
    },
    [commitDraftBinder]
  );

  const removeCard = useCallback(
    (draftId: string) => {
      commitDraftBinder((currentDraft) => ({
        ...currentDraft,
        cards: currentDraft.cards
          .filter((draftCard) => draftCard.draftId !== draftId)
          .map((draftCard, index) => ({ ...draftCard, position: index })),
      }));
    },
    [commitDraftBinder]
  );

  const removeCards = useCallback(
    (draftIds: string[]) => {
      const draftIdsToRemove = new Set(draftIds);

      commitDraftBinder((currentDraft) => ({
        ...currentDraft,
        cards: currentDraft.cards
          .filter((draftCard) => !draftIdsToRemove.has(draftCard.draftId))
          .map((draftCard, index) => ({ ...draftCard, position: index })),
      }));
    },
    [commitDraftBinder]
  );

  const clearDraft = useCallback(() => {
    draftBinderRef.current = emptyDraftBinder;
    setDraftBinder(emptyDraftBinder);
    localStorage.removeItem(DRAFT_BINDER_STORAGE_KEY);
  }, []);

  return {
    draftBinder: {
      ...draftBinder,
      cards: sortedCards,
    },
    setName,
    setNote,
    addCard,
    addCards,
    updateCard,
    removeCard,
    removeCards,
    clearDraft,
  };
};
