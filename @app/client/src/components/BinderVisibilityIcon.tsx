import { BinderVisibility } from "@app/graphql";
import { EyeOff, Globe, Lock, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

const binderVisibilityIcons: Record<BinderVisibility, LucideIcon> = {
  [BinderVisibility.Listed]: Globe,
  [BinderVisibility.Unlisted]: EyeOff,
  [BinderVisibility.Private]: Lock,
};

type BinderVisibilityLabelKey =
  | "binder:settings.visibility.listed"
  | "binder:settings.visibility.unlisted"
  | "binder:settings.visibility.private";

const binderVisibilityLabelKeys: Record<
  BinderVisibility,
  BinderVisibilityLabelKey
> = {
  [BinderVisibility.Listed]: "binder:settings.visibility.listed",
  [BinderVisibility.Unlisted]: "binder:settings.visibility.unlisted",
  [BinderVisibility.Private]: "binder:settings.visibility.private",
};

interface BinderVisibilityIconProps {
  className?: string;
  visibility: BinderVisibility;
}

export const BinderVisibilityIcon = ({
  className,
  visibility,
}: BinderVisibilityIconProps) => {
  const { t } = useTranslation(["binder"]);
  const VisibilityIcon = binderVisibilityIcons[visibility];
  const visibilityLabel = t(binderVisibilityLabelKeys[visibility]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex size-4 shrink-0 items-center justify-center",
            className
          )}
          aria-label={visibilityLabel}
        >
          <VisibilityIcon aria-hidden="true" className="size-full" />
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={4}>{visibilityLabel}</TooltipContent>
    </Tooltip>
  );
};
