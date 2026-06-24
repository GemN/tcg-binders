import { CardCondition, CurrencyCode, LanguageCode } from "@app/graphql";
import { useCallback, useMemo, useRef, useState } from "react";

const DRAFT_BINDER_STORAGE_KEY = "tcgbinder:draft-binder";

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

export type DraftCardCondition = (typeof CARD_CONDITION_OPTIONS)[number];
export type DraftCardLanguage = (typeof CARD_LANGUAGE_OPTIONS)[number];
export type DraftCardCurrency = (typeof CARD_CURRENCY_OPTIONS)[number];

export interface DraftMarketPrice {
  source: string;
  finish: string;
  amount: number;
  currency: DraftCardCurrency;
  priceDate: string;
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
  marketPrices: DraftMarketPrice[];
}

export interface DraftBinderCard {
  draftId: string;
  cardId: string;
  quantity: number;
  finish: string;
  condition: DraftCardCondition;
  language: DraftCardLanguage;
  priceAmount?: string;
  priceCurrency?: DraftCardCurrency;
  note?: string;
  position: number;
  card: DraftCardSnapshot;
}

export interface DraftBinder {
  name: string;
  tcgId: "mtg";
  cards: DraftBinderCard[];
}

const emptyDraftBinder: DraftBinder = {
  name: "",
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
    priceAmount: draftCard.priceAmount,
    priceCurrency: draftCard.priceCurrency || CurrencyCode.Thb,
    note: draftCard.note || "",
    position,
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
      marketPrices: Array.isArray(draftCard.card.marketPrices)
        ? draftCard.card.marketPrices
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

  const addCard = useCallback(
    (card: DraftCardSnapshot) => {
      const finish = getDefaultFinish(card.finishes);

      commitDraftBinder((currentDraft) => {
        const existingCard = currentDraft.cards.find(
          (draftCard) =>
            draftCard.cardId === card.id && draftCard.finish === finish
        );

        if (existingCard) {
          return {
            ...currentDraft,
            cards: currentDraft.cards.map((draftCard) =>
              draftCard.draftId === existingCard.draftId
                ? { ...draftCard, quantity: draftCard.quantity + 1 }
                : draftCard
            ),
          };
        }

        const position =
          currentDraft.cards.reduce(
            (maxPosition, draftCard) =>
              Math.max(maxPosition, draftCard.position),
            -1
          ) + 1;

        return {
          ...currentDraft,
          cards: [
            ...currentDraft.cards,
            {
              draftId: createDraftId(),
              cardId: card.id,
              quantity: 1,
              finish,
              condition: CardCondition.NearMint,
              language: LanguageCode.En,
              priceCurrency: CurrencyCode.Thb,
              position,
              card,
            },
          ],
        };
      });
    },
    [commitDraftBinder]
  );

  const updateCard = useCallback(
    (draftId: string, patch: Partial<DraftBinderCard>) => {
      commitDraftBinder((currentDraft) => ({
        ...currentDraft,
        cards: currentDraft.cards.map((draftCard) =>
          draftCard.draftId === draftId
            ? {
                ...draftCard,
                ...patch,
                quantity: Math.max(1, patch.quantity ?? draftCard.quantity),
              }
            : draftCard
        ),
      }));
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
    addCard,
    updateCard,
    removeCard,
    clearDraft,
  };
};
