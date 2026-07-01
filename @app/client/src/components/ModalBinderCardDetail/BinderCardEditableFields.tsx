import { CardCondition, LanguageCode } from "@app/graphql";
import type { ReactNode } from "react";

import { CardConditionDot } from "@/components/CardConditionBadge";
import { BinderCardVariantSelect } from "@/components/ModalBinderCardDetail/BinderCardVariantSelect";
import { LanguagePicker } from "@/components/ModalBinderCardDetail/LanguagePicker";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { CARD_CONDITION_OPTIONS } from "@/config/card";

import type { BinderCardVariant, ModalBinderCardRecord } from "./types";

interface BinderCardEditableFieldsProps {
  areVariantsLoading: boolean;
  binderCard: ModalBinderCardRecord;
  cardId: string;
  conditionLabel: string;
  finishLabel: string;
  finishOptions: string[];
  languageLabel: string;
  quantityInput: string;
  quantityLabel: string;
  selectedVariantLabel: string;
  variantLabel: string;
  variants: BinderCardVariant[];
  getVariantLabel: (variant: BinderCardVariant) => string;
  loadingVariantLabel: string;
  onConditionChange: (condition: CardCondition) => void;
  onFinishChange: (finish: string) => void;
  onLanguageChange: (language: LanguageCode) => void;
  onQuantityChange: (value: string) => void;
  onQuantityCommit: () => void;
  onVariantSelectOpenChange: (open: boolean) => void;
  onVariantChange: (cardId: string) => void;
  translateCardOption: (
    group: "condition" | "finish" | "language",
    value: string | null | undefined
  ) => string | null;
  pricingFields: ReactNode;
}

export const BinderCardEditableFields = ({
  areVariantsLoading,
  binderCard,
  cardId,
  conditionLabel,
  finishLabel,
  finishOptions,
  languageLabel,
  quantityInput,
  quantityLabel,
  selectedVariantLabel,
  variantLabel,
  variants,
  getVariantLabel,
  loadingVariantLabel,
  onConditionChange,
  onFinishChange,
  onLanguageChange,
  onQuantityChange,
  onQuantityCommit,
  onVariantSelectOpenChange,
  onVariantChange,
  translateCardOption,
  pricingFields,
}: BinderCardEditableFieldsProps) => (
  <div className="grid gap-4 rounded-md border border-[#d8d1c3] bg-[#fffdf7] p-4">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-1 text-xs font-medium text-[#6f6570]">
        {quantityLabel}
        <Input
          type="number"
          min={1}
          value={quantityInput}
          className="bg-[#E8E8E8] text-[#343434]"
          onChange={(event) => onQuantityChange(event.target.value)}
          onBlur={onQuantityCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </label>

      <label className="grid gap-1 text-xs font-medium text-[#6f6570]">
        {finishLabel}
        <Select value={binderCard.finish} onValueChange={onFinishChange}>
          <SelectTrigger className="w-full bg-[#E8E8E8] text-[#343434]">
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

      <label className="grid gap-1 text-xs font-medium text-[#6f6570]">
        {conditionLabel}
        <Select
          value={binderCard.condition}
          onValueChange={(condition) =>
            onConditionChange(condition as CardCondition)
          }
        >
          <SelectTrigger className="w-full bg-[#E8E8E8] text-[#343434]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARD_CONDITION_OPTIONS.map((condition) => (
              <SelectItem key={condition} value={condition}>
                <span className="flex min-w-0 items-center gap-2">
                  <CardConditionDot condition={condition} />
                  <span>{translateCardOption("condition", condition)}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <LanguagePicker
        label={languageLabel}
        value={binderCard.language}
        onChange={onLanguageChange}
        getLanguageLabel={(language) =>
          translateCardOption("language", language)
        }
      />

      <BinderCardVariantSelect
        areVariantsLoading={areVariantsLoading}
        cardId={cardId}
        label={variantLabel}
        loadingLabel={loadingVariantLabel}
        selectedVariantLabel={selectedVariantLabel}
        variants={variants}
        getVariantLabel={getVariantLabel}
        onOpenChange={onVariantSelectOpenChange}
        onVariantChange={onVariantChange}
      />
    </div>

    {pricingFields}
  </div>
);
