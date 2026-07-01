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

interface CardLanguageLabelProps {
  label: string | null;
  language: LanguageCode;
}

const CardLanguageLabel = ({ label, language }: CardLanguageLabelProps) => (
  <span className="flex min-w-0 items-center gap-2">
    <CountryFlag
      code={cardLanguageFlagCodes[language]}
      className="h-3.5 w-5"
    />
    <span>{label}</span>
  </span>
);

interface LanguagePickerProps {
  getLanguageLabel: (language: LanguageCode) => string | null;
  label: string;
  onChange: (language: LanguageCode) => void;
  value: LanguageCode;
}

export const LanguagePicker = ({
  getLanguageLabel,
  label,
  onChange,
  value,
}: LanguagePickerProps) => (
  <label className="grid gap-1 text-xs font-medium text-[#6f6570]">
    {label}
    <Select
      value={value}
      onValueChange={(language) => onChange(language as LanguageCode)}
    >
      <SelectTrigger className="w-full bg-[#E8E8E8] text-[#343434]">
        <SelectValue>
          <CardLanguageLabel language={value} label={getLanguageLabel(value)} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
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
