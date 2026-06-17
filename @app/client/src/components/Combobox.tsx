import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/Command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { ScrollArea } from "@/components/ui/ScrollArea.tsx";
import { cn } from "@/lib/utils";

export interface ComboBoxOption<T> {
  value: T;
  label: string;
}

interface ComboboxProps<T> {
  prefix?: React.ReactNode;
  selectedOption?: ComboBoxOption<T> | null;
  onSelect: (option: ComboBoxOption<T> | null) => void;
  options: ComboBoxOption<T>[];
  placeholderValue: string;
  placeholderSearch?: string;
  labelNoResults?: string;
  className?: string;
  canUnselect?: boolean;
  labelUnselect?: string;
  onSearchChange?: (e: string) => void;
  getKey?: (option: ComboBoxOption<T>) => string | number;
}

export function Combobox<T>({
  prefix,
  selectedOption,
  onSelect,
  options,
  placeholderSearch,
  labelNoResults,
  placeholderValue,
  className,
  canUnselect = false,
  labelUnselect,
  onSearchChange,
  getKey,
}: ComboboxProps<T>) {
  const { t } = useTranslation(["common"]);
  const [open, setOpen] = React.useState(false);

  const handleOnSearchChange = (e: string) => {
    if (e === "") {
      return;
    }

    onSearchChange?.(e);
  };

  const handleSelectOption = (option: ComboBoxOption<T>) => () => {
    onSelect(option);
    setOpen(false);
  };

  const handleClickUnselect = () => {
    onSelect(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between flex", className)}
        >
          {prefix}
          <span className="flex-1 truncate text-left">
            {selectedOption ? selectedOption.label : placeholderValue}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <Command>
          <CommandInput
            placeholder={placeholderSearch}
            onValueChange={handleOnSearchChange}
          />
          <ScrollArea className="max-h-[220px] overflow-auto">
            <CommandEmpty>
              {labelNoResults || t("common:no_results")}
            </CommandEmpty>
            <CommandGroup>
              {canUnselect && (
                <CommandItem
                  key="unselect"
                  value=""
                  onSelect={handleClickUnselect}
                  className="cursor-pointer hover:bg-accent"
                >
                  {labelUnselect || t("common:unselect")}
                </CommandItem>
              )}
              {options.map((item) => (
                <CommandItem
                  key={getKey ? getKey(item) : item.label}
                  value={item.label}
                  onSelect={handleSelectOption(item)}
                  className="cursor-pointer"
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedOption?.value === item.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
