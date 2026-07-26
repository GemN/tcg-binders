import { BinderVisibility } from "@app/graphql";
import { EyeOff, Globe, Lock, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

type BinderVisibilityDescriptionKey =
  | "binder:settings.visibility.listed_description"
  | "binder:settings.visibility.unlisted_description"
  | "binder:settings.visibility.private_description";

type BinderVisibilityLabelKey =
  | "binder:settings.visibility.listed"
  | "binder:settings.visibility.unlisted"
  | "binder:settings.visibility.private";

interface BinderVisibilityOption {
  Icon: LucideIcon;
  descriptionKey: BinderVisibilityDescriptionKey;
  labelKey: BinderVisibilityLabelKey;
  value: BinderVisibility;
}

const binderVisibilityOptions: BinderVisibilityOption[] = [
  {
    Icon: Globe,
    descriptionKey: "binder:settings.visibility.listed_description",
    labelKey: "binder:settings.visibility.listed",
    value: BinderVisibility.Listed,
  },
  {
    Icon: EyeOff,
    descriptionKey: "binder:settings.visibility.unlisted_description",
    labelKey: "binder:settings.visibility.unlisted",
    value: BinderVisibility.Unlisted,
  },
  {
    Icon: Lock,
    descriptionKey: "binder:settings.visibility.private_description",
    labelKey: "binder:settings.visibility.private",
    value: BinderVisibility.Private,
  },
];

const getBinderVisibilityOption = (
  visibility: BinderVisibility
): BinderVisibilityOption =>
  binderVisibilityOptions.find((option) => option.value === visibility) ??
  binderVisibilityOptions[1];

const isBinderVisibility = (value: string): value is BinderVisibility =>
  binderVisibilityOptions.some((option) => option.value === value);

interface BinderVisibilitySelectProps {
  disabled?: boolean;
  id: string;
  value: BinderVisibility;
  onValueChange: (visibility: BinderVisibility) => void;
}

export const BinderVisibilitySelect = ({
  disabled,
  id,
  value,
  onValueChange,
}: BinderVisibilitySelectProps) => {
  const { t } = useTranslation(["binder"]);
  const selectedOption = getBinderVisibilityOption(value);
  const SelectedIcon = selectedOption.Icon;
  const descriptionId = `${id}-description`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{t("binder:settings.visibility_label")}</Label>
      <Select
        value={value}
        disabled={disabled}
        onValueChange={(nextValue) => {
          if (!isBinderVisibility(nextValue)) return;
          onValueChange(nextValue);
        }}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-describedby={descriptionId}
        >
          <SelectValue>
            <span className="flex min-w-0 items-center gap-2">
              <SelectedIcon className="size-4 text-muted-foreground" />
              <span className="truncate">{t(selectedOption.labelKey)}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {binderVisibilityOptions.map((option) => {
            const Icon = option.Icon;

            return (
              <SelectItem key={option.value} value={option.value}>
                <Icon className="size-4" />
                {t(option.labelKey)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p
        id={descriptionId}
        className="text-xs leading-5 text-muted-foreground"
      >
        {t(selectedOption.descriptionKey)}
      </p>
    </div>
  );
};
