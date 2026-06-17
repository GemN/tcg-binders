import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button.tsx";
import { Calendar } from "@/components/ui/Calendar.tsx";
import { FormControl } from "@/components/ui/Form.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover.tsx";
import { cn } from "@/lib/utils.ts";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
}

export const DatePicker: FC<DatePickerProps> = ({ value, onChange }) => {
  const { t } = useTranslation(["common"]);
  const next5Year = new Date().getFullYear() + 5;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={"outline"}
            className={cn(
              "pl-3 text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            {value ? (
              format(value, "PPP")
            ) : (
              <span>{t("common:form.datepicker_placeholder")}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          captionLayout="dropdown"
          startMonth={new Date(1970, 0)}
          endMonth={new Date(next5Year, 11)}
          defaultMonth={value}
        />
      </PopoverContent>
    </Popover>
  );
};
