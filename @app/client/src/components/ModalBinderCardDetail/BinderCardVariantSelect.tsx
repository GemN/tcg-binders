import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/Select";

import type { BinderCardVariant } from "./types";

interface BinderCardVariantSelectProps {
  areVariantsLoading: boolean;
  cardId: string;
  label: string;
  loadingLabel: string;
  selectedVariantLabel: string;
  variants: BinderCardVariant[];
  getVariantLabel: (variant: BinderCardVariant) => string;
  onOpenChange: (open: boolean) => void;
  onVariantChange: (cardId: string) => void;
}

export const BinderCardVariantSelect = ({
  areVariantsLoading,
  cardId,
  label,
  loadingLabel,
  selectedVariantLabel,
  variants,
  getVariantLabel,
  onOpenChange,
  onVariantChange,
}: BinderCardVariantSelectProps) => (
  <label className="grid gap-1 text-xs font-medium text-[#6f6570] sm:col-span-2">
    {label}
    <Select
      value={cardId}
      onOpenChange={onOpenChange}
      onValueChange={onVariantChange}
    >
      <SelectTrigger className="w-full bg-[#E8E8E8] text-[#343434]">
        <span className="truncate">{selectedVariantLabel}</span>
      </SelectTrigger>
      <SelectContent>
        {areVariantsLoading ? (
          <SelectItem value="__loading" disabled>
            {loadingLabel}
          </SelectItem>
        ) : (
          variants.map((variant) => {
            const variantImageUrl =
              variant.imageSmallUrl || variant.imageNormalUrl;

            return (
              <SelectItem
                key={variant.id}
                value={variant.id}
                textValue={getVariantLabel(variant)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-12 aspect-[63/88] shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#d8d1c3] bg-[#343434]">
                    {variantImageUrl ? (
                      <img
                        src={variantImageUrl}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : null}
                  </span>
                  <span className="truncate">{getVariantLabel(variant)}</span>
                </span>
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  </label>
);
