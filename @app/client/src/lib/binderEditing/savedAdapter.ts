import type {
  BinderCardDetailFieldsFragment,
  BinderCardsInsertInput,
  BinderCardsUpdateInput,
} from "@app/graphql";

import {
  type BinderEditingBackend,
  type BinderEditingNormalizedCardInput,
  createBinderEditing,
} from "./core.ts";
import type { BinderEditing, BinderEditingCardUpdate } from "./types.ts";

export interface SavedBinderEditingUpdateResult {
  affectedCount: number;
  record?: BinderCardDetailFieldsFragment;
}

export interface SavedBinderEditingWrites {
  addCards: (objects: BinderCardsInsertInput[]) => Promise<number>;
  removeCard: (binderCardId: string) => Promise<number>;
  renameBinder: (binderId: string, name: string) => Promise<number>;
  updateBinderNote: (binderId: string, note: string) => Promise<number>;
  updateCard: (
    binderCardId: string,
    update: BinderCardsUpdateInput
  ) => Promise<SavedBinderEditingUpdateResult>;
}

export interface CreateSavedBinderEditingAdapterParams {
  binderId: string;
  onCardUpdated?: (binderCard: BinderCardDetailFieldsFragment) => void;
  refresh: () => Promise<unknown> | unknown;
  tcgId: string;
  writes: SavedBinderEditingWrites;
}

const createInsertInput = (
  binderId: string,
  tcgId: string,
  card: BinderEditingNormalizedCardInput
): BinderCardsInsertInput => ({
  binderId,
  cardId: card.card.id,
  condition: card.condition,
  dynamicPriceRule: card.dynamicPriceRule,
  finish: card.finish,
  language: card.language,
  note: card.note,
  position: card.position ?? 0,
  priceAmount: card.priceAmount,
  priceCurrency: card.priceCurrency,
  quantity: card.quantity,
  tcgId,
});

const createUpdateInput = (
  update: BinderEditingCardUpdate
): BinderCardsUpdateInput => ({
  ...(update.cardId !== undefined ? { cardId: update.cardId } : {}),
  ...(update.condition !== undefined ? { condition: update.condition } : {}),
  ...(update.dynamicPriceRule !== undefined
    ? { dynamicPriceRule: update.dynamicPriceRule }
    : {}),
  ...(update.finish !== undefined ? { finish: update.finish } : {}),
  ...(update.language !== undefined ? { language: update.language } : {}),
  ...(update.note !== undefined ? { note: update.note } : {}),
  ...(update.priceAmount !== undefined
    ? { priceAmount: update.priceAmount }
    : {}),
  ...(update.priceCurrency !== undefined
    ? { priceCurrency: update.priceCurrency }
    : {}),
  ...(update.quantity !== undefined ? { quantity: update.quantity } : {}),
});

export const createSavedBinderEditingAdapter = ({
  binderId,
  onCardUpdated,
  refresh,
  tcgId,
  writes,
}: CreateSavedBinderEditingAdapterParams): BinderEditing => {
  const backend: BinderEditingBackend<BinderCardDetailFieldsFragment> = {
    addCards: async (cards) => {
      const insertedCount = await writes.addCards(
        cards.map((card) => createInsertInput(binderId, tcgId, card))
      );
      if (insertedCount !== cards.length) throw new Error("write_failed");
    },
    cohere: async (updatedCard) => {
      if (updatedCard) {
        onCardUpdated?.(updatedCard);
      }
      await refresh();
    },
    removeCard: async (binderCardId) =>
      (await writes.removeCard(binderCardId)) > 0,
    renameBinder: async (name) =>
      (await writes.renameBinder(binderId, name)) > 0,
    updateBinderNote: async (note) =>
      (await writes.updateBinderNote(binderId, note)) > 0,
    updateCard: async (binderCardId, update) => {
      const result = await writes.updateCard(
        binderCardId,
        createUpdateInput(update)
      );
      return {
        applied: result.affectedCount > 0,
        updatedCard: result.record,
      };
    },
  };

  return createBinderEditing({ backend });
};
