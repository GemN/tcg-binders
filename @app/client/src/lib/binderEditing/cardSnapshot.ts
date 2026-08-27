import type { CurrencyCode, MarketPriceSource } from "@app/graphql";

import type { BinderEditingCardSnapshot } from "./types";

interface BinderEditingCardSetSource {
  code?: string | null;
  name?: string | null;
}

interface BinderEditingMarketPriceNodeSource {
  amount: number | string;
  buyUrl?: string | null;
  currency: CurrencyCode;
  finish: string;
  priceDate?: string;
  source: MarketPriceSource;
}

interface BinderEditingMarketPriceEdgeSource {
  node: BinderEditingMarketPriceNodeSource;
}

interface BinderEditingMarketPricesSource {
  edges: BinderEditingMarketPriceEdgeSource[];
}

interface BinderEditingMtgCardDetailSource {
  oracleText?: string | null;
  scryfallId?: string | null;
  typeLine?: string | null;
}

interface BinderEditingCardSnapshotSource {
  cardSet?: BinderEditingCardSetSource | null;
  collectorNumber?: string | null;
  externalId: string;
  finishes: Array<string | null>;
  id: string;
  imageUrl?: string | null;
  marketPrices?: BinderEditingMarketPricesSource | null;
  mtgCardDetail?: BinderEditingMtgCardDetailSource | null;
  name: string;
  rarity?: string | null;
  releasedAt?: string | null;
}

export const createBinderEditingCardSnapshot = (
  card: BinderEditingCardSnapshotSource
): BinderEditingCardSnapshot => ({
  id: card.id,
  externalId: card.externalId,
  name: card.name,
  collectorNumber: card.collectorNumber,
  rarity: card.rarity,
  finishes: card.finishes.filter((finish): finish is string => !!finish),
  imageUrl: card.imageUrl,
  releasedAt: card.releasedAt,
  setCode: card.cardSet?.code,
  setName: card.cardSet?.name,
  mtgCardDetail: card.mtgCardDetail
    ? {
        oracleText: card.mtgCardDetail.oracleText,
        scryfallId: card.mtgCardDetail.scryfallId,
        typeLine: card.mtgCardDetail.typeLine,
      }
    : null,
  marketPrices:
    card.marketPrices?.edges.map(({ node }) => ({
      source: node.source,
      finish: node.finish,
      amount: Number(node.amount),
      currency: node.currency,
      priceDate: node.priceDate || "",
      buyUrl: node.buyUrl,
    })) || [],
});
