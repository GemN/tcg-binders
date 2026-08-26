import type {
  CardSearchFieldsFragment,
  CardsFilter,
  CardsForBinderImportQuery,
  CardsForBinderImportQueryVariables,
} from "@app/graphql";

import type {
  BinderImportCardCatalog,
  BinderImportCardRecord,
  BinderImportItem,
} from "./types";
import {
  cardLookupPageSize,
  chunkItems,
  externalIdLookupBatchSize,
  getBatchSourceItems,
  getPrintLookupKey,
  normalizeValue,
  printLookupBatchSize,
  splitCardNameSeparator,
  uniqueItemsByKey,
} from "./utils";

interface GraphqlCardLookupBatch {
  filter: CardsFilter;
  first: number;
  items: BinderImportItem[];
}

interface GraphqlCardCatalogQueryResult {
  data?: CardsForBinderImportQuery;
}

type GraphqlCardCatalogQuery = (options: {
  variables: CardsForBinderImportQueryVariables;
}) => Promise<GraphqlCardCatalogQueryResult>;

export interface CreateGraphqlCardCatalogParams {
  loadCards: GraphqlCardCatalogQuery;
}

const escapeLikePattern = (value: string): string => {
  return value.replace(/[\\%_]/g, "\\$&");
};

const buildPrintLookupFilter = (
  items: BinderImportItem[],
  tcgId: string
): CardsFilter => {
  const or = items.map((item) => {
    const escapedName = escapeLikePattern(item.name);

    return {
      ...(item.collectorNumber
        ? { collectorNumber: { eq: item.collectorNumber } }
        : {}),
      or: [
        { name: { ilike: escapedName } },
        { name: { ilike: `${escapedName}${splitCardNameSeparator}%` } },
      ],
    };
  });

  return {
    tcgId: { eq: tcgId },
    ...(or.length === 1 ? or[0] : { or }),
  };
};

export const createGraphqlCardLookupBatches = (
  items: BinderImportItem[],
  tcgId: string
): GraphqlCardLookupBatch[] => {
  const externalIdItems = items.filter((item) => item.externalId);
  const printItems = items.filter((item) => !item.externalId);
  const batches: GraphqlCardLookupBatch[] = [];

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
    uniqueItemsByKey(printItems, getPrintLookupKey),
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

const mapGraphqlCard = (
  card: CardSearchFieldsFragment
): BinderImportCardRecord => {
  return {
    cardSet: card.cardSet,
    collectorNumber: card.collectorNumber,
    externalId: card.externalId,
    finishes: card.finishes,
    id: card.id,
    imageUrl: card.imageUrl,
    marketPrices: card.marketPrices,
    mtgCardDetail: card.mtgCardDetail,
    name: card.name,
    rarity: card.rarity,
    releasedAt: card.releasedAt,
  };
};

export const createGraphqlCardCatalog = ({
  loadCards,
}: CreateGraphqlCardCatalogParams): BinderImportCardCatalog => {
  return {
    findCards: async ({ items, onProgress, tcgId }) => {
      const batches = createGraphqlCardLookupBatches(items, tcgId);
      const cardsById = new Map<string, BinderImportCardRecord>();
      let completedItems = 0;

      for (const batch of batches) {
        let after: string | null | undefined;
        let hasNextPage = true;

        while (hasNextPage) {
          const result = await loadCards({
            variables: {
              after,
              filter: batch.filter,
              first: batch.first,
            },
          });
          const collection = result.data?.cardsCollection;

          collection?.edges.forEach(({ node }) => {
            cardsById.set(node.id, mapGraphqlCard(node));
          });

          after = collection?.pageInfo.endCursor;
          hasNextPage = !!collection?.pageInfo.hasNextPage && !!after;
        }

        completedItems += batch.items.length;
        onProgress({ completed: completedItems, total: items.length });
      }

      return [...cardsById.values()];
    },
  };
};
