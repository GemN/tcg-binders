import type { CardCondition } from "@app/graphql";

import { getCardConditionStyle } from "@/lib/cardCondition";
import { cn } from "@/lib/utils";

interface CardConditionBadgeProps {
  className?: string;
  condition: CardCondition | null | undefined;
}

export const CardConditionBadge = ({
  className,
  condition,
}: CardConditionBadgeProps) => {
  const conditionStyle = getCardConditionStyle(condition);

  return (
    <span
      className={cn(
        "inline-flex min-w-7 items-center justify-center rounded-md  px-1.5 py-1 text-[13px] font-bold leading-none tabular-nums",
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
