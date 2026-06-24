import { MarketPriceSource } from "@app/graphql";
import { BadgeDollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

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
        {supportedPriceSources.map((source) => (
          <DropdownMenuItem
            key={source}
            onClick={() => setPriceSource(source)}
            className={`cursor-pointer ${
              priceSource === source
                ? "bg-primary text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground"
                : ""
            }`}
          >
            {priceSourceLabels[source]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
