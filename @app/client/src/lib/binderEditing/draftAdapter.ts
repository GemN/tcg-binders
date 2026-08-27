import type { DraftBinder, DraftBinderCard } from "../draftBinderTypes.ts";
import {
  type BinderEditingBackend,
  type BinderEditingNormalizedCardInput,
  createBinderEditing,
} from "./core.ts";
import { binderEditingDomainDefaults, type BinderEditing } from "./types.ts";

export interface DraftBinderEditingStore {
  read: () => DraftBinder;
  write: (updater: (currentDraft: DraftBinder) => DraftBinder) => DraftBinder;
}

export interface CreateDraftBinderEditingAdapterParams {
  store: DraftBinderEditingStore;
}

const createDraftId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const appendDraftCard = (
  currentDraft: DraftBinder,
  input: BinderEditingNormalizedCardInput
): DraftBinder => {
  const nextCard: DraftBinderCard = {
    card: input.card,
    cardId: input.card.id,
    condition: input.condition ?? binderEditingDomainDefaults.condition,
    createdAt: new Date().toISOString(),
    draftId: createDraftId(),
    dynamicPriceRule: input.dynamicPriceRule ?? null,
    finish: input.finish,
    language: input.language ?? binderEditingDomainDefaults.language,
    note: input.note,
    position: 0,
    priceAmount: input.priceAmount ?? null,
    priceCurrency: input.priceCurrency ?? binderEditingDomainDefaults.currency,
    quantity: input.quantity,
  };
  const requestedPosition = input.position;
  const insertionIndex =
    requestedPosition === undefined
      ? currentDraft.cards.length
      : Math.min(
          Math.max(Math.floor(requestedPosition), 0),
          currentDraft.cards.length
        );
  const cards = [...currentDraft.cards];
  cards.splice(insertionIndex, 0, nextCard);

  return {
    ...currentDraft,
    cards: cards.map((draftCard, position) => ({
      ...draftCard,
      position,
    })),
  };
};

export const createDraftBinderEditingAdapter = ({
  store,
}: CreateDraftBinderEditingAdapterParams): BinderEditing => {
  const backend: BinderEditingBackend = {
    addCards: async (cards) => {
      store.write((currentDraft) =>
        cards.reduce(
          (nextDraft, item) => appendDraftCard(nextDraft, item),
          currentDraft
        )
      );
    },
    cohere: async () => undefined,
    removeCard: async (binderCardId) => {
      if (
        !store
          .read()
          .cards.some((draftCard) => draftCard.draftId === binderCardId)
      ) {
        return false;
      }

      store.write((currentDraft) => ({
        ...currentDraft,
        cards: currentDraft.cards
          .filter((draftCard) => draftCard.draftId !== binderCardId)
          .map((draftCard, position) => ({ ...draftCard, position })),
      }));
      return true;
    },
    renameBinder: async (name) => {
      store.write((currentDraft) => ({ ...currentDraft, name }));
      return true;
    },
    updateBinderNote: async (note) => {
      store.write((currentDraft) => ({ ...currentDraft, note }));
      return true;
    },
    updateCard: async (binderCardId, update) => {
      if (
        !store
          .read()
          .cards.some((draftCard) => draftCard.draftId === binderCardId)
      ) {
        return { applied: false };
      }

      const patch: Partial<DraftBinderCard> = {
        ...(update.card
          ? {
              card: update.card,
              cardId: update.card.id,
            }
          : {}),
        ...(update.cardId ? { cardId: update.cardId } : {}),
        ...(update.condition ? { condition: update.condition } : {}),
        ...(update.dynamicPriceRule !== undefined
          ? { dynamicPriceRule: update.dynamicPriceRule }
          : {}),
        ...(update.finish ? { finish: update.finish } : {}),
        ...(update.language ? { language: update.language } : {}),
        ...(update.note !== undefined ? { note: update.note || "" } : {}),
        ...(update.priceAmount !== undefined
          ? { priceAmount: update.priceAmount }
          : {}),
        ...(update.priceCurrency !== undefined
          ? { priceCurrency: update.priceCurrency }
          : {}),
        ...(update.quantity !== undefined ? { quantity: update.quantity } : {}),
      };
      store.write((currentDraft) => ({
        ...currentDraft,
        cards: currentDraft.cards.map((draftCard) =>
          draftCard.draftId === binderCardId
            ? {
                ...draftCard,
                ...patch,
                cardId: patch.card?.id || patch.cardId || draftCard.cardId,
                quantity: Math.max(1, patch.quantity ?? draftCard.quantity),
              }
            : draftCard
        ),
      }));
      return { applied: true };
    },
  };

  return createBinderEditing({ backend });
};
