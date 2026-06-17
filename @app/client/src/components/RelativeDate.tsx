import { type DateArg, format, formatDistance } from "date-fns";
import { type FC } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip.tsx";

interface RelativeDateProps {
  date: DateArg<Date> & {};
  showTime?: boolean;
}

export const RelativeDate: FC<RelativeDateProps> = ({ date, showTime }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          {formatDistance(date, new Date(), {
            addSuffix: true,
          })}
        </span>
      </TooltipTrigger>
      <TooltipContent>{format(date, showTime ? "Pppp" : "P")}</TooltipContent>
    </Tooltip>
  );
};
