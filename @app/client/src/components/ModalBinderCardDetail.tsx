import {
  type BinderCardsUpdateInput,
  CardCondition,
  CurrencyCode,
  LanguageCode,
  MarketPriceSource,
  useUpdateBinderCardMutation,
} from "@app/graphql";
import { type KeyboardEvent, useCallback } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Loading } from "@/components/Loading";
import { BinderCardEditableFields } from "@/components/ModalBinderCardDetail/BinderCardEditableFields";
import { BinderCardMediaPanel } from "@/components/ModalBinderCardDetail/BinderCardMediaPanel";
import { BinderCardPricingFields } from "@/components/ModalBinderCardDetail/BinderCardPricingFields";
import { BinderCardTextPanel } from "@/components/ModalBinderCardDetail/BinderCardTextPanel";
import { ModalDetailHeader } from "@/components/ModalBinderCardDetail/ModalDetailHeader";
import { ModalDetailNavigation } from "@/components/ModalBinderCardDetail/ModalDetailNavigation";
import type {
  BinderCardVariant,
  DynamicPriceStrategy,
  ModalBinderCardRecord,
  PriceMode,
  UpdateBinderCardContext,
  UpdateBinderCardHandler,
} from "@/components/ModalBinderCardDetail/types";
import {
  arePriceAmountsEqual,
  formatFallbackLabel,
  formatPriceInputValue,
  getCardDetail,
  getDefaultFinish,
  readStoredBinderCardPriceCurrency,
  readStoredCustomCkdMultiplier,
  shouldIgnoreModalNavigationKey,
  writeStoredBinderCardPriceCurrency,
  writeStoredCustomCkdMultiplier,
} from "@/components/ModalBinderCardDetail/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import {
  type BinderCardPriceInput,
  formatBinderCardPrice,
  formatCardKingdomMultiplierThbPriceInput,
} from "@/lib/binderCardPricing";
import { getCardImageBaseUrl, getCardScryfallId } from "@/lib/cardImageUrl";
import { getCurrencyFractionDigits, getCurrencySymbol } from "@/lib/currency";
import { handleError } from "@/lib/error";
import {
  isSupportedCurrency,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

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
  onBinderCardUpdated: (binderCard: ModalBinderCardRecord) => void;
  onGoNext: () => void;
  onGoPrevious: () => void;
  onOpenChange: (open: boolean) => void;
  onUpdateBinderCard?: UpdateBinderCardHandler;
}

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
  onUpdateBinderCard,
}: ModalBinderCardDetailProps) => {
  const { i18n, t } = useTranslation(["binder", "common"]);
  const {
    convertAmountToLocalCurrency,
    convertAmountToTargetCurrency,
    currency,
  } = usePricingSettings();
  const priceInputId = useId();
  const ckdMultiplierInputId = useId();
  const [quantityInput, setQuantityInput] = useState("1");
  const [priceInput, setPriceInput] = useState("");
  const [ckdMultiplierInput, setCkdMultiplierInput] = useState(
    readStoredCustomCkdMultiplier
  );
  const [priceCurrency, setPriceCurrency] = useState<CurrencyCode>(
    readStoredBinderCardPriceCurrency(currency)
  );
  const [priceMode, setPriceMode] = useState<PriceMode>("manual");
  const [dynamicPriceStrategy, setDynamicPriceStrategy] =
    useState<DynamicPriceStrategy>("CKD X");
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [updateBinderCard, { loading: isSaving }] =
    useUpdateBinderCardMutation();
  const card = binderCard?.card;
  const detail = getCardDetail(card);
  const noImageLabel = t("binder:no_image");
  const fallbackPrice = "-";
  const title = card?.name || t("binder:detail.title");
  const imageUrl = getCardImageBaseUrl(card);
  const scryfallId = getCardScryfallId(card);
  const finishOptions = useMemo(() => {
    const cardFinishes =
      card?.finishes.filter((finish): finish is string => !!finish) || [];

    if (binderCard?.finish && !cardFinishes.includes(binderCard.finish)) {
      return [binderCard.finish, ...cardFinishes];
    }

    return cardFinishes;
  }, [binderCard?.finish, card?.finishes]);
  const marketPriceLabels: Record<MarketPriceSource, string> = {
    [MarketPriceSource.Cardkingdom]: t("binder:list.cardkingdom_price"),
    [MarketPriceSource.Cardmarket]: t("binder:list.cardmarket_price"),
    [MarketPriceSource.Tcgplayer]: t("binder:list.tcgplayer_price"),
  };
  const formatPrice = ({
    amount,
    shouldConvert,
    sourceCurrency,
  }: BinderCardPriceInput) =>
    formatBinderCardPrice({
      amount,
      convertAmountToLocalCurrency,
      displayCurrency: currency,
      locale: i18n.language,
      shouldConvert,
      sourceCurrency,
    }) || fallbackPrice;
  const getCurrencyLabel = (currencyCode: CurrencyCode) => {
    const symbol = getCurrencySymbol(currencyCode);
    return symbol ? `${currencyCode} ${symbol}` : currencyCode;
  };
  const getDefaultPriceCurrency = useCallback(() => {
    return readStoredBinderCardPriceCurrency(currency);
  }, [currency]);
  const getInitialPriceCurrency = useCallback(
    (nextBinderCard: ModalBinderCardRecord): CurrencyCode => {
      const hasSavedPrice =
        !!nextBinderCard.dynamicPriceRule ||
        (nextBinderCard.priceAmount !== null &&
          nextBinderCard.priceAmount !== undefined);

      if (
        hasSavedPrice &&
        nextBinderCard.priceCurrency &&
        isSupportedCurrency(nextBinderCard.priceCurrency)
      ) {
        return nextBinderCard.priceCurrency;
      }

      return getDefaultPriceCurrency();
    },
    [getDefaultPriceCurrency]
  );
  const formatConvertedPriceInput = (
    amount: number,
    targetCurrency: CurrencyCode
  ) => {
    return amount.toFixed(getCurrencyFractionDigits(targetCurrency));
  };

  useEffect(() => {
    if (!binderCard) return;

    setQuantityInput(String(binderCard.quantity));
    setPriceCurrency(getInitialPriceCurrency(binderCard));
    setPriceMode(binderCard.dynamicPriceRule ? "dynamic" : "manual");
    setDynamicPriceStrategy("CKD X");
    setPriceInput(formatPriceInputValue(binderCard.priceAmount));
    setCkdMultiplierInput(readStoredCustomCkdMultiplier());
  }, [binderCard, currency, getInitialPriceCurrency]);

  const persistBinderCard = async (
    set: BinderCardsUpdateInput,
    context?: UpdateBinderCardContext
  ) => {
    if (!binderCard) return;

    try {
      let updatedBinderCard: ModalBinderCardRecord | null | undefined;

      if (onUpdateBinderCard) {
        setIsSavingLocal(true);
        updatedBinderCard = await onUpdateBinderCard(binderCard, set, context);
      } else {
        const result = await updateBinderCard({
          variables: {
            id: binderCard.id,
            set,
          },
        });
        updatedBinderCard = result.data?.updateBinderCardsCollection.records[0];
      }

      if (!updatedBinderCard) {
        throw new Error(t("binder:detail.update_error"));
      }
      onBinderCardUpdated(updatedBinderCard);
    } catch (error) {
      handleError(error, t("binder:detail.update_error"));
    } finally {
      setIsSavingLocal(false);
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

  const handleManualPriceCommit = (
    nextCurrency = priceCurrency,
    nextPriceInput = priceInput
  ) => {
    if (!binderCard) return;

    const trimmedPrice = nextPriceInput.trim();
    if (!trimmedPrice) {
      writeStoredBinderCardPriceCurrency(nextCurrency);

      if (
        !binderCard.dynamicPriceRule &&
        arePriceAmountsEqual(binderCard.priceAmount, null) &&
        getInitialPriceCurrency(binderCard) === nextCurrency
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
        new Error(t("binder:detail.invalid_price")),
        t("binder:detail.update_error")
      );
      return;
    }

    writeStoredBinderCardPriceCurrency(nextCurrency);

    if (
      !binderCard.dynamicPriceRule &&
      arePriceAmountsEqual(binderCard.priceAmount, nextAmountInput) &&
      getInitialPriceCurrency(binderCard) === nextCurrency
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

    const nextAmountInput = formatCardKingdomMultiplierThbPriceInput(
      binderCard,
      multiplier
    );
    if (nextAmountInput === null) {
      handleError(
        new Error(t("binder:detail.ckd_missing_price")),
        t("binder:detail.update_error")
      );
      return;
    }

    setPriceCurrency(CurrencyCode.Thb);
    writeStoredBinderCardPriceCurrency(CurrencyCode.Thb);
    setPriceInput(nextAmountInput);
    if (
      !binderCard.dynamicPriceRule &&
      arePriceAmountsEqual(binderCard.priceAmount, nextAmountInput) &&
      getInitialPriceCurrency(binderCard) === CurrencyCode.Thb
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
        new Error(t("binder:detail.invalid_price")),
        t("binder:detail.update_error")
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
      getInitialPriceCurrency(binderCard) === priceCurrency
    ) {
      return;
    }

    writeStoredBinderCardPriceCurrency(priceCurrency);
    void persistBinderCard({
      dynamicPriceRule: strategy,
      priceAmount: null,
      priceCurrency,
    });
  };

  const handlePriceCurrencyChange = (nextCurrency: CurrencyCode) => {
    if (!binderCard) return;

    if (priceMode === "dynamic") {
      setPriceCurrency(nextCurrency);
      writeStoredBinderCardPriceCurrency(nextCurrency);

      if (
        binderCard.dynamicPriceRule === dynamicPriceStrategy &&
        arePriceAmountsEqual(binderCard.priceAmount, null) &&
        getInitialPriceCurrency(binderCard) === nextCurrency
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

    const trimmedPrice = priceInput.trim();
    if (!trimmedPrice) {
      setPriceCurrency(nextCurrency);
      handleManualPriceCommit(nextCurrency);
      return;
    }

    const nextAmountInput = trimmedPrice.replace(",", ".");
    const nextAmount = Number(nextAmountInput);
    if (!Number.isFinite(nextAmount) || nextAmount < 0) {
      handleError(
        new Error(t("binder:detail.invalid_price")),
        t("binder:detail.update_error")
      );
      return;
    }

    const convertedAmount = convertAmountToTargetCurrency(
      nextAmount,
      priceCurrency,
      nextCurrency
    );
    if (convertedAmount === null) {
      handleError(
        new Error(t("binder:detail.currency_conversion_error")),
        t("binder:detail.update_error")
      );
      return;
    }

    const convertedPriceInput = formatConvertedPriceInput(
      convertedAmount,
      nextCurrency
    );

    setPriceCurrency(nextCurrency);
    setPriceInput(convertedPriceInput);
    handleManualPriceCommit(nextCurrency, convertedPriceInput);
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
      getInitialPriceCurrency(binderCard) === priceCurrency
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

  const handleVariantChange = (variant: BinderCardVariant) => {
    if (!binderCard || variant.id === card?.id) return;

    const variantFinishes = variant.finishes.filter(
      (finish): finish is string => !!finish
    );
    const nextFinish = variantFinishes.includes(binderCard.finish)
      ? binderCard.finish
      : getDefaultFinish(variantFinishes);

    void persistBinderCard(
      {
        cardId: variant.id,
        ...(nextFinish === binderCard.finish ? {} : { finish: nextFinish }),
      },
      { variant }
    );
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-visible border-[#d8d1c3] bg-background p-0 text-[#343434] sm:max-w-6xl"
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
            isSaving={isSaving || isSavingLocal}
            positionLabel={
              currentIndex === null
                ? null
                : t("binder:detail.position", {
                    current: currentIndex + 1,
                    total: totalCards,
                  })
            }
            savingLabel={t("binder:detail.saving")}
            titleLabel={t("binder:detail.card_details")}
          />

          {isLoading && !binderCard ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loading />
            </div>
          ) : (
            <div className="grid min-h-0 gap-5 overflow-y-auto p-4 lg:grid-cols-[minmax(16rem,22rem)_1fr] lg:p-6">
              <BinderCardMediaPanel
                binderCard={binderCard}
                imageAlt={t("binder:detail.image_alt", {
                  name: card?.name || "",
                })}
                imageUrl={imageUrl}
                noImageLabel={noImageLabel}
                scryfallId={scryfallId}
                showConvertedMarketPrices={showConvertedMarketPrices}
                formatPrice={formatPrice}
                getBuyLabel={(source) =>
                  t("binder:detail.buy_at", {
                    source: marketPriceLabels[source],
                  })
                }
              />

              <div className="flex min-w-0 flex-col gap-4">
                <BinderCardTextPanel detail={detail} title={title} />

                {isEditable && binderCard && (
                  <BinderCardEditableFields
                    binderCard={binderCard}
                    card={card}
                    conditionLabel={t("binder:field.condition")}
                    finishLabel={t("binder:field.finish")}
                    finishOptions={finishOptions}
                    languageLabel={t("binder:field.language")}
                    quantityInput={quantityInput}
                    quantityLabel={t("binder:field.quantity")}
                    variantLabel={t("binder:detail.variant")}
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
                        currencyLabel={t("binder:field.currency")}
                        dynamicPriceStrategy={dynamicPriceStrategy}
                        priceCurrency={priceCurrency}
                        priceInput={priceInput}
                        priceInputId={priceInputId}
                        priceMode={priceMode}
                        priceModeLabels={{
                          manual: t("binder:detail.price_mode.manual"),
                          dynamic: t("binder:detail.price_mode.dynamic"),
                        }}
                        priceLabel={t("binder:detail.price")}
                        pricePlaceholder={t("binder:detail.price_placeholder")}
                        priceStrategyLabel={t("binder:detail.price_strategy")}
                        ckdMultiplierLabel={t("binder:detail.ckd_multiplier")}
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
