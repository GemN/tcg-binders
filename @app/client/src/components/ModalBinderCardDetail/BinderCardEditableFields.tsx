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
  <div className="grid gap-4 rounded-md border border-border bg-surface p-4">
    <div className="grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:gap-3">
      <label className="grid min-w-0 gap-1 font-display text-[12px] font-normal text-black">
        {quantityLabel}
        <Input
          type="number"
          min={1}
          value={quantityInput}
          onChange={(event) => onQuantityChange(event.target.value)}
          onBlur={onQuantityCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </label>

      <LanguagePicker
        label={languageLabel}
        labelClassName="min-w-0 font-display text-[12px] font-normal text-black"
        triggerClassName="bg-white"
        value={binderCard.language}
        onChange={(language) => {
          if (language !== "all") onLanguageChange(language);
        }}
        getLanguageLabel={(language) =>
          translateCardOption("language", language)
        }
      />

      <CardConditionPicker
        getConditionLabel={(condition) =>
          translateCardOption("condition", condition)
        }
        label={conditionLabel}
        labelClassName="min-w-0 font-display text-[12px] font-normal text-black"
        triggerClassName="w-full"
        value={binderCard.condition}
        onChange={(condition) => {
          if (condition !== "all") onConditionChange(condition);
        }}
      />
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2 min-w-0">
        <BinderCardVariantSelect
          card={card}
          label={variantLabel}
          onVariantChange={onVariantChange}
        />
      </div>

      <label className="grid min-w-0 gap-1 font-display text-[12px] font-normal text-black">
        {finishLabel}
        <Select value={binderCard.finish} onValueChange={onFinishChange}>
          <SelectTrigger className="w-full">
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
    </div>

    {pricingFields}
  </div>
);
