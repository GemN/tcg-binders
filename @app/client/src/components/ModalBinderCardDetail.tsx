import { CardCondition, CurrencyCode, LanguageCode } from "@app/graphql";
import { type KeyboardEvent, useCallback } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { CardDetailTextPanel } from "@/components/CardDetailTextPanel";
import { Loading } from "@/components/Loading";
import { BinderCardEditableFields } from "@/components/ModalBinderCardDetail/BinderCardEditableFields";
import { BinderCardMediaPanel } from "@/components/ModalBinderCardDetail/BinderCardMediaPanel";
import { BinderCardOfferPanel } from "@/components/ModalBinderCardDetail/BinderCardOfferPanel";
import { BinderCardPricingFields } from "@/components/ModalBinderCardDetail/BinderCardPricingFields";
import { ModalDetailHeader } from "@/components/ModalBinderCardDetail/ModalDetailHeader";
import { ModalDetailNavigation } from "@/components/ModalBinderCardDetail/ModalDetailNavigation";
import type {
  BinderCardPriceIntent,
  BinderCardPriceUpdate,
  BinderCardVariant,
  DynamicPriceStrategy,
  ManualPriceSnapshot,
  ModalBinderCardRecord,
  PriceMode,
} from "@/components/ModalBinderCardDetail/types";
import {
  arePriceAmountsEqual,
  formatFallbackLabel,
  formatPriceInputValue,
  getCardDetail,
  readStoredBinderCardPriceCurrency,
  readStoredCustomCkdMultiplier,
  shouldIgnoreModalNavigationKey,
  writeStoredBinderCardPriceCurrency,
  writeStoredCustomCkdMultiplier,
} from "@/components/ModalBinderCardDetail/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { getPreferredCardFinish } from "@/config/card";
import {
  type BinderCardPriceInput,
  formatBinderCardPrice,
  formatCardKingdomMultiplierThbPriceInput,
  getCardKingdomUsdMarketPriceAmount,
} from "@/lib/binderCardPricing";
import {
  type BinderEditing,
  type BinderEditingCardUpdate,
  createBinderEditingCardSnapshot,
  isBinderEditingCoherenceError,
  presentBinderEditingError,
} from "@/lib/binderEditing";
import { getCardImageBaseUrl, getCardScryfallId } from "@/lib/cardImageUrl";
import {
  formatCurrency,
  getCurrencyFractionDigits,
  getCurrencySymbol,
} from "@/lib/currency";
import { handleError } from "@/lib/error";
import {
  isSupportedCurrency,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

interface ModalBinderCardDetailProps {
  binderEditing?: BinderEditing;
  binderCard: ModalBinderCardRecord | null;
  canUseCommerce: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  currentIndex: number | null;
  isLoading: boolean;
  open: boolean;
  showConvertedMarketPrices: boolean;
  totalCards: number;
  onAddToCart: (binderCard: ModalBinderCardRecord) => void;
  onCoherenceFailure?: () => void;
  onGoNext: () => void;
  onGoPrevious: () => void;
  onOpenChange: (open: boolean) => void;
}

export const ModalBinderCardDetail = ({
  binderEditing,
  binderCard,
  canUseCommerce,
  canGoNext,
  canGoPrevious,
  currentIndex,
  isLoading,
  open,
  showConvertedMarketPrices,
  totalCards,
  onAddToCart,
  onCoherenceFailure,
  onGoNext,
  onGoPrevious,
  onOpenChange,
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
  const [pendingPersistenceCount, setPendingPersistenceCount] = useState(0);
  const [requiresReload, setRequiresReload] = useState(false);
  const manualPriceSnapshotsRef = useRef<Map<string, ManualPriceSnapshot>>(
    new Map()
  );
  const latestPriceIntentsRef = useRef<Map<string, BinderCardPriceIntent>>(
    new Map()
  );
  const pricePersistenceQueueRef = useRef<Promise<void>>(Promise.resolve());
  const isSaving = pendingPersistenceCount > 0;
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
  const cardKingdomUsdMarketPriceAmount = binderCard
    ? getCardKingdomUsdMarketPriceAmount(binderCard)
    : null;
  const ckdMarketPriceLabel =
    cardKingdomUsdMarketPriceAmount === null
      ? fallbackPrice
      : formatCurrency(
          cardKingdomUsdMarketPriceAmount,
          CurrencyCode.Usd,
          i18n.language
        );
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

    const persistedPriceAmount =
      formatPriceInputValue(binderCard.priceAmount) || null;
    const persistedPriceCurrency = getInitialPriceCurrency(binderCard);
    const latestPriceIntent = latestPriceIntentsRef.current.get(binderCard.id);
    const doesPersistedPriceMatchLatestIntent =
      !latestPriceIntent ||
      ((binderCard.dynamicPriceRule ?? null) ===
        latestPriceIntent.dynamicPriceRule &&
        arePriceAmountsEqual(
          persistedPriceAmount,
          latestPriceIntent.priceAmount
        ) &&
        persistedPriceCurrency === latestPriceIntent.priceCurrency);

    if (!binderCard.dynamicPriceRule) {
      if (doesPersistedPriceMatchLatestIntent) {
        manualPriceSnapshotsRef.current.set(binderCard.id, {
          binderCardId: binderCard.id,
          priceAmount: persistedPriceAmount,
          priceCurrency: persistedPriceCurrency,
        });
      }
    }

    setQuantityInput(String(binderCard.quantity));
    const displayedPriceAmount = doesPersistedPriceMatchLatestIntent
      ? persistedPriceAmount
      : (latestPriceIntent?.priceAmount ?? null);
    const displayedPriceCurrency = doesPersistedPriceMatchLatestIntent
      ? persistedPriceCurrency
      : (latestPriceIntent?.priceCurrency ?? persistedPriceCurrency);
    const displayedDynamicPriceRule = doesPersistedPriceMatchLatestIntent
      ? binderCard.dynamicPriceRule
      : latestPriceIntent?.dynamicPriceRule;
    const displayedDynamicPriceStrategy: DynamicPriceStrategy =
      displayedDynamicPriceRule === "CKD X"
        ? displayedDynamicPriceRule
        : "CKD X";

    setPriceCurrency(displayedPriceCurrency);
    setPriceMode(displayedDynamicPriceRule ? "dynamic" : "manual");
    setDynamicPriceStrategy(displayedDynamicPriceStrategy);
    setPriceInput(formatPriceInputValue(displayedPriceAmount));
    setCkdMultiplierInput(readStoredCustomCkdMultiplier());
  }, [binderCard, currency, getInitialPriceCurrency]);

  const runBinderCardPersistence = async (
    update: BinderEditingCardUpdate,
    targetBinderCardId: string,
    targetBinderEditing: BinderEditing
  ): Promise<boolean> => {
    try {
      await targetBinderEditing.updateCard(targetBinderCardId, update);
      return true;
    } catch (error) {
      presentBinderEditingError(error, {
        fallbackMessage: t("binder:detail.update_error"),
        reasonMessages: {
          coherence_failed: t("binder:editing.coherence_failed"),
        },
      });
      if (isBinderEditingCoherenceError(error)) {
        setRequiresReload(true);
        onCoherenceFailure?.();
      }
      return false;
    }
  };

  const persistBinderCard = async (update: BinderEditingCardUpdate) => {
    const targetBinderCardId = binderCard?.id;
    const targetBinderEditing = binderEditing;
    if (!targetBinderCardId || !targetBinderEditing) return false;

    setPendingPersistenceCount((currentCount) => currentCount + 1);
    try {
      return await runBinderCardPersistence(
        update,
        targetBinderCardId,
        targetBinderEditing
      );
    } finally {
      setPendingPersistenceCount((currentCount) =>
        Math.max(currentCount - 1, 0)
      );
    }
  };

  const doesPriceUpdateMatchCurrentIntent = (
    update: BinderCardPriceUpdate
  ): boolean => {
    if (!binderCard) return false;

    const latestPriceIntent = latestPriceIntentsRef.current.get(binderCard.id);
    if (latestPriceIntent) {
      return (
        latestPriceIntent.dynamicPriceRule === update.dynamicPriceRule &&
        arePriceAmountsEqual(
          latestPriceIntent.priceAmount,
          update.priceAmount
        ) &&
        latestPriceIntent.priceCurrency === update.priceCurrency
      );
    }

    return (
      binderCard.dynamicPriceRule === update.dynamicPriceRule &&
      arePriceAmountsEqual(binderCard.priceAmount, update.priceAmount) &&
      getInitialPriceCurrency(binderCard) === update.priceCurrency
    );
  };

  const persistPriceUpdate = (
    update: BinderCardPriceUpdate,
    force = false
  ) => {
    const targetBinderCardId = binderCard?.id;
    const targetBinderEditing = binderEditing;
    if (!targetBinderCardId || !targetBinderEditing) return;
    if (!force && doesPriceUpdateMatchCurrentIntent(update)) return;

    const priceIntent: BinderCardPriceIntent = {
      binderCardId: targetBinderCardId,
      ...update,
    };
    latestPriceIntentsRef.current.set(targetBinderCardId, priceIntent);
    setPendingPersistenceCount((currentCount) => currentCount + 1);

    pricePersistenceQueueRef.current = pricePersistenceQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          const didPersist = await runBinderCardPersistence(
            update,
            targetBinderCardId,
            targetBinderEditing
          );
          if (
            !didPersist &&
            latestPriceIntentsRef.current.get(targetBinderCardId) ===
              priceIntent
          ) {
            latestPriceIntentsRef.current.delete(targetBinderCardId);
          }
        } finally {
          setPendingPersistenceCount((currentCount) =>
            Math.max(currentCount - 1, 0)
          );
        }
      });
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

  const handleAddToCart = () => {
    if (!binderCard) return;

    onAddToCart(binderCard);
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
      manualPriceSnapshotsRef.current.set(binderCard.id, {
        binderCardId: binderCard.id,
        priceAmount: null,
        priceCurrency: nextCurrency,
      });
      writeStoredBinderCardPriceCurrency(nextCurrency);

      persistPriceUpdate({
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

    manualPriceSnapshotsRef.current.set(binderCard.id, {
      binderCardId: binderCard.id,
      priceAmount: nextAmountInput,
      priceCurrency: nextCurrency,
    });
    writeStoredBinderCardPriceCurrency(nextCurrency);

    persistPriceUpdate({
      dynamicPriceRule: null,
      priceAmount: nextAmountInput,
      priceCurrency: nextCurrency,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && binderEditing && priceMode === "manual") {
      handleManualPriceCommit();
    }

    onOpenChange(nextOpen);
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
    manualPriceSnapshotsRef.current.set(binderCard.id, {
      binderCardId: binderCard.id,
      priceAmount: nextAmountInput,
      priceCurrency: CurrencyCode.Thb,
    });

    persistPriceUpdate({
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
    writeStoredBinderCardPriceCurrency(priceCurrency);
    persistPriceUpdate({
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

      persistPriceUpdate({
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
      const trimmedPrice = priceInput.trim();
      const nextAmountInput = trimmedPrice.replace(",", ".");
      const nextAmount = Number(nextAmountInput);

      if (!trimmedPrice || (Number.isFinite(nextAmount) && nextAmount >= 0)) {
        manualPriceSnapshotsRef.current.set(binderCard.id, {
          binderCardId: binderCard.id,
          priceAmount: trimmedPrice ? nextAmountInput : null,
          priceCurrency,
        });
      }

      applyDynamicPriceStrategy(dynamicPriceStrategy);
      return;
    }

    const manualPriceSnapshot = manualPriceSnapshotsRef.current.get(
      binderCard.id
    );
    const restoredPriceAmount = manualPriceSnapshot?.priceAmount ?? null;
    const restoredPriceCurrency =
      manualPriceSnapshot?.priceCurrency ?? priceCurrency;

    manualPriceSnapshotsRef.current.set(binderCard.id, {
      binderCardId: binderCard.id,
      priceAmount: restoredPriceAmount,
      priceCurrency: restoredPriceCurrency,
    });
    setPriceInput(formatPriceInputValue(restoredPriceAmount));
    setPriceCurrency(restoredPriceCurrency);
    writeStoredBinderCardPriceCurrency(restoredPriceCurrency);

    persistPriceUpdate(
      {
        dynamicPriceRule: null,
        priceAmount: restoredPriceAmount,
        priceCurrency: restoredPriceCurrency,
      },
      true
    );
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
      : getPreferredCardFinish(variantFinishes);

    void persistBinderCard({
      card: createBinderEditingCardSnapshot(variant),
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="right-0 bottom-0 left-0 top-auto max-h-[95svh] w-full max-w-none translate-x-0 translate-y-0 overflow-visible rounded-t-2xl rounded-b-none border-border bg-background p-0 pb-[env(safe-area-inset-bottom)] text-foreground max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=open]:slide-in-from-bottom sm:max-w-none md:top-[50%] md:right-auto md:bottom-auto md:left-[50%] md:max-h-none md:max-w-6xl md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-lg md:pb-0"
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
        <div className="flex max-h-[calc(95svh_-_env(safe-area-inset-bottom))] min-h-0 flex-col overflow-hidden rounded-t-2xl rounded-b-none md:max-h-[92svh] md:rounded-lg">
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
                scryfallId={scryfallId}
                showConvertedMarketPrices={showConvertedMarketPrices}
                formatPrice={formatPrice}
              />

              <div className="flex min-w-0 flex-col gap-4">
                <CardDetailTextPanel
                  card={card}
                  detail={detail}
                  title={title}
                />

                {requiresReload && (
                  <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {t("binder:editing.coherence_failed")}
                  </p>
                )}

                {binderCard &&
                  (binderEditing && !requiresReload ? (
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
                          ckdMarketPriceLabel={ckdMarketPriceLabel}
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
                          pricePlaceholder={t(
                            "binder:detail.price_placeholder"
                          )}
                          priceStrategyLabel={t("binder:detail.price_strategy")}
                          ckdMultiplierLabel={t("binder:detail.ckd_multiplier")}
                          titleLabel={t("binder:detail.pricing")}
                          getCurrencyLabel={getCurrencyLabel}
                          onCkdMultiplierChange={setCkdMultiplierInput}
                          onCustomCkdCommit={handleCustomCkdCommit}
                          onManualPriceCommit={() => handleManualPriceCommit()}
                          onPriceCurrencyChange={handlePriceCurrencyChange}
                          onPriceInputChange={setPriceInput}
                          onPriceModeChange={handlePriceModeChange}
                          onPresetCkd={handleCkdPreset}
                          onDynamicPriceStrategyChange={
                            applyDynamicPriceStrategy
                          }
                        />
                      }
                    />
                  ) : (
                    <BinderCardOfferPanel
                      addToCartLabel={t("binder:detail.add_to_cart")}
                      availableLabel={t("binder:detail.available", {
                        count: binderCard.quantity,
                      })}
                      binderCard={binderCard}
                      convertedPriceValue={
                        showConvertedMarketPrices &&
                        binderCard.priceCurrency &&
                        binderCard.priceCurrency !== currency &&
                        binderCard.priceAmount !== null &&
                        binderCard.priceAmount !== undefined
                          ? formatPrice({
                              amount: binderCard.priceAmount,
                              shouldConvert: true,
                              sourceCurrency: binderCard.priceCurrency,
                            })
                          : null
                      }
                      notAvailableLabel={t("common:not_available")}
                      priceValue={formatPrice({
                        amount: binderCard.priceAmount,
                        shouldConvert: false,
                        sourceCurrency: binderCard.priceCurrency,
                      })}
                      onAddToCart={canUseCommerce ? handleAddToCart : undefined}
                      translateCardOption={translateCardOption}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
