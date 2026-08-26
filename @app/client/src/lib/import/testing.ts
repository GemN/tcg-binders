import type {
  BinderImportCardCatalog,
  BinderImportCardRecord,
  BinderImportDestination,
  BinderImportResolvedItem,
} from "./types.ts";

export const createInMemoryCardCatalog = (
  cards: BinderImportCardRecord[]
): BinderImportCardCatalog => {
  return {
    findCards: async ({ items, onProgress }) => {
      onProgress({ completed: items.length, total: items.length });
      return cards;
    },
  };
};

export interface InMemoryImportDestination extends BinderImportDestination {
  importedItems: BinderImportResolvedItem[];
}

export const createInMemoryImportDestination = (): InMemoryImportDestination => {
  const importedItems: BinderImportResolvedItem[] = [];

  return {
    importedItems,
    importCards: async ({ items, onProgress }) => {
      importedItems.push(...items);
      onProgress({ completed: items.length, total: items.length });

      return {
        failedInsertCount: 0,
        importedCount: items.length,
      };
    },
  };
};
