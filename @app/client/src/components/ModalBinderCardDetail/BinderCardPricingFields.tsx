import { CurrencyCode } from "@app/graphql";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { supportedCurrencies } from "@/providers/PricingSettingsContext";

import type { DynamicPriceStrategy, PriceMode } from "./types";

interface BinderCardPricingFieldsProps {
  applyLabel: string;
  ckdMultiplierInput: string;
  ckdMultiplierInputId: string;
  currencyLabel: string;
  dynamicPriceStrategy: DynamicPriceStrategy;
  priceCurrency: CurrencyCode;
  priceInput: string;
  priceInputId: string;
  priceMode: PriceMode;
  priceModeLabels: Record<PriceMode, string>;
  priceLabel: string;
  pricePlaceholder: string;
  priceStrategyLabel: string;
  ckdMultiplierLabel: string;
  getCurrencyLabel: (currencyCode: CurrencyCode) => string;
  onCkdMultiplierChange: (value: string) => void;
  onCustomCkdCommit: () => void;
  onManualPriceCommit: () => void;
  onPriceCurrencyChange: (currency: CurrencyCode) => void;
  onPriceInputChange: (value: string) => void;
  onPriceModeChange: (mode: PriceMode) => void;
  onPresetCkd: (multiplier: number) => void;
  onDynamicPriceStrategyChange: (strategy: DynamicPriceStrategy) => void;
}

export const BinderCardPricingFields = ({
  applyLabel,
  ckdMultiplierInput,
  ckdMultiplierInputId,
  currencyLabel,
  dynamicPriceStrategy,
  priceCurrency,
  priceInput,
  priceInputId,
  priceMode,
  priceModeLabels,
  priceLabel,
  pricePlaceholder,
  priceStrategyLabel,
  ckdMultiplierLabel,
  getCurrencyLabel,
  onCkdMultiplierChange,
  onCustomCkdCommit,
  onManualPriceCommit,
  onPriceCurrencyChange,
  onPriceInputChange,
  onPriceModeChange,
  onPresetCkd,
  onDynamicPriceStrategyChange,
}: BinderCardPricingFieldsProps) => (
  <div className="grid gap-3 border-t border-[#ece2d2] pt-4">
    <ToggleGroup
      type="single"
      value={priceMode}
      size="sm"
      className="w-full border border-[#d8d1c3] bg-[#E8E8E8] p-1 text-[#343434] sm:w-fit"
      onValueChange={(value) => {
        if (!value) return;
        onPriceModeChange(value as PriceMode);
      }}
    >
      <ToggleGroupItem
        value="manual"
        size="sm"
        className="h-8 flex-1 px-3 text-[#343434] hover:bg-[#f2ebdd] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground sm:flex-none"
      >
        {priceModeLabels.manual}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dynamic"
        size="sm"
        className="h-8 flex-1 px-3 text-[#343434] hover:bg-[#f2ebdd] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground sm:flex-none"
      >
        {priceModeLabels.dynamic}
      </ToggleGroupItem>
    </ToggleGroup>

    <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
      <label className="grid gap-1 text-xs font-medium text-[#6f6570]">
        {currencyLabel}
        <Select
          value={priceCurrency}
          onValueChange={(nextCurrency) =>
            onPriceCurrencyChange(nextCurrency as CurrencyCode)
          }
        >
          <SelectTrigger className="w-full bg-[#E8E8E8] text-[#343434]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedCurrencies.map((currencyOption) => (
              <SelectItem key={currencyOption} value={currencyOption}>
                {getCurrencyLabel(currencyOption)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {priceMode === "dynamic" ? (
        <label className="grid gap-1 text-xs font-medium text-[#6f6570]">
          {priceStrategyLabel}
          <Select
            value={dynamicPriceStrategy}
            onValueChange={(strategy) =>
              onDynamicPriceStrategyChange(strategy as DynamicPriceStrategy)
            }
          >
            <SelectTrigger className="w-full border-primary bg-primary text-primary-foreground hover:bg-primary/90 [&_svg]:!text-primary-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CKD X">CKD X</SelectItem>
            </SelectContent>
          </Select>
        </label>
      ) : (
        <div className="grid gap-1 text-xs font-medium text-[#6f6570]">
          <label htmlFor={priceInputId}>{priceLabel}</label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={priceInputId}
              value={priceInput}
              placeholder={pricePlaceholder}
              className="bg-[#E8E8E8] text-[#343434] placeholder:text-[#9f9688]"
              onChange={(event) => onPriceInputChange(event.target.value)}
              onBlur={onManualPriceCommit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
            {priceCurrency === CurrencyCode.Thb && (
              <div className="flex h-9 shrink-0 overflow-hidden rounded-md border text-xs font-medium ">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-none border-r  px-2 text-xs "
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onPresetCkd(25)}
                >
                  CKD 25
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-none border-r px-2 text-xs "
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onPresetCkd(30)}
                >
                  CKD 30
                </Button>
                <label htmlFor={ckdMultiplierInputId} className="sr-only">
                  {ckdMultiplierLabel}
                </label>
                <span className="flex h-9 items-center px-2">CKD</span>
                <Input
                  id={ckdMultiplierInputId}
                  inputMode="decimal"
                  value={ckdMultiplierInput}
                  className="h-9 w-14 rounded-none border-0 bg-[#E8E8E8] px-2 text-xs  focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="X"
                  onChange={(event) =>
                    onCkdMultiplierChange(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onCustomCkdCommit();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!ckdMultiplierInput.trim()}
                  className="h-9 rounded-none border-l px-3 text-xs  disabled:opacity-40"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={onCustomCkdCommit}
                >
                  {applyLabel}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
