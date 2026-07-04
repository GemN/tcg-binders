import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/Badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { isFoilCardFinish } from "@/config/card";
import { cn } from "@/lib/utils";

export type CardFinishBadgeDisplay = "icon" | "icon-label" | "label";

interface CardFinishBadgeProps {
  className?: string;
  display?: CardFinishBadgeDisplay;
  finish: string | null | undefined;
  showTooltip?: boolean;
}

const finishTooltipClassName = "bg-[#2f2933] text-[#fffdf7]";
const finishTooltipArrowClassName = "bg-[#2f2933] fill-[#2f2933]";

const getNormalizedFinish = (finish: string | null | undefined) => {
  const normalizedFinish = finish?.trim().toLowerCase();
  return normalizedFinish || null;
};

const formatFinishFallbackLabel = (finish: string): string => {
  return finish
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const CardFinishBadge = ({
  className,
  display = "label",
  finish,
  showTooltip = false,
}: CardFinishBadgeProps) => {
  const { t } = useTranslation(["common"]);
  const normalizedFinish = getNormalizedFinish(finish);

  if (!normalizedFinish || !isFoilCardFinish(normalizedFinish)) return null;

  const finishLabel = t(`common:card.finish.${normalizedFinish}`, {
    defaultValue: formatFinishFallbackLabel(normalizedFinish),
  });
  const badge =
    display === "icon" ? (
      <span
        aria-label={finishLabel}
        className={cn("inline-flex items-center justify-center", className)}
        role="img"
      >
        <Star
          aria-hidden="true"
          className="size-4 fill-[#ffd21f] text-[#ffd21f]"
        />
      </span>
    ) : display === "icon-label" ? (
      <Badge variant="outline" size="sm" className={className}>
        <Star
          aria-hidden="true"
          className="size-3 fill-[#ffd21f] text-[#ffd21f]"
        />
        {finishLabel}
      </Badge>
    ) : (
      <Badge variant="outline" size="sm" className={className}>
        {finishLabel}
      </Badge>
    );

  if (display !== "icon" && !showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        className={finishTooltipClassName}
        arrowClassName={finishTooltipArrowClassName}
      >
        {finishLabel}
      </TooltipContent>
    </Tooltip>
  );
};
