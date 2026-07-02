import { CardCondition, LanguageCode } from "@app/graphql";
import type { ReactNode } from "react";

import { CardConditionPicker } from "@/components/CardConditionPicker";
import {
  BinderCardVariantSelect,
  type BinderCardVariantSelectCard,
} from "@/components/ModalBinderCardDetail/BinderCardVariantSelect";
import { LanguagePicker } from "@/components/ModalBinderCardDetail/LanguagePicker";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

import type { BinderCardVariant, ModalBinderCardRecord } from "./types";

interface BinderCardEditableFieldsProps {
  binderCard: ModalBinderCardRecord;
  card: BinderCardVariantSelectCard | null | undefined;
  conditionLabel: string;
  finishLabel: string;
  finishOptions: string[];
  languageLabel: string;
  quantityInput: string;
  quantityLabel: string;
  variantLabel: string;
  onConditionChange: (condition: CardCondition) => void;
  onFinishChange: (finish: string) => void;
  onLanguageChange: (language: LanguageCode) => void;
  onQuantityChange: (value: string) => void;
  onQuantityCommit: () => void;
  onVariantChange: (variant: BinderCardVariant) => void;
  translateCardOption: (
    group: "condition" | "finish" | "language",
    value: string | null | undefined
  ) => string | null;
  pricingFields: ReactNode;
}

export const BinderCardEditableFields = ({
  binderCard,
  card,
  conditionLabel,
  finishLabel,
  finishOptions,
  languageLabel,
  quantityInput,
  quantityLabel,
  variantLabel,
  onConditionChange,
  onFinishChange,
  onLanguageChange,
  onQuantityChange,
  onQuantityCommit,
  onVariantChange,
  translateCardOption,
  pricingFields,
}: BinderCardEditableFieldsProps) => (
  <div className="grid gap-4 rounded-md border border-border bg-card p-4">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        {quantityLabel}
        <Input
          type="number"
          min={1}
          value={quantityInput}
          className="bg-input text-foreground"
          onChange={(event) => onQuantityChange(event.target.value)}
          onBlur={onQuantityCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </label>

      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        {finishLabel}
        <Select value={binderCard.finish} onValueChange={onFinishChange}>
          <SelectTrigger className="w-full bg-input text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(finishOptions.length > 0 ? finishOptions : ["normal"]).map(
              (finish) => (
                <SelectItem key={finish} value={finish}>
                  {translateCardOption("finish", finish)}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </label>

      <CardConditionPicker
        getConditionLabel={(condition) =>
          translateCardOption("condition", condition)
        }
        label={conditionLabel}
        labelClassName="text-xs text-muted-foreground"
        triggerClassName="w-full bg-input text-foreground"
        value={binderCard.condition}
        onChange={(condition) => {
          if (condition !== "all") onConditionChange(condition);
        }}
      />

      <LanguagePicker
        label={languageLabel}
        value={binderCard.language}
        onChange={(language) => {
          if (language !== "all") onLanguageChange(language);
        }}
        getLanguageLabel={(language) =>
          translateCardOption("language", language)
        }
      />

      <BinderCardVariantSelect
        card={card}
        label={variantLabel}
        onVariantChange={onVariantChange}
      />
    </div>

    {pricingFields}
  </div>
);
