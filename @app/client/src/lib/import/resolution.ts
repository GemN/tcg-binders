import type {
  BinderImportCardRecord,
  BinderImportItem,
  BinderImportResolveResult,
} from "./types.ts";
import {
  getAvailableFinish,
  getPrintKey,
  indexCardsForImport,
  normalizeValue,
} from "./utils.ts";

export const resolveBinderImportItems = (
  items: BinderImportItem[],
  cards: BinderImportCardRecord[]
): BinderImportResolveResult => {
  const { byExternalId, byName, byPrintKey } = indexCardsForImport(cards);
  const matchedItems: BinderImportResolveResult["matchedItems"] = [];
  const unmatchedItems: BinderImportItem[] = [];

  items.forEach((item) => {
    const card =
      (item.externalId && byExternalId.get(normalizeValue(item.externalId))) ||
      (item.setCode || item.collectorNumber
        ? byPrintKey.get(
            getPrintKey(item.name, item.setCode, item.collectorNumber)
          )
        : byName.get(normalizeValue(item.name)));

    if (!card) {
      unmatchedItems.push(item);
      return;
    }

    matchedItems.push({
      card,
      finish: getAvailableFinish(item.finish, card.finishes),
      item,
    });
  });

  return { matchedItems, unmatchedItems };
};
