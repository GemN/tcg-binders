import { CheckIcon, CircleDollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { getCurrencySymbol } from "@/lib/currency";
import {
  supportedCurrencies,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

export const CurrencySwitcher = () => {
  const { t } = useTranslation(["common"]);
  const { currency, setCurrency } = usePricingSettings();
  const getCurrencyLabel = (currencyCode: string) => {
    const symbol = getCurrencySymbol(currencyCode);
    return symbol ? `${currencyCode} ${symbol}` : currencyCode;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="link" className="h-9 px-2 sm:px-3">
          <CircleDollarSign className="size-4" />
          <span>{getCurrencyLabel(currency)}</span>
          <span className="sr-only">{t("common:nav.currency")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedCurrencies.map((currencyOption) => {
          const isSelected = currency === currencyOption;

          return (
            <DropdownMenuItem
              key={currencyOption}
              onClick={() => setCurrency(currencyOption)}
              className="cursor-pointer pr-8"
            >
              {getCurrencyLabel(currencyOption)}
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
