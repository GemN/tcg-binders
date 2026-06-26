import {
  type BinderCardsUpdateInput,
  CardCondition,
  CurrencyCode,
  LanguageCode,
  MarketPriceSource,
  useBinderCardVariantsQuery,
  useUpdateBinderCardMutation,
} from "@app/graphql";
import type { KeyboardEvent } from "react";
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
  DynamicPriceStrategy,
  ModalBinderCardRecord,
  PriceMode,
} from "@/components/ModalBinderCardDetail/types";
import {
  arePriceAmountsEqual,
  formatFallbackLabel,
  formatPriceInputValue,
  getCardDetail,
  getDefaultFinish,
  getVariantLabel,
  readStoredCustomCkdMultiplier,
  shouldIgnoreModalNavigationKey,
  writeStoredCustomCkdMultiplier,
} from "@/components/ModalBinderCardDetail/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import {
  type BinderCardDetailRecord,
  type BinderCardPriceInput,
  formatBinderCardPrice,
  getBinderCardMarketPrice,
} from "@/lib/binderCardPricing";
import { getCurrencySymbol } from "@/lib/currency";
import { handleError } from "@/lib/error";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

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
  const { i18n, t } = useTranslation(["binder", "common"]);
  const { convertAmountToLocalCurrency, currency } = usePricingSettings();
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
  const [variantQueryCardId, setVariantQueryCardId] = useState<string | null>(
    null
  );
  const [updateBinderCard, { loading: isSaving }] =
    useUpdateBinderCardMutation();
  const card = binderCard?.card;
  const detail = getCardDetail(card);
  const noImageLabel = t("binder:no_image");
  const fallbackPrice = "-";
  const title = card?.name || t("binder:detail.title");
  const imageUrl = card?.imageNormalUrl || card?.imageSmallUrl;
  const shouldLoadVariants = !!card?.id && variantQueryCardId === card.id;
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
      skip: !open || !isEditable || !card?.name || !shouldLoadVariants,
    });
  const variants = useMemo(() => {
    if (!shouldLoadVariants) return [];
    return variantsData?.cardsCollection?.edges.map(({ node }) => node) || [];
  }, [shouldLoadVariants, variantsData?.cardsCollection?.edges]);
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

  useEffect(() => {
    if (!binderCard) return;

    setQuantityInput(String(binderCard.quantity));
    setPriceCurrency(binderCard.priceCurrency || CurrencyCode.Thb);
    setPriceMode(binderCard.dynamicPriceRule ? "dynamic" : "manual");
    setDynamicPriceStrategy("CKD X");
    setPriceInput(formatPriceInputValue(binderCard.priceAmount));
    setCkdMultiplierInput(readStoredCustomCkdMultiplier());
  }, [binderCard]);

  useEffect(() => {
    setVariantQueryCardId(null);
  }, [binderCard?.id]);

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
        throw new Error(t("binder:detail.update_error"));
      }
      onBinderCardUpdated(updatedBinderCard);
    } catch (error) {
      handleError(error, t("binder:detail.update_error"));
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
        new Error(t("binder:detail.ckd_missing_price")),
        t("binder:detail.update_error")
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
        new Error(t("binder:detail.invalid_price")),
        t("binder:detail.update_error")
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

  const selectedVariant = variants.find((variant) => variant.id === card?.id);
  const selectedVariantLabel = selectedVariant
    ? getVariantLabel(selectedVariant)
    : [
        card?.cardSet?.code || "MTG",
        card?.collectorNumber ? `#${card.collectorNumber}` : null,
      ]
        .filter(Boolean)
        .join(" ");

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
            isSaving={isSaving}
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
                    variantLabel={t("binder:detail.variant")}
                    variants={variants}
                    getVariantLabel={getVariantLabel}
                    loadingVariantLabel={t("common:loading")}
                    onConditionChange={handleConditionChange}
                    onFinishChange={handleFinishChange}
                    onLanguageChange={handleLanguageChange}
                    onQuantityChange={setQuantityInput}
                    onQuantityCommit={handleQuantityCommit}
                    onVariantSelectOpenChange={(isOpen) => {
                      if (isOpen && card?.id) {
                        setVariantQueryCardId(card.id);
                      }
                    }}
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
                          manual: t("binder:detail.price_mode.manual"),
                          dynamic: t("binder:detail.price_mode.dynamic"),
                        }}
                        priceLabel={t("binder:detail.price")}
                        pricePlaceholder={t(
                          "binder:detail.price_placeholder"
                        )}
                        priceStrategyLabel={t(
                          "binder:detail.price_strategy"
                        )}
                        ckdMultiplierLabel={t(
                          "binder:detail.ckd_multiplier"
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
