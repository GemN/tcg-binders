import {
  CardCondition,
  CurrencyCode,
  LanguageCode,
} from "@app/graphql";
import { useCallback, useMemo, useRef, useState } from "react";

import { getPreferredCardFinish } from "@/config/card";
import {
  createDraftBinderEditingAdapter,
} from "@/lib/binderEditing/draftAdapter";
import type {
  DraftBinder,
  DraftBinderCard,
  DraftMarketPrice,
} from "@/lib/draftBinderTypes";

const DRAFT_BINDER_STORAGE_KEY = "tcgbinder:draft-binder";

const emptyDraftBinder: DraftBinder = {
  name: "",
  note: "",
  tcgId: "mtg",
  cards: [],
};

const createDraftId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
    finish: draftCard.finish || getPreferredCardFinish(finishes),
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
      imageUrl: draftCard.card.imageUrl,
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

  const binderEditing = useMemo(() => {
    return createDraftBinderEditingAdapter({
      store: {
        read: () => draftBinderRef.current,
        write: commitDraftBinder,
      },
    });
  }, [commitDraftBinder]);

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
    binderEditing,
    clearDraft,
  };
};
