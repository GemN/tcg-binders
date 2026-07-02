import { MarketPriceSource } from "@app/graphql";

export type MarketPriceSourceClassNameMap = Record<MarketPriceSource, string>;

export const marketPriceSourceClassNames: MarketPriceSourceClassNameMap = {
  [MarketPriceSource.Cardkingdom]: "text-market-source-cardkingdom",
  [MarketPriceSource.Cardmarket]: "text-market-source-cardmarket",
  [MarketPriceSource.Tcgplayer]: "text-market-source-tcgplayer",
};
