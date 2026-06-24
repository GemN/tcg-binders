import type { CardsFilter } from "@app/graphql";

import type {
  BinderImportCardRecord,
  BinderImportInsertInput,
  BinderImportItem,
  BinderImportLookupBatch,
  BinderImportResolveResult,
  CreateBinderImportObjectsParams,
} from "./types";
import {
  cardLookupPageSize,
  chunkItems,
  externalIdLookupBatchSize,
  getAvailableFinish,
  getBatchSourceItems,
  getPrintKey,
  getPrintLookupKey,
  indexCardsForImport,
  normalizeValue,
  printLookupBatchSize,
  splitCardNameSeparator,
  uniqueItemsByKey,
} from "./utils";

export type { BinderTextExportItem } from "./text";
export type {
  BinderImportCardRecord,
  BinderImportFormat,
  BinderImportItem,
  BinderImportLookupBatch,
  BinderImportParseResult,
  BinderImportRejectedLine,
  BinderImportResolvedItem,
  BinderImportResolveResult,
} from "./types";
export { exportBinderImportText, parseBinderImportText } from "./text";
export { parseManaBoxCsvImport } from "./manabox";

export const createBinderImportLookupBatches = (
  items: BinderImportItem[],
  tcgId: string
): BinderImportLookupBatch[] => {
  const externalIdItems = items.filter((item) => item.externalId);
  const printItems = items.filter((item) => !item.externalId);
  const batches: BinderImportLookupBatch[] = [];

  chunkItems(
    uniqueItemsByKey(externalIdItems, (item) =>
      normalizeValue(item.externalId || "")
    ),
    externalIdLookupBatchSize
  ).forEach((chunk) => {
    batches.push({
      filter: {
        tcgId: { eq: tcgId },
        externalId: { in: chunk.map((item) => item.externalId as string) },
      },
      first: cardLookupPageSize,
      items: getBatchSourceItems(externalIdItems, chunk, (item) =>
        normalizeValue(item.externalId || "")
      ),
    });
  });

  chunkItems(
    uniqueItemsByKey(printItems, (item) => getPrintLookupKey(item)),
    printLookupBatchSize
  ).forEach((chunk) => {
    batches.push({
      filter: buildPrintLookupFilter(chunk, tcgId),
      first: cardLookupPageSize,
      items: getBatchSourceItems(printItems, chunk, getPrintLookupKey),
    });
  });

  return batches;
};

export const resolveBinderImportItems = (
  items: BinderImportItem[],
  cards: BinderImportCardRecord[]
): BinderImportResolveResult => {
  const { byExternalId, byPrintKey } = indexCardsForImport(cards);
  const matchedItems: BinderImportResolveResult["matchedItems"] = [];
  const unmatchedItems: BinderImportItem[] = [];

  items.forEach((item) => {
    const card =
      (item.externalId && byExternalId.get(normalizeValue(item.externalId))) ||
      byPrintKey.get(
        getPrintKey(item.name, item.setCode, item.collectorNumber)
      );

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

export const createBinderImportObjects = ({
  binderId,
  items,
  tcgId,
}: CreateBinderImportObjectsParams): BinderImportInsertInput[] => {
  return items.map(({ card, finish, item }) => ({
    binderId,
    cardId: card.id,
    condition: item.condition,
    finish,
    language: item.language,
    position: 0,
    priceAmount: item.priceAmount,
    priceCurrency: item.priceCurrency,
    quantity: item.quantity,
    tcgId,
  }));
};

const buildPrintLookupFilter = (
  items: BinderImportItem[],
  tcgId: string
): CardsFilter => {
  const or = items.map((item) => ({
    ...(item.collectorNumber
      ? { collectorNumber: { eq: item.collectorNumber } }
      : {}),
    or: [
      { name: { eq: item.name } },
      { name: { startsWith: `${item.name}${splitCardNameSeparator}` } },
    ],
  }));

  return {
    tcgId: { eq: tcgId },
    ...(or.length === 1 ? or[0] : { or }),
  };
};
