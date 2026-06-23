import { Check, LoaderCircle } from "lucide-react";
import * as React from "react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { InputSearch } from "@/components/InputSearch.tsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/Command.tsx";
import useClickOutside from "@/hooks/useClickOutside.ts";
import { useDisclosure } from "@/hooks/useDisclosure.ts";
import { cn } from "@/lib/utils.ts";

export interface InputAutocompleteOption<T> {
  key: string;
  value: T;
  label: string;
}

interface InputAutocompleteProps<T> {
  selectedOption?:
    | InputAutocompleteOption<T>
    | InputAutocompleteOption<T>[]
    | null;
  onSelect: (option: InputAutocompleteOption<T>) => void;
  options: InputAutocompleteOption<T>[];
  placeholderSearch?: string;
  labelNoResults?: string;
  className?: string;
  canUnselect?: boolean;
  labelUnselect?: string;
  onSearchChange?: (e: string) => void;
  isLoading?: boolean;
}

export function InputAutocomplete<T>({
  selectedOption,
  onSelect,
  options,
  placeholderSearch,
  labelNoResults,
  className,
  onSearchChange,
  isLoading,
}: InputAutocompleteProps<T>) {
  const refContainer = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation(["common"]);
  const { isOpen, handleOpen, handleClose } = useDisclosure(false);

  const handleOnSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onSearchChange?.(query);
  };

  const handleSelectOption = (option: InputAutocompleteOption<T>) => () => {
    onSelect(option);
    handleClose();
  };

  const selectedOptions = Array.isArray(selectedOption)
    ? selectedOption
    : [selectedOption];

  useClickOutside(refContainer, handleClose, { skip: !isOpen });
  return (
    <div ref={refContainer} className={className}>
      <Command shouldFilter={false} className="overflow-visible h-auto">
        <InputSearch
          isLoading={isLoading}
          placeholder={placeholderSearch}
          containerClassName="w-full"
          onFocus={handleOpen}
          onChange={handleOnSearchChange}
        />
        {isOpen && (
          <div className="relative animate-in fade-in-0 zoom-in-95 h-auto">
            <CommandList>
              <div className="absolute top-1.5 z-50 w-full">
                <CommandGroup className="relative h-auto z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md bg-background">
                  {!isLoading && options.length === 0 && (
                    <CommandEmpty>
                      <div className="py-4 flex items-center justify-center">
                        {labelNoResults || t("common:no_results")}
                      </div>
                    </CommandEmpty>
                  )}
                  {isLoading ? (
                    <div className="h-12 flex items-center justify-center">
                      <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {options.map((item) => {
                        const isSelected = selectedOptions.some(
                          (selected) => selected?.key === item.key
                        );
                        return (
                          <CommandItem
                            key={item.key || String(item.value)}
                            value={item.label}
                            onSelect={handleSelectOption(item)}
                            className="cursor-pointer"
                            disabled={isSelected}
                          >
                            {item.label}
                            <Check
                              className={cn(
                                "ml-auto",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        );
                      })}
                    </>
                  )}
                </CommandGroup>
              </div>
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
}
