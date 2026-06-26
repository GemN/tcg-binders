import { CurrencyCode, useUpdateBinderCardMutation } from "@app/graphql";
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
import { formatCurrency } from "@/lib/currency";
import { handleError } from "@/lib/error";

interface ModalBulkBinderCardPriceProps {
  binderCards: BinderCardRecord[];
  open: boolean;
  onApplied: () => Promise<unknown> | unknown;
  onOpenChange: (open: boolean) => void;
}

interface BulkPriceResult {
  applied: number;
  failed: number;
  skipped: number;
}

interface BulkPricePreview {
  applicableCount: number;
  cardName: string;
  resultPrice: string;
  sourcePrice: string;
}

const CKD_PRESET_MULTIPLIERS = [25, 30];
const BULK_PRICE_CONCURRENCY = 4;

const runWithConcurrency = async <T,>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
) => {
  let nextIndex = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        await worker(item);
      }
    }
  );

  await Promise.all(workers);
};

export const ModalBulkBinderCardPrice = ({
  binderCards,
  open,
  onApplied,
  onOpenChange,
}: ModalBulkBinderCardPriceProps) => {
  const { i18n, t } = useTranslation(["binder", "common"]);
  const multiplierInputId = useId();
  const [multiplierInput, setMultiplierInput] = useState("25");
  const [isApplying, setIsApplying] = useState(false);
  const [updateBinderCard] = useUpdateBinderCardMutation();
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

  const applyBulkPrice = async () => {
    if (!isMultiplierValid) {
      handleError(
        new Error(t("binder:bulk_price.invalid_multiplier")),
        t("binder:bulk_price.invalid_multiplier")
      );
      return;
    }

    setIsApplying(true);
    const result: BulkPriceResult = {
      applied: 0,
      failed: 0,
      skipped: 0,
    };

    try {
      await runWithConcurrency(
        binderCards,
        BULK_PRICE_CONCURRENCY,
        async (binderCard) => {
          const multiplierThbPriceInput =
            formatCardKingdomMultiplierThbPriceInput(
              binderCard,
              multiplier
            );

          if (multiplierThbPriceInput === null) {
            result.skipped += 1;
            return;
          }

          try {
            await updateBinderCard({
              variables: {
                id: binderCard.id,
                set: {
                  dynamicPriceRule: null,
                  priceAmount: multiplierThbPriceInput,
                  priceCurrency: CurrencyCode.Thb,
                },
              },
            });
            result.applied += 1;
          } catch (error) {
            console.error(error);
            result.failed += 1;
          }
        }
      );

      const resultTranslationParams = {
        applied: result.applied,
        count: result.applied,
        failed: result.failed,
        skipped: result.skipped,
      };

      if (result.applied === 0 && result.skipped > 0 && result.failed === 0) {
        toast.info(t("binder:bulk_price.no_price"));
      } else if (result.failed > 0) {
        toast.error(
          t("binder:bulk_price.failed", resultTranslationParams)
        );
      } else if (result.skipped > 0) {
        toast.info(
          t("binder:bulk_price.partial", resultTranslationParams)
        );
      } else {
        toast.success(
          t("binder:bulk_price.success", resultTranslationParams)
        );
      }

      if (result.applied > 0) {
        await onApplied();
        onOpenChange(false);
      }
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
