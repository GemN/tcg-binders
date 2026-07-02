import { Check, ChevronsUpDown } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";

import { CountryFlag } from "@/components/CountryFlag";
import { Button } from "@/components/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/Command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  countries,
  countriesByISOCode,
  type ISOCode,
} from "@/lib/countries.ts";
import { cn } from "@/lib/utils";

const initialCountryLimit = 30;

interface SelectCountryProps {
  placeholder?: string;
  onChange?: (value: string) => void;
  value?: string;
  canUnselect?: boolean;
  disabled?: boolean;
}

export const SelectCountry: FC<SelectCountryProps> = ({
  placeholder,
  value,
  onChange,
  canUnselect,
  disabled,
}) => {
  const { t } = useTranslation(["common"]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedCountry = value
    ? countriesByISOCode[value as ISOCode]
    : undefined;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleCountries = normalizedSearchQuery
    ? countries.filter((country) => {
        return (
          country.name.toLowerCase().includes(normalizedSearchQuery) ||
          country.isoCode.toLowerCase().includes(normalizedSearchQuery)
        );
      })
    : countries.slice(0, initialCountryLimit);
  const visibleCountriesWithSelected =
    !normalizedSearchQuery &&
    selectedCountry &&
    !visibleCountries.some(
      (country) => country.isoCode === selectedCountry.isoCode
    )
      ? [selectedCountry, ...visibleCountries]
      : visibleCountries;

  const handleSelect = (value: string) => {
    onChange?.(value);
    setOpen(false);
    setSearchQuery("");
  };

  const handleUnselect = () => {
    onChange?.("");
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          <span className="flex min-w-0 items-center gap-2">
            {selectedCountry && (
              <CountryFlag
                code={selectedCountry.isoCode}
                className="h-3.5 w-5"
                label={selectedCountry.name}
              />
            )}
            <span className="truncate">
              {selectedCountry?.name || placeholder}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {!visibleCountries.length && (
              <CommandEmpty>{t("common:no_results")}</CommandEmpty>
            )}
            <ScrollArea className="max-h-[260px] overflow-auto">
              <CommandGroup>
                {canUnselect && (
                  <CommandItem
                    value={t("common:form.no_country")}
                    onSelect={handleUnselect}
                    className="cursor-pointer"
                  >
                    {t("common:form.no_country")}
                    <Check
                      className={cn(
                        "ml-auto",
                        value ? "opacity-0" : "opacity-100"
                      )}
                    />
                  </CommandItem>
                )}
                {visibleCountriesWithSelected.map((country) => (
                  <CommandItem
                    key={country.isoCode}
                    value={`${country.name} ${country.isoCode}`}
                    onSelect={() => handleSelect(country.isoCode)}
                    className="cursor-pointer"
                  >
                    <CountryFlag
                      code={country.isoCode}
                      className="h-3.5 w-5"
                      label={country.name}
                    />
                    <span>{country.name}</span>
                    <Check
                      className={cn(
                        "ml-auto",
                        country.isoCode === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
