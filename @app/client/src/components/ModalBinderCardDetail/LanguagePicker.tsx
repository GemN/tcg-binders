import type { LanguageCode } from "@app/graphql";

import { CountryFlag } from "@/components/CountryFlag";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { CARD_LANGUAGE_OPTIONS, cardLanguageFlagCodes } from "@/config/card";
import { cn } from "@/lib/utils";

interface CardLanguageLabelProps {
  label: string | null;
  language: LanguageCode;
}

const CardLanguageLabel = ({ label, language }: CardLanguageLabelProps) => (
  <span className="flex min-w-0 items-center gap-2">
    <span className="flex h-5 w-6 shrink-0 items-center justify-center">
      <CountryFlag
        code={cardLanguageFlagCodes[language]}
        className="h-3.5 w-5"
      />
    </span>
    <span className="truncate">{label}</span>
  </span>
);

export type LanguagePickerValue = LanguageCode | "all";

interface LanguagePickerProps {
  allLabel?: string;
  getLanguageLabel: (language: LanguageCode) => string | null;
  id?: string;
  label: string;
  labelClassName?: string;
  onChange: (language: LanguagePickerValue) => void;
  showAllOption?: boolean;
  triggerClassName?: string;
  value: LanguagePickerValue;
}

export const LanguagePicker = ({
  allLabel,
  getLanguageLabel,
  id,
  label,
  labelClassName,
  onChange,
  showAllOption = false,
  triggerClassName,
  value,
}: LanguagePickerProps) => (
  <label
    className={cn(
      "grid gap-1 text-xs font-medium text-muted-foreground",
      labelClassName
    )}
  >
    {label}
    <Select
      value={value}
      onValueChange={(language) => onChange(language as LanguagePickerValue)}
    >
      <SelectTrigger
        id={id}
        className={cn("w-full bg-input text-foreground", triggerClassName)}
      >
        <SelectValue>
          {value === "all" ? (
            allLabel
          ) : (
            <CardLanguageLabel
              language={value}
              label={getLanguageLabel(value)}
            />
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">{allLabel || "Any"}</SelectItem>
        )}
        {CARD_LANGUAGE_OPTIONS.map((language) => (
          <SelectItem
            key={language}
            value={language}
            textValue={getLanguageLabel(language) || language}
          >
            <CardLanguageLabel
              language={language}
              label={getLanguageLabel(language)}
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </label>
);
