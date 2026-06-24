import {
  type BinderCardVariantsQuery,
  type BinderCardsUpdateInput,
  CardCondition,
  CurrencyCode,
  LanguageCode,
  MarketPriceSource,
  useBinderCardVariantsQuery,
  useUpdateBinderCardMutation,
} from "@app/graphql";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import {
  CARD_CONDITION_OPTIONS,
  CARD_LANGUAGE_OPTIONS,
} from "@/hooks/useDraftBinder";
import {
  type BinderCardPriceInput,
  type BinderCardDetailRecord,
  type BinderCardRecord,
  formatBinderCardPrice,
  getBinderCardMarketPrice,
} from "@/lib/binderCardPricing";
import { getCurrencySymbol } from "@/lib/currency";
import { handleError } from "@/lib/error";
import {
  supportedCurrencies,
  supportedPriceSources,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

type ModalBinderCardRecord = BinderCardRecord | BinderCardDetailRecord;
type BinderCardVariant = NonNullable<
  NonNullable<
    BinderCardVariantsQuery["cardsCollection"]
  >["edges"][number]["node"]
>;

interface ModalBinderCardDetailProps {
  binderCard: ModalBinderCardRecord | null;
  canGoNext: boolean;
  canGoPrevious: boolean;
  currentIndex: number | null;
  isEditable: boolean;
  isLoading: boolean;
  open: boolean;
  showConvertedMarketPrices: boolean;
  totalCards: number;
  onBinderCardUpdated: (binderCard: BinderCardDetailRecord) => void;
  onGoNext: () => void;
  onGoPrevious: () => void;
  onOpenChange: (open: boolean) => void;
}

const formatFallbackLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getDefaultFinish = (finishes: readonly (string | null)[]): string => {
  const cleanFinishes = finishes.filter((finish): finish is string => !!finish);
  if (cleanFinishes.includes("normal")) return "normal";
  if (cleanFinishes.includes("nonfoil")) return "nonfoil";
  return cleanFinishes[0] || "normal";
};

const formatPriceInputValue = (
  amount: number | string | null | undefined
): string => {
  if (amount === null || amount === undefined) return "";
  return String(amount);
};

type PriceMode = "manual" | "dynamic";
type DynamicPriceStrategy = "CKD X";
const customCkdMultiplierStorageKey =
  "tcgbinder.binder_card.custom_ckd_multiplier";

const readStoredCustomCkdMultiplier = (): string => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(customCkdMultiplierStorageKey) || "";
};

const writeStoredCustomCkdMultiplier = (multiplier: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(customCkdMultiplierStorageKey, multiplier);
};

const shouldIgnoreModalNavigationKey = (
  target: EventTarget | null
): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    "input, textarea, select, [contenteditable='true'], [role='combobox'], [role='textbox'], [role='radio'], [role='radiogroup'], [data-slot='select-content'], [aria-expanded='true']"
  );
};

const getCardDetail = (
  card: ModalBinderCardRecord["card"] | null | undefined
): NonNullable<BinderCardDetailRecord["card"]>["mtgCardDetail"] | null => {
  if (!card || !("mtgCardDetail" in card)) return null;
  return card.mtgCardDetail;
};

const arePriceAmountsEqual = (
  currentAmount: number | string | null | undefined,
  nextAmount: string | null
): boolean => {
  if (
    (currentAmount === null || currentAmount === undefined) &&
    nextAmount === null
  ) {
    return true;
  }

  if (
    currentAmount === null ||
    currentAmount === undefined ||
    nextAmount === null
  ) {
    return false;
  }

  return Number(currentAmount) === Number(nextAmount);
};

interface ModalDetailNavigationProps {
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextLabel: string;
  previousLabel: string;
  onGoNext: () => void;
  onGoPrevious: () => void;
}

