import { createBinderEditingCardSnapshot } from "../binderEditing/cardSnapshot.ts";
import type {
  BinderEditing,
  BinderEditingBulkOutcome,
  BinderEditingCardInput,
} from "../binderEditing/types.ts";
import { isBinderEditingCoherenceError } from "../binderEditing/types.ts";
import type {
  BinderImportDestination,
  BinderImportResolvedItem,
} from "./types";

export interface CreateBinderEditingImportDestinationParams {
  binderEditing: BinderEditing;
}

const createCardInput = ({
  card,
  finish,
  item,
}: BinderImportResolvedItem): BinderEditingCardInput => ({
  card: createBinderEditingCardSnapshot(card),
  condition: item.condition,
  finish,
  language: item.language,
  priceAmount: item.priceAmount,
  priceCurrency: item.priceCurrency,
  quantity: item.quantity,
});

export const createBinderEditingImportDestination = ({
  binderEditing,
}: CreateBinderEditingImportDestinationParams): BinderImportDestination => ({
  importCards: async ({ items, onProgress }) => {
    let coherenceFailed = false;
    let outcome: BinderEditingBulkOutcome;

    try {
      outcome = await binderEditing.addCards({
        cards: items.map(createCardInput),
        onProgress,
      });
    } catch (error) {
      if (!isBinderEditingCoherenceError(error) || !error.outcome) {
        throw error;
      }

      coherenceFailed = true;
      outcome = error.outcome;
    }

    return {
      ...(coherenceFailed ? { coherenceFailed: true } : {}),
      failedInsertCount: outcome.failed,
      failedItems: outcome.failedIndexes.map((index) => items[index]),
      importedCount: outcome.applied,
    };
  },
});
