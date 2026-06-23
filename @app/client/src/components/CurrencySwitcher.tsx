import { CircleDollarSign } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

const currencies = ["THB", "USD", "EUR", "GBP"] as const;
type Currency = (typeof currencies)[number];

export const CurrencySwitcher = () => {
  const { t } = useTranslation(["common"]);
  const [currency, setCurrency] = useState<Currency>("THB");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 px-2 sm:px-3">
          <CircleDollarSign className="size-4" />
          <span>{currency}</span>
          <span className="sr-only">{t("common:nav.currency")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currencies.map((currencyOption) => (
          <DropdownMenuItem
            key={currencyOption}
            onClick={() => setCurrency(currencyOption)}
            className={`cursor-pointer ${
              currency === currencyOption ? "bg-muted" : ""
            }`}
          >
            {currencyOption}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