const ModalDetailNavigation = ({
  canGoNext,
  canGoPrevious,
  nextLabel,
  previousLabel,
  onGoNext,
  onGoPrevious,
}: ModalDetailNavigationProps) => (
  <>
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={!canGoPrevious}
      aria-label={previousLabel}
      className="absolute top-1/2 -left-4 z-10 size-9 -translate-y-1/2 rounded-full border-[#d8d1c3] bg-[#fffaf0] text-[#2d4059] shadow-lg sm:-left-5 sm:size-10"
      onClick={onGoPrevious}
    >
      <ChevronLeft className="size-5" />
    </Button>
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={!canGoNext}
      aria-label={nextLabel}
      className="absolute top-1/2 -right-4 z-10 size-9 -translate-y-1/2 rounded-full border-[#d8d1c3] bg-[#fffaf0] text-[#2d4059] shadow-lg sm:-right-5 sm:size-10"
      onClick={onGoNext}
    >
      <ChevronRight className="size-5" />
    </Button>
  </>
);

interface ModalDetailHeaderProps {
  cancelLabel: string;
  currentIndex: number | null;
  isSaving: boolean;
  positionLabel: string | null;
  savingLabel: string;
  titleLabel: string;
}

const ModalDetailHeader = ({
  cancelLabel,
  currentIndex,
  isSaving,
  positionLabel,
  savingLabel,
  titleLabel,
}: ModalDetailHeaderProps) => (
  <div className="flex shrink-0 items-center gap-2 border-b border-[#d8d1c3] bg-[#f2ebdd] px-4 py-3">
    <p className="mr-auto text-xs font-semibold uppercase text-[#6f6570]">
      {currentIndex === null ? titleLabel : positionLabel}
    </p>
    {isSaving && (
      <span className="text-xs font-medium text-[#6f6570]">{savingLabel}</span>
    )}
    <DialogClose asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={cancelLabel}
      >
        <X className="size-4" />
      </Button>
    </DialogClose>
  </div>
);

interface BinderCardMediaPanelProps {
  binderCard: ModalBinderCardRecord | null;
  imageAlt: string;
  imageUrl: string | null | undefined;
  noImageLabel: string;
  showConvertedMarketPrices: boolean;
  formatPrice: (input: BinderCardPriceInput) => string;
  getBuyLabel: (source: MarketPriceSource) => string;
}

interface BinderCardImagePreviewProps {
  imageAlt: string;
  imageUrl: string | null | undefined;
  noImageLabel: string;
}

