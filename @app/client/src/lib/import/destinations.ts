import type {
  BinderCardsInsertInput,
  CardCondition,
  CurrencyCode,
  LanguageCode,
} from "@app/graphql";

import type {
  BinderImportDestination,
  BinderImportResolvedItem,
  ImportBinderCardsHandler,
} from "./types";

const importChunkSize = 50;

interface AddBinderCardsOptions {
  variables: {
    objects: BinderCardsInsertInput[];
  };
}

type AddBinderCards = (options: AddBinderCardsOptions) => Promise<unknown>;

export interface CreateSavedBinderImportDestinationParams {
  addBinderCards: AddBinderCards;
  binderId: string;
  tcgId: string;
}

export interface CreateCallbackImportDestinationParams {
  importCards: ImportBinderCardsHandler;
  tcgId: string;
}

const createInsertInput = (
  binderId: string,
  tcgId: string,
  { card, finish, item }: BinderImportResolvedItem
): BinderCardsInsertInput => {
  return {
    binderId,
    cardId: card.id,
    condition: item.condition as CardCondition,
    finish,
    language: item.language as LanguageCode,
    position: 0,
    priceAmount: item.priceAmount,
    priceCurrency: item.priceCurrency as CurrencyCode | undefined,
    quantity: item.quantity,
    tcgId,
  };
};

export const createSavedBinderImportDestination = ({
  addBinderCards,
  binderId,
  tcgId,
}: CreateSavedBinderImportDestinationParams): BinderImportDestination => {
  return {
    importCards: async ({ items, onProgress }) => {
      const objects = items.map((item) =>
        createInsertInput(binderId, tcgId, item)
      );
      const failedItems: BinderImportResolvedItem[] = [];
      let importedCount = 0;

      for (let index = 0; index < items.length; index += importChunkSize) {
        const itemChunk = items.slice(index, index + importChunkSize);
        const objectChunk = objects.slice(index, index + importChunkSize);

        try {
          await addBinderCards({ variables: { objects: objectChunk } });
          importedCount += objectChunk.length;
          onProgress({
            completed: importedCount + failedItems.length,
            total: items.length,
          });
        } catch (chunkError) {
          if (objectChunk.length === 1) {
            failedItems.push(itemChunk[0]);
            console.error(chunkError);
            onProgress({
              completed: importedCount + failedItems.length,
              total: items.length,
            });
            continue;
          }

          for (
            let itemIndex = 0;
            itemIndex < objectChunk.length;
            itemIndex += 1
          ) {
            try {
              await addBinderCards({
                variables: { objects: [objectChunk[itemIndex]] },
              });
              importedCount += 1;
            } catch (itemError) {
              failedItems.push(itemChunk[itemIndex]);
              console.error(itemError);
            }
            onProgress({
              completed: importedCount + failedItems.length,
              total: items.length,
            });
          }
        }
      }

      return {
        failedInsertCount: failedItems.length,
        failedItems,
        importedCount,
      };
    },
  };
};

export const createCallbackImportDestination = ({
  importCards,
  tcgId,
}: CreateCallbackImportDestinationParams): BinderImportDestination => {
  return {
    importCards: ({ items, onProgress }) =>
      Promise.resolve(
        importCards({
          items,
          onProgress: (completed) =>
            onProgress({ completed, total: items.length }),
          tcgId,
        })
      ),
  };
};
