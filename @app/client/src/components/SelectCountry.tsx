import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { CountryFlag } from "@/components/CountryFlag";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select.tsx";
import { countries } from "@/lib/countries.ts";

interface SelectCountryProps {
  placeholder?: string;
  onChange?: (value: string) => void;
  value?: string;
  canUnselect?: boolean;
}

export const SelectCountry: FC<SelectCountryProps> = ({
  placeholder,
  value,
  onChange,
  canUnselect,
}) => {
  const { t } = useTranslation(["common"]);
  const handleChange = (value: string) => {
    onChange?.(value === "unassign" ? "" : value);
  };
  return (
    <Select onValueChange={handleChange} value={value}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {canUnselect && (
          <SelectItem value="unassign">
            {t("common:form.no_country")}
          </SelectItem>
        )}
        {countries.map((country) => (
          <SelectItem key={country.isoCode} value={country.isoCode}>
            <span className="flex items-center gap-2">
              <CountryFlag
                code={country.isoCode}
                className="h-3.5 w-5"
                label={country.name}
              />
              <span>{country.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
