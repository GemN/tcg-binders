import { CurrencyCode } from "@app/graphql";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  type BinderCardRecord,
  formatCardKingdomMultiplierThbPriceInput,
  getCardKingdomUsdMarketPriceAmount,
} from "@/lib/binderCardPricing";
import type {
  BinderEditing,
  BinderEditingBulkOutcome,
} from "@/lib/binderEditing";
import {
  isBinderEditingCoherenceError,
  presentBinderEditingError,
} from "@/lib/binderEditing";
import { formatCurrency } from "@/lib/currency";

interface ModalBulkBinderCardPriceProps {
  binderEditing: BinderEditing;
  binderCards: BinderCardRecord[];
  open: boolean;
  onApplied: (coherenceFailed: boolean) => Promise<unknown> | unknown;
  onOpenChange: (open: boolean) => void;
}

interface BulkPricePreview {
  applicableCount: number;
  cardName: string;
  resultPrice: string;
  sourcePrice: string;
}

const CKD_PRESET_MULTIPLIERS = [25, 30];

export const ModalBulkBinderCardPrice = ({
  binderEditing,
  binderCards,
  open,
  onApplied,
  onOpenChange,
}: ModalBulkBinderCardPriceProps) => {
  const { i18n, t } = useTranslation(["binder", "common"]);
  const multiplierInputId = useId();
  const [multiplierInput, setMultiplierInput] = useState("25");
  const [isApplying, setIsApplying] = useState(false);
  const multiplier = Number(multiplierInput.replace(",", "."));
  const isMultiplierValid = Number.isFinite(multiplier) && multiplier > 0;
  const preview = useMemo<BulkPricePreview | null>(() => {
    const applicableBinderCards = binderCards
      .map((binderCard) => ({
        binderCard,
        cardKingdomUsdMarketPriceAmount:
          getCardKingdomUsdMarketPriceAmount(binderCard),
      }))
      .filter(
        (
          item
        ): item is {
          binderCard: BinderCardRecord;
          cardKingdomUsdMarketPriceAmount: number;
        } => item.cardKingdomUsdMarketPriceAmount !== null
      );
    const previewCard = applicableBinderCards[0];

    if (!previewCard || !isMultiplierValid) return null;

    const multiplierThbPriceInput = formatCardKingdomMultiplierThbPriceInput(
      previewCard.binderCard,
      multiplier
    );
    if (multiplierThbPriceInput === null) return null;

    return {
      applicableCount: applicableBinderCards.length,
      cardName: previewCard.binderCard.card?.name || t("common:not_available"),
      resultPrice: formatCurrency(
        Number(multiplierThbPriceInput),
        CurrencyCode.Thb,
        i18n.language
      ),
      sourcePrice: formatCurrency(
        previewCard.cardKingdomUsdMarketPriceAmount,
        CurrencyCode.Usd,
        i18n.language
      ),
    };
  }, [binderCards, i18n.language, isMultiplierValid, multiplier, t]);

  const handleBulkPriceOutcome = async (
    result: BinderEditingBulkOutcome,
    coherenceFailed: boolean
  ) => {
    const resultTranslationParams = {
      applied: result.applied,
      count: result.applied,
      failed: result.failed,
      skipped: result.skipped,
    };

    if (coherenceFailed) {
      toast.error(
        t("binder:bulk_price.refresh_failed", resultTranslationParams)
      );
    } else if (
      result.applied === 0 &&
      result.skipped > 0 &&
      result.failed === 0
    ) {
      toast.info(t("binder:bulk_price.no_price"));
    } else if (result.failed > 0) {
      toast.error(t("binder:bulk_price.failed", resultTranslationParams));
    } else if (result.skipped > 0) {
      toast.info(t("binder:bulk_price.partial", resultTranslationParams));
    } else {
      toast.success(t("binder:bulk_price.success", resultTranslationParams));
    }

    if (result.applied > 0) {
      await onApplied(coherenceFailed);
      onOpenChange(false);
    }
  };

  const applyBulkPrice = async () => {
    setIsApplying(true);

    try {
      let coherenceFailed = false;
      let result: BinderEditingBulkOutcome;

      try {
        result = await binderEditing.applyCardKingdomMultiplier({
          cards: binderCards.map((binderCard) => ({
            binderCardId: binderCard.id,
            sourcePriceAmount: getCardKingdomUsdMarketPriceAmount(binderCard),
          })),
          multiplier,
        });
      } catch (error) {
        if (!isBinderEditingCoherenceError(error) || !error.outcome) {
          throw error;
        }

        coherenceFailed = true;
        result = error.outcome;
      }

      await handleBulkPriceOutcome(result, coherenceFailed);
    } catch (error) {
      presentBinderEditingError(error, {
        fallbackMessage: t("binder:detail.update_error"),
        reasonMessages: {
          coherence_failed: t("binder:editing.coherence_failed"),
          invalid_multiplier: t("binder:bulk_price.invalid_multiplier"),
        },
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("binder:bulk_price.title")}</DialogTitle>
          <DialogDescription>
            {t("binder:bulk_price.description", {
              count: binderCards.length,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Label htmlFor={multiplierInputId}>
            {t("binder:bulk_price.multiplier_label")}
          </Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={multiplierInputId}
              inputMode="decimal"
              value={multiplierInput}
              className="w-32 bg-[#E8E8E8] text-[#343434] placeholder:text-[#9f9688]"
              onChange={(event) => setMultiplierInput(event.target.value)}
            />
            <div className="flex h-9 overflow-hidden rounded-md border">
              {CKD_PRESET_MULTIPLIERS.map((presetMultiplier) => (
                <Button
                  key={presetMultiplier}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-none border-r px-3 text-xs last:border-r-0"
                  onClick={() => setMultiplierInput(String(presetMultiplier))}
                >
                  CKD {presetMultiplier}
                </Button>
              ))}
            </div>
          </div>
          {preview && (
            <p className="text-sm text-muted-foreground">
              {t("binder:bulk_price.preview", {
                count: preview.applicableCount,
                multiplier,
                name: preview.cardName,
                price: preview.resultPrice,
                sourcePrice: preview.sourcePrice,
                total: binderCards.length,
              })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common:cancel")}
          </Button>
          <Button
            type="button"
            variant="success"
            isLoading={isApplying}
            disabled={!binderCards.length || !isMultiplierValid}
            onClick={applyBulkPrice}
          >
            {t("binder:bulk_price.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
