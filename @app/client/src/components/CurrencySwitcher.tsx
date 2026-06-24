import { CircleDollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  supportedCurrencies,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

export const CurrencySwitcher = () => {
  const { t } = useTranslation(["common"]);
  const { currency, setCurrency } = usePricingSettings();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="link" className="h-9 px-2 sm:px-3">
          <CircleDollarSign className="size-4" />
          <span>{currency}</span>
          <span className="sr-only">{t("common:nav.currency")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedCurrencies.map((currencyOption) => (
          <DropdownMenuItem
            key={currencyOption}
            onClick={() => setCurrency(currencyOption)}
            className={`cursor-pointer ${
              currency === currencyOption
                ? "bg-primary text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground"
                : ""
            }`}
          >
            {currencyOption}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
