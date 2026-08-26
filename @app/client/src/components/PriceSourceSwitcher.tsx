import { MarketPriceSource } from "@app/graphql";
import { CheckIcon, Database } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MarketPriceSourceIcon } from "@/components/MarketPriceSourceIcon";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const {
    priceSource,
    setPriceSource,
    setShowConvertedMarketPrices,
    showConvertedMarketPrices,
  } = usePricingSettings();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="link" className="h-9 px-2 sm:px-3">
          <Database className="size-4" />
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
        <DropdownMenuSeparator />
        <p className="max-w-56 px-2 py-1.5 text-xs leading-snug text-muted-foreground">
          {t("common:nav.display_prices_converted_description")}
        </p>
        <DropdownMenuCheckboxItem
          checked={showConvertedMarketPrices}
          onSelect={(event) => event.preventDefault()}
          onCheckedChange={setShowConvertedMarketPrices}
          className="cursor-pointer pl-2 [&>span:first-child]:hidden"
        >
          <span>{t("common:nav.display_prices_converted")}</span>
          <span
            aria-hidden="true"
            className={`ml-auto inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all ${
              showConvertedMarketPrices ? "bg-secondary" : "bg-tertiary"
            }`}
          >
            <span
              className={`block size-4 rounded-full bg-background transition-transform ${
                showConvertedMarketPrices
                  ? "translate-x-[calc(100%-2px)]"
                  : "translate-x-0"
              }`}
            />
          </span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
