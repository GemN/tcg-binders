import { MarketPriceSource } from "@app/graphql";
import type { CSSProperties, ComponentProps } from "react";

import { cn } from "@/lib/utils";

type MarketPriceSourceIconPathMap = Partial<Record<MarketPriceSource, string>>;

interface MarketPriceSourceIconProps extends ComponentProps<"span"> {
  source: MarketPriceSource;
}

const marketPriceSourceIconPaths: MarketPriceSourceIconPathMap = {
  [MarketPriceSource.Cardkingdom]: "/ckd.svg",
  [MarketPriceSource.Cardmarket]: "/cardmarket.svg",
  [MarketPriceSource.Tcgplayer]: "/tcgplayer.svg",
};

export const MarketPriceSourceIcon = ({
  className,
  source,
  style,
  ...props
}: MarketPriceSourceIconProps) => {
  const iconPath = marketPriceSourceIconPaths[source];

  if (!iconPath) return null;

  const iconStyle: CSSProperties = {
    mask: `url(${iconPath}) center / contain no-repeat`,
    WebkitMask: `url(${iconPath}) center / contain no-repeat`,
    ...style,
  };

  return (
    <span
      aria-hidden="true"
      className={cn("size-4 shrink-0 bg-current", className)}
      style={iconStyle}
      {...props}
    />
  );
};