const BinderCardImagePreview = ({
  imageAlt,
  imageUrl,
  noImageLabel,
}: BinderCardImagePreviewProps) => {
  const [displayedImageUrl, setDisplayedImageUrl] = useState(imageUrl || "");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const nextImageUrl = imageUrl || "";

    if (!nextImageUrl) {
      setDisplayedImageUrl("");
      setPendingImageUrl(null);
      return;
    }

    if (nextImageUrl === displayedImageUrl) {
      setPendingImageUrl(null);
      return;
    }

    setPendingImageUrl(nextImageUrl);
  }, [displayedImageUrl, imageUrl]);

  const isLoadingNextImage =
    !!pendingImageUrl && pendingImageUrl !== displayedImageUrl;

  return (
    <div className="relative mx-auto flex aspect-[63/88] w-full max-w-[22rem] items-center justify-center overflow-hidden rounded-md border border-[#d8d1c3] bg-[#343434] shadow-xl">
      {displayedImageUrl ? (
        <img
          src={displayedImageUrl}
          alt={imageAlt}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-sm text-[#fde9c9]">{noImageLabel}</span>
      )}

      {isLoadingNextImage && (
        <>
          <img
            src={pendingImageUrl || ""}
            alt=""
            className="sr-only"
            onLoad={() => {
              if (pendingImageUrl) {
                setDisplayedImageUrl(pendingImageUrl);
              }
              setPendingImageUrl(null);
            }}
            onError={() => setPendingImageUrl(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-[#343434]/55 backdrop-blur-[2px]">
            <Loader2 className="size-8 animate-spin text-[#fde9c9]" />
          </div>
        </>
      )}
    </div>
  );
};

const BinderCardMediaPanel = ({
  binderCard,
  imageAlt,
  imageUrl,
  noImageLabel,
  showConvertedMarketPrices,
  formatPrice,
  getBuyLabel,
}: BinderCardMediaPanelProps) => (
  <div className="flex flex-col gap-3">
    <BinderCardImagePreview
      imageAlt={imageAlt}
      imageUrl={imageUrl}
      noImageLabel={noImageLabel}
    />

    <div className="grid gap-2">
      {supportedPriceSources.map((source) => {
        const marketPrice = binderCard
          ? getBinderCardMarketPrice(binderCard, source)
          : null;
        const priceLabel = formatPrice({
          amount: marketPrice?.amount,
          shouldConvert: showConvertedMarketPrices,
          sourceCurrency: marketPrice?.currency,
        });
        const label = getBuyLabel(source);

        if (marketPrice?.buyUrl) {
          return (
            <Button key={source} asChild variant="outline" className="w-full">
              <a
                href={marketPrice.buyUrl}
                target="_blank"
                rel="noreferrer"
                className="justify-between"
              >
                <span>{label}</span>
                <span className="ml-auto font-semibold tabular-nums">
                  {priceLabel}
                </span>
                <ExternalLink className="size-4" />
              </a>
            </Button>
          );
        }

        return (
          <Button
            key={source}
            type="button"
            variant="outline"
            className="w-full justify-between"
            disabled
          >
            <span>{label}</span>
            <span className="font-semibold tabular-nums">{priceLabel}</span>
          </Button>
        );
      })}
    </div>
  </div>
);

interface BinderCardTextPanelProps {
  detail: ReturnType<typeof getCardDetail>;
  title: string;
}

const BinderCardTextPanel = ({ detail, title }: BinderCardTextPanelProps) => (
  <>
    <div>
      <h2 className="text-2xl font-semibold leading-tight text-[#2d4059]">
        {title}
      </h2>
      {detail?.typeLine && (
        <p className="mt-1 text-sm font-medium text-[#6f6570]">
          {detail.typeLine}
        </p>
      )}
    </div>

    {detail?.oracleText && (
      <div className="rounded-md border border-[#d8d1c3] bg-[#fffdf7] p-4">
        <p className="whitespace-pre-line text-sm leading-6 text-[#343434]">
          {detail.oracleText}
        </p>
      </div>
    )}
  </>
);

interface BinderCardVariantSelectProps {
  areVariantsLoading: boolean;
  cardId: string;
  label: string;
  selectedVariantLabel: string;
  variants: BinderCardVariant[];
  getVariantLabel: (variant: BinderCardVariant) => string;
  onVariantChange: (cardId: string) => void;
}

const BinderCardVariantSelect = ({
  areVariantsLoading,
  cardId,
  label,
  selectedVariantLabel,
  variants,
  getVariantLabel,
  onVariantChange,
}: BinderCardVariantSelectProps) => (
  <label className="grid gap-1 text-xs font-medium text-[#6f6570] sm:col-span-2">
    {label}
    <Select
      value={cardId}
      disabled={areVariantsLoading}
      onValueChange={onVariantChange}
    >
      <SelectTrigger className="w-full bg-[#fffaf0] text-[#343434]">
        <span className="truncate">{selectedVariantLabel}</span>
      </SelectTrigger>
      <SelectContent>
        {variants.map((variant) => {
          const variantImageUrl =
            variant.imageSmallUrl || variant.imageNormalUrl;

          return (
            <SelectItem
              key={variant.id}
              value={variant.id}
              textValue={getVariantLabel(variant)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex h-12 aspect-[63/88] shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#d8d1c3] bg-[#343434]">
                  {variantImageUrl ? (
                    <img
                      src={variantImageUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : null}
                </span>
                <span className="truncate">{getVariantLabel(variant)}</span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  </label>
);

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

const BinderCardPricingFields = ({
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
      className="w-full border border-[#d8d1c3] bg-[#fffaf0] p-1 text-[#343434] sm:w-fit"
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
          <SelectTrigger className="w-full bg-[#fffaf0] text-[#343434]">
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
            <SelectTrigger className="w-full bg-[#fffaf0] text-[#343434]">
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
              className="bg-[#fffaf0] text-[#343434] placeholder:text-[#9f9688]"
              onChange={(event) => onPriceInputChange(event.target.value)}
              onBlur={onManualPriceCommit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
            {priceCurrency === CurrencyCode.Thb && (
              <div className="flex h-9 shrink-0 overflow-hidden rounded-md border border-[#d8d1c3] bg-[#f2ebdd] text-xs font-medium text-[#343434]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-none border-r border-[#d8d1c3] px-2 text-xs text-[#343434] hover:bg-[#e8ddca]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onPresetCkd(25)}
                >
                  CKD 25
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-none border-r border-[#d8d1c3] px-2 text-xs text-[#343434] hover:bg-[#e8ddca]"
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
                  className="h-9 w-14 rounded-none border-0 bg-[#fffaf0] px-2 text-xs text-[#343434] placeholder:text-[#9f9688] focus-visible:ring-0 focus-visible:ring-offset-0"
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
                  className="h-9 rounded-none border-l border-[#d8d1c3] px-3 text-xs text-[#343434] hover:bg-[#e8ddca] disabled:opacity-40"
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

interface BinderCardEditableFieldsProps {
  areVariantsLoading: boolean;
  binderCard: ModalBinderCardRecord;
  cardId: string;
  conditionLabel: string;
  finishLabel: string;
  finishOptions: string[];
  languageLabel: string;
  quantityInput: string;
  quantityLabel: string;
  selectedVariantLabel: string;
  variantLabel: string;
  variants: BinderCardVariant[];
  getVariantLabel: (variant: BinderCardVariant) => string;
  onConditionChange: (condition: CardCondition) => void;
  onFinishChange: (finish: string) => void;
  onLanguageChange: (language: LanguageCode) => void;
  onQuantityChange: (value: string) => void;
  onQuantityCommit: () => void;
  onVariantChange: (cardId: string) => void;
  translateCardOption: (
    group: "condition" | "finish" | "language",
    value: string | null | undefined
  ) => string | null;
  pricingFields: ReactNode;
}

const BinderCardEditableFields = ({
  areVariantsLoading,
  binderCard,
  cardId,
  conditionLabel,
  finishLabel,
  finishOptions,
  languageLabel,
  quantityInput,
  quantityLabel,
  selectedVariantLabel,
  variantLabel,
  variants,
  getVariantLabel,
  onConditionChange,
  onFinishChange,
  onLanguageChange,
  onQuantityChange,
  onQuantityCommit,
  onVariantChange,
  translateCardOption,
  pricingFields,
}: BinderCardEditableFieldsProps) => (
  <div className="grid gap-4 rounded-md border border-[#d8d1c3] bg-[#fffdf7] p-4">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-1 text-xs font-medium text-[#6f6570]">
        {quantityLabel}
        <Input
          type="number"
          min={1}
          value={quantityInput}
          className="bg-[#fffaf0] text-[#343434]"
          onChange={(event) => onQuantityChange(event.target.value)}
          onBlur={onQuantityCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </label>

      <label className="grid gap-1 text-xs font-medium text-[#6f6570]">
        {finishLabel}
        <Select value={binderCard.finish} onValueChange={onFinishChange}>
          <SelectTrigger className="w-full bg-[#fffaf0] text-[#343434]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(finishOptions.length > 0 ? finishOptions : ["normal"]).map(
              (finish) => (
                <SelectItem key={finish} value={finish}>
                  {translateCardOption("finish", finish)}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-1 text-xs font-medium text-[#6f6570]">
        {conditionLabel}
        <Select
          value={binderCard.condition}
          onValueChange={(condition) =>
            onConditionChange(condition as CardCondition)
          }
        >
          <SelectTrigger className="w-full bg-[#fffaf0] text-[#343434]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARD_CONDITION_OPTIONS.map((condition) => (
              <SelectItem key={condition} value={condition}>
                {translateCardOption("condition", condition)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-1 text-xs font-medium text-[#6f6570]">
        {languageLabel}
        <Select
          value={binderCard.language}
          onValueChange={(language) =>
            onLanguageChange(language as LanguageCode)
          }
        >
          <SelectTrigger className="w-full bg-[#fffaf0] text-[#343434]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARD_LANGUAGE_OPTIONS.map((language) => (
              <SelectItem key={language} value={language}>
                {translateCardOption("language", language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <BinderCardVariantSelect
        areVariantsLoading={areVariantsLoading}
        cardId={cardId}
        label={variantLabel}
        selectedVariantLabel={selectedVariantLabel}
        variants={variants}
        getVariantLabel={getVariantLabel}
        onVariantChange={onVariantChange}
      />
    </div>

    {pricingFields}
  </div>
);

export const ModalBinderCardDetail = ({
  binderCard,
  canGoNext,
  canGoPrevious,
  currentIndex,
  isEditable,
  isLoading,
  open,
  showConvertedMarketPrices,
  totalCards,
  onBinderCardUpdated,
  onGoNext,
  onGoPrevious,
  onOpenChange,
}: ModalBinderCardDetailProps) => {
  const { i18n, t } = useTranslation(["common"]);
  const { convertAmount, currency } = usePricingSettings();
  const priceInputId = useId();
  const ckdMultiplierInputId = useId();
  const [quantityInput, setQuantityInput] = useState("1");
  const [priceInput, setPriceInput] = useState("");
  const [ckdMultiplierInput, setCkdMultiplierInput] = useState(
    readStoredCustomCkdMultiplier
  );
  const [priceCurrency, setPriceCurrency] = useState<CurrencyCode>(
    CurrencyCode.Thb
  );
  const [priceMode, setPriceMode] = useState<PriceMode>("manual");
  const [dynamicPriceStrategy, setDynamicPriceStrategy] =
    useState<DynamicPriceStrategy>("CKD X");
  const [updateBinderCard, { loading: isSaving }] =
    useUpdateBinderCardMutation();
  const card = binderCard?.card;
  const detail = getCardDetail(card);
  const noImageLabel = t("common:binder.no_image");
  const fallbackPrice = "-";
  const title = card?.name || t("common:binder.detail.title");
  const imageUrl = card?.imageNormalUrl || card?.imageSmallUrl;
  const finishOptions = useMemo(() => {
    const cardFinishes =
      card?.finishes.filter((finish): finish is string => !!finish) || [];

    if (binderCard?.finish && !cardFinishes.includes(binderCard.finish)) {
      return [binderCard.finish, ...cardFinishes];
    }

    return cardFinishes;
  }, [binderCard?.finish, card?.finishes]);
  const { data: variantsData, loading: areVariantsLoading } =
    useBinderCardVariantsQuery({
      variables: { name: card?.name || "", first: 500 },
      skip: !open || !isEditable || !card?.name,
    });
  const variants = useMemo(() => {
    return variantsData?.cardsCollection?.edges.map(({ node }) => node) || [];
  }, [variantsData?.cardsCollection?.edges]);
  const marketPriceLabels: Record<MarketPriceSource, string> = {
    [MarketPriceSource.Cardkingdom]: t("common:binder.list.cardkingdom_price"),
    [MarketPriceSource.Cardmarket]: t("common:binder.list.cardmarket_price"),
    [MarketPriceSource.Tcgplayer]: t("common:binder.list.tcgplayer_price"),
  };
  const formatPrice = ({
    amount,
    shouldConvert,
    sourceCurrency,
  }: BinderCardPriceInput) =>
    formatBinderCardPrice({
      amount,
      convertAmount,
      displayCurrency: currency,
      locale: i18n.language,
      shouldConvert,
      sourceCurrency,
    }) || fallbackPrice;
  const getCurrencyLabel = (currencyCode: CurrencyCode) => {
    const symbol = getCurrencySymbol(currencyCode);
    return symbol ? `${currencyCode} ${symbol}` : currencyCode;
  };

  useEffect(() => {
    if (!binderCard) return;

    setQuantityInput(String(binderCard.quantity));
    setPriceCurrency(binderCard.priceCurrency || CurrencyCode.Thb);
    setPriceMode(binderCard.dynamicPriceRule ? "dynamic" : "manual");
    setDynamicPriceStrategy("CKD X");
    setPriceInput(formatPriceInputValue(binderCard.priceAmount));
    setCkdMultiplierInput(readStoredCustomCkdMultiplier());
  }, [
    binderCard?.dynamicPriceRule,
    binderCard?.id,
    binderCard?.priceAmount,
    binderCard?.priceCurrency,
    binderCard?.quantity,
  ]);

  const persistBinderCard = async (set: BinderCardsUpdateInput) => {
    if (!binderCard) return;

    try {
      const result = await updateBinderCard({
        variables: {
          id: binderCard.id,
          set,
        },
      });
      const updatedBinderCard =
        result.data?.updateBinderCardsCollection.records[0];
      if (!updatedBinderCard) {
        throw new Error(t("common:binder.detail.update_error"));
      }
      onBinderCardUpdated(updatedBinderCard);
    } catch (error) {
      handleError(error, t("common:binder.detail.update_error"));
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (shouldIgnoreModalNavigationKey(event.target)) return;

    if (event.key === "ArrowLeft" && canGoPrevious) {
      event.preventDefault();
      onGoPrevious();
    }

    if (event.key === "ArrowRight" && canGoNext) {
      event.preventDefault();
      onGoNext();
    }
  };

  const handleQuantityCommit = () => {
    if (!binderCard) return;

    const nextQuantity = Math.max(1, Math.floor(Number(quantityInput) || 1));
    setQuantityInput(String(nextQuantity));
    if (nextQuantity === binderCard.quantity) return;

    void persistBinderCard({ quantity: nextQuantity });
  };

  const getCkdPriceAmountInput = (multiplier: number): string | null => {
    if (!binderCard) return null;

    const cardkingdomPrice = getBinderCardMarketPrice(
      binderCard,
      MarketPriceSource.Cardkingdom
    );
    const cardkingdomUsdPrice = Number(cardkingdomPrice?.amount);

    if (
      !cardkingdomPrice ||
      cardkingdomPrice.currency !== CurrencyCode.Usd ||
      !Number.isFinite(cardkingdomUsdPrice)
    ) {
      handleError(
        new Error(t("common:binder.detail.ckd_missing_price")),
        t("common:binder.detail.update_error")
      );
      return null;
    }

    return (cardkingdomUsdPrice * multiplier).toFixed(2);
  };

  const handleManualPriceCommit = (nextCurrency = priceCurrency) => {
    if (!binderCard) return;

    const trimmedPrice = priceInput.trim();
    if (!trimmedPrice) {
      if (
        !binderCard.dynamicPriceRule &&
        arePriceAmountsEqual(binderCard.priceAmount, null) &&
        (binderCard.priceCurrency || CurrencyCode.Thb) === nextCurrency
      ) {
        return;
      }

      void persistBinderCard({
        dynamicPriceRule: null,
        priceAmount: null,
        priceCurrency: nextCurrency,
      });
      return;
    }

    const nextAmountInput = trimmedPrice.replace(",", ".");
    const nextAmount = Number(nextAmountInput);
    if (!Number.isFinite(nextAmount) || nextAmount < 0) {
      handleError(
        new Error(t("common:binder.detail.invalid_price")),
        t("common:binder.detail.update_error")
      );
      return;
    }

    if (
      !binderCard.dynamicPriceRule &&
      arePriceAmountsEqual(binderCard.priceAmount, nextAmountInput) &&
      (binderCard.priceCurrency || CurrencyCode.Thb) === nextCurrency
    ) {
      return;
    }

    void persistBinderCard({
      dynamicPriceRule: null,
      priceAmount: nextAmountInput,
      priceCurrency: nextCurrency,
    });
  };

  const handleCkdPreset = (multiplier: number) => {
    if (!binderCard) return;

    const nextAmountInput = getCkdPriceAmountInput(multiplier);
    if (nextAmountInput === null) return;

    setPriceCurrency(CurrencyCode.Thb);
    setPriceInput(nextAmountInput);
    if (
      !binderCard.dynamicPriceRule &&
      arePriceAmountsEqual(binderCard.priceAmount, nextAmountInput) &&
      (binderCard.priceCurrency || CurrencyCode.Thb) === CurrencyCode.Thb
    ) {
      return;
    }

    void persistBinderCard({
      dynamicPriceRule: null,
      priceAmount: nextAmountInput,
      priceCurrency: CurrencyCode.Thb,
    });
  };

  const handleCustomCkdCommit = () => {
    const trimmedMultiplier = ckdMultiplierInput.trim();
    if (!trimmedMultiplier) return;

    const normalizedMultiplierInput = trimmedMultiplier.replace(",", ".");
    const multiplier = Number(normalizedMultiplierInput);
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      handleError(
        new Error(t("common:binder.detail.invalid_price")),
        t("common:binder.detail.update_error")
      );
      return;
    }

    setCkdMultiplierInput(normalizedMultiplierInput);
    writeStoredCustomCkdMultiplier(normalizedMultiplierInput);
    handleCkdPreset(multiplier);
  };

  const applyDynamicPriceStrategy = (strategy: DynamicPriceStrategy) => {
    if (!binderCard) return;

    setDynamicPriceStrategy(strategy);

    if (strategy !== "CKD X") return;

    setPriceInput("");
    if (
      binderCard.dynamicPriceRule === strategy &&
      arePriceAmountsEqual(binderCard.priceAmount, null) &&
      (binderCard.priceCurrency || CurrencyCode.Thb) === priceCurrency
    ) {
      return;
    }

    void persistBinderCard({
      dynamicPriceRule: strategy,
      priceAmount: null,
      priceCurrency,
    });
  };

  const handlePriceCurrencyChange = (nextCurrency: CurrencyCode) => {
    if (!binderCard) return;

    setPriceCurrency(nextCurrency);

    if (priceMode === "dynamic") {
      if (
        binderCard.dynamicPriceRule === dynamicPriceStrategy &&
        arePriceAmountsEqual(binderCard.priceAmount, null) &&
        (binderCard.priceCurrency || CurrencyCode.Thb) === nextCurrency
      ) {
        return;
      }

      void persistBinderCard({
        dynamicPriceRule: dynamicPriceStrategy,
        priceAmount: null,
        priceCurrency: nextCurrency,
      });
      return;
    }

    handleManualPriceCommit(nextCurrency);
  };

  const handlePriceModeChange = (nextPriceMode: PriceMode) => {
    if (!binderCard || nextPriceMode === priceMode) return;

    setPriceMode(nextPriceMode);

    if (nextPriceMode === "dynamic") {
      applyDynamicPriceStrategy(dynamicPriceStrategy);
      return;
    }

    if (
      !binderCard.dynamicPriceRule &&
      arePriceAmountsEqual(binderCard.priceAmount, null) &&
      (binderCard.priceCurrency || CurrencyCode.Thb) === priceCurrency
    ) {
      return;
    }

    void persistBinderCard({
      dynamicPriceRule: null,
      priceAmount: null,
      priceCurrency,
    });
  };

  const handleFinishChange = (finish: string) => {
    if (!binderCard || finish === binderCard.finish) return;
    void persistBinderCard({ finish });
  };

  const handleConditionChange = (condition: CardCondition) => {
    if (!binderCard || condition === binderCard.condition) return;
    void persistBinderCard({ condition });
  };

  const handleLanguageChange = (language: LanguageCode) => {
    if (!binderCard || language === binderCard.language) return;
    void persistBinderCard({ language });
  };

  const handleVariantChange = (cardId: string) => {
    if (!binderCard || cardId === card?.id) return;

    const variant = variants.find((candidate) => candidate.id === cardId);
    if (!variant) return;

    const variantFinishes = variant.finishes.filter(
      (finish): finish is string => !!finish
    );
    const nextFinish = variantFinishes.includes(binderCard.finish)
      ? binderCard.finish
      : getDefaultFinish(variantFinishes);

    void persistBinderCard({
      cardId: variant.id,
      ...(nextFinish === binderCard.finish ? {} : { finish: nextFinish }),
    });
  };

  const translateCardOption = (
    group: "condition" | "finish" | "language",
    value: string | null | undefined
  ) => {
    if (!value) return null;
    return t(`common:card.${group}.${value}`, {
      defaultValue: formatFallbackLabel(value),
    });
  };

  const getVariantLabel = (variant: BinderCardVariant) => {
    const setCode = variant.cardSet?.code || "MTG";
    const collectorNumber = variant.collectorNumber
      ? ` #${variant.collectorNumber}`
      : "";
    const release = variant.releasedAt ? ` - ${variant.releasedAt}` : "";
    return `${setCode}${collectorNumber}${release}`;
  };

  const selectedVariant = variants.find((variant) => variant.id === card?.id);
  const selectedVariantLabel = selectedVariant
    ? getVariantLabel(selectedVariant)
    : [
        card?.cardSet?.code || "MTG",
        card?.collectorNumber ? `#${card.collectorNumber}` : null,
        card?.releasedAt,
      ]
        .filter(Boolean)
        .join(" - ");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-visible border-[#d8d1c3] bg-[#fffaf0] p-0 text-[#343434] sm:max-w-6xl"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <ModalDetailNavigation
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          nextLabel={t("common:next")}
          previousLabel={t("common:previous")}
          onGoNext={onGoNext}
          onGoPrevious={onGoPrevious}
        />
        <div className="flex max-h-[92svh] min-h-0 flex-col overflow-hidden rounded-lg">
          <ModalDetailHeader
            cancelLabel={t("common:cancel")}
            currentIndex={currentIndex}
            isSaving={isSaving}
            positionLabel={
              currentIndex === null
                ? null
                : t("common:binder.detail.position", {
                    current: currentIndex + 1,
                    total: totalCards,
                  })
            }
            savingLabel={t("common:binder.detail.saving")}
            titleLabel={t("common:binder.detail.card_details")}
          />

          {isLoading && !binderCard ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loading />
            </div>
          ) : (
            <div className="grid min-h-0 gap-5 overflow-y-auto p-4 lg:grid-cols-[minmax(16rem,22rem)_1fr] lg:p-6">
              <BinderCardMediaPanel
                binderCard={binderCard}
                imageAlt={t("common:binder.detail.image_alt", {
                  name: card?.name || "",
                })}
                imageUrl={imageUrl}
                noImageLabel={noImageLabel}
                showConvertedMarketPrices={showConvertedMarketPrices}
                formatPrice={formatPrice}
                getBuyLabel={(source) =>
                  t("common:binder.detail.buy_at", {
                    source: marketPriceLabels[source],
                  })
                }
              />

              <div className="flex min-w-0 flex-col gap-4">
                <BinderCardTextPanel detail={detail} title={title} />

                {isEditable && binderCard && (
                  <BinderCardEditableFields
                    areVariantsLoading={areVariantsLoading}
                    binderCard={binderCard}
                    cardId={card?.id || ""}
                    conditionLabel={t("common:draft_binder.condition")}
                    finishLabel={t("common:draft_binder.finish")}
                    finishOptions={finishOptions}
                    languageLabel={t("common:draft_binder.language")}
                    quantityInput={quantityInput}
                    quantityLabel={t("common:draft_binder.quantity")}
                    selectedVariantLabel={selectedVariantLabel}
                    variantLabel={t("common:binder.detail.variant")}
                    variants={variants}
                    getVariantLabel={getVariantLabel}
                    onConditionChange={handleConditionChange}
                    onFinishChange={handleFinishChange}
                    onLanguageChange={handleLanguageChange}
                    onQuantityChange={setQuantityInput}
                    onQuantityCommit={handleQuantityCommit}
                    onVariantChange={handleVariantChange}
                    translateCardOption={translateCardOption}
                    pricingFields={
                      <BinderCardPricingFields
                        applyLabel={t("common:apply")}
                        ckdMultiplierInput={ckdMultiplierInput}
                        ckdMultiplierInputId={ckdMultiplierInputId}
                        currencyLabel={t("common:draft_binder.currency")}
                        dynamicPriceStrategy={dynamicPriceStrategy}
                        priceCurrency={priceCurrency}
                        priceInput={priceInput}
                        priceInputId={priceInputId}
                        priceMode={priceMode}
                        priceModeLabels={{
                          manual: t("common:binder.detail.price_mode.manual"),
                          dynamic: t("common:binder.detail.price_mode.dynamic"),
                        }}
                        priceLabel={t("common:binder.detail.price")}
                        pricePlaceholder={t(
                          "common:binder.detail.price_placeholder"
                        )}
                        priceStrategyLabel={t(
                          "common:binder.detail.price_strategy"
                        )}
                        ckdMultiplierLabel={t(
                          "common:binder.detail.ckd_multiplier"
                        )}
                        getCurrencyLabel={getCurrencyLabel}
                        onCkdMultiplierChange={setCkdMultiplierInput}
                        onCustomCkdCommit={handleCustomCkdCommit}
                        onManualPriceCommit={() => handleManualPriceCommit()}
                        onPriceCurrencyChange={handlePriceCurrencyChange}
                        onPriceInputChange={setPriceInput}
                        onPriceModeChange={handlePriceModeChange}
                        onPresetCkd={handleCkdPreset}
                        onDynamicPriceStrategyChange={applyDynamicPriceStrategy}
                      />
                    }
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
