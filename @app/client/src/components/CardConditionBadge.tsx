import type { CardCondition } from "@app/graphql";
import { useTranslation } from "react-i18next";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { getCardConditionStyle } from "@/lib/cardCondition";
import { cn } from "@/lib/utils";

const conditionTooltipClassName = "bg-[#2f2933] text-[#fffdf7]";
const conditionTooltipArrowClassName = "bg-[#2f2933] fill-[#2f2933]";

interface CardConditionBadgeProps {
  className?: string;
  condition: CardCondition | null | undefined;
  showTooltip?: boolean;
}

export const CardConditionBadge = ({
  className,
  condition,
  showTooltip = false,
}: CardConditionBadgeProps) => {
  const { t } = useTranslation(["common"]);
  const conditionStyle = getCardConditionStyle(condition);
  const badge = (
    <span
      className={cn(
        "inline-flex min-w-7 items-center justify-center rounded-md px-1.5 py-1 text-[13px] font-display font-bold leading-none tabular-nums",
        className
      )}
      style={{
        backgroundColor: conditionStyle.color,
        color: conditionStyle.textColor,
      }}
    >
      {conditionStyle.abbreviation}
    </span>
  );

  if (!showTooltip || !condition) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        className={conditionTooltipClassName}
        arrowClassName={conditionTooltipArrowClassName}
      >
        {t(`common:card.condition.${condition}`)}
      </TooltipContent>
    </Tooltip>
  );
};

interface CardConditionDotProps {
  className?: string;
  condition: CardCondition | null | undefined;
}

export const CardConditionDot = ({
  className,
  condition,
}: CardConditionDotProps) => {
  const conditionStyle = getCardConditionStyle(condition);

  return (
    <span
      aria-hidden="true"
      className={cn("size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: conditionStyle.color }}
    />
  );
};
