import { MarketPriceSource } from "@app/graphql";
import { BadgeDollarSign, CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MarketPriceSourceIcon } from "@/components/MarketPriceSourceIcon";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  supportedPriceSources,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

const priceSourceLabels: Record<MarketPriceSource, string> = {
  [MarketPriceSource.Cardkingdom]: "Card Kingdom",
  [MarketPriceSource.Cardmarket]: "Cardmarket",
  [MarketPriceSource.Tcgplayer]: "TCGplayer",
};

export const PriceSourceSwitcher = () => {
  const { t } = useTranslation(["common"]);
  const { priceSource, setPriceSource } = usePricingSettings();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="link" className="h-9 px-2 sm:px-3">
          <BadgeDollarSign className="size-4" />
          <span>{priceSourceLabels[priceSource]}</span>
          <span className="sr-only">{t("common:nav.price_source")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <p className="max-w-56 px-2 py-1.5 text-xs leading-snug text-muted-foreground">
          {t("common:nav.price_source_description")}
        </p>
        {supportedPriceSources.map((source) => {
          const isSelected = priceSource === source;

          return (
            <DropdownMenuItem
              key={source}
              onClick={() => setPriceSource(source)}
              className="cursor-pointer pr-8"
            >
              <MarketPriceSourceIcon source={source} />
              {priceSourceLabels[source]}
              <CheckIcon
                aria-hidden="true"
                className={`absolute right-2 size-4 ${
                  isSelected ? "opacity-100" : "opacity-0"
                }`}
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
