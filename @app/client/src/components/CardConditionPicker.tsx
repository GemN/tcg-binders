import { type CardCondition } from "@app/graphql";

import { CardConditionDot } from "@/components/CardConditionBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { CARD_CONDITION_OPTIONS } from "@/config/card";
import { cn } from "@/lib/utils";

export type CardConditionPickerValue = CardCondition | "all";

interface CardConditionPickerProps {
  allLabel?: string;
  getConditionLabel: (condition: CardCondition) => string | null;
  id?: string;
  label: string;
  labelClassName?: string;
  showAllOption?: boolean;
  triggerClassName?: string;
  value: CardConditionPickerValue;
  onChange: (condition: CardConditionPickerValue) => void;
}

export const CardConditionPicker = ({
  allLabel,
  getConditionLabel,
  id,
  label,
  labelClassName,
  showAllOption = false,
  triggerClassName,
  value,
  onChange,
}: CardConditionPickerProps) => {
  return (
    <label className={cn("grid gap-1 text-sm font-medium", labelClassName)}>
      {label}
      <Select
        value={value}
        onValueChange={(nextValue) =>
          onChange(nextValue as CardConditionPickerValue)
        }
      >
        <SelectTrigger id={id} className={triggerClassName}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">{allLabel || "Any"}</SelectItem>
          )}
          {CARD_CONDITION_OPTIONS.map((condition) => (
            <SelectItem key={condition} value={condition}>
              <span className="flex min-w-0 items-center gap-2">
                <CardConditionDot condition={condition} />
                <span>{getConditionLabel(condition)}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
};
