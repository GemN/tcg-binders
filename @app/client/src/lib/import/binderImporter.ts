import { parseManaBoxCsvImport } from "./manabox.ts";
import { resolveBinderImportItems } from "./resolution.ts";
import { parseBinderImportText } from "./text.ts";
import type {
  BinderImportCardCatalog,
  BinderImportDestination,
  BinderImporter,
} from "./types.ts";

export interface CreateBinderImporterParams {
  cardCatalog: BinderImportCardCatalog;
  destination: BinderImportDestination;
}

export const createBinderImporter = ({
  cardCatalog,
  destination,
}: CreateBinderImporterParams): BinderImporter => {
  return {
    commit: (items, onProgress) =>
      destination.importCards({ items, onProgress }),
    prepare: async ({ format, onProgress, tcgId, text }) => {
      const parseResult =
        format === "manabox_csv"
          ? parseManaBoxCsvImport(text)
          : parseBinderImportText(text);

      if (parseResult.items.length === 0) {
        return {
          matchedItems: [],
          rejectedLines: parseResult.rejectedLines,
          unmatchedItems: [],
        };
      }

      onProgress({ completed: 0, total: parseResult.items.length });
      const cards = await cardCatalog.findCards({
        items: parseResult.items,
        onProgress,
        tcgId,
      });
      const resolved = resolveBinderImportItems(parseResult.items, cards);

      return {
        ...resolved,
        rejectedLines: parseResult.rejectedLines,
      };
    },
  };
};
