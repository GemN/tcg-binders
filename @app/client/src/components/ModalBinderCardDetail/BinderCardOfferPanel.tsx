import { PackageCheck, ShoppingBasket } from "lucide-react";

import { CardConditionBadge } from "@/components/CardConditionBadge";
import { CountryFlag } from "@/components/CountryFlag";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cardLanguageFlagCodes, isFoilCardFinish } from "@/config/card";

import type { ModalBinderCardRecord } from "./types";

interface BinderCardOfferPanelProps {
  addToBasketLabel: string;
  availableLabel: string;
  binderCard: ModalBinderCardRecord;
  convertedPriceValue: string | null;
  notAvailableLabel: string;
  priceValue: string;
  titleLabel: string;
  translateCardOption: (
    group: "condition" | "finish" | "language",
    value: string | null | undefined
  ) => string | null;
}

export const BinderCardOfferPanel = ({
  addToBasketLabel,
  availableLabel,
  binderCard,
  convertedPriceValue,
  notAvailableLabel,
  priceValue,
  titleLabel,
  translateCardOption,
}: BinderCardOfferPanelProps) => {
  const conditionValue =
    translateCardOption("condition", binderCard.condition) || notAvailableLabel;
  const finishValue =
    translateCardOption("finish", binderCard.finish) || notAvailableLabel;
  const shouldShowFinish = isFoilCardFinish(binderCard.finish);
  const languageValue =
    translateCardOption("language", binderCard.language) || notAvailableLabel;

  return (
    <section className="rounded-md border border-border bg-card text-card-foreground shadow-sm">
      <div className="grid gap-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {titleLabel}
          </p>
          <Badge variant="success" size="md">
            <PackageCheck className="size-4" />
            {availableLabel}
          </Badge>
        </div>

        <div className="grid max-w-sm gap-3">
          <div>
            <p className="text-4xl font-semibold leading-none tracking-normal text-foreground">
              {priceValue}
            </p>
            {convertedPriceValue && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                ~ {convertedPriceValue}
              </p>
            )}
          </div>

          <Button type="button" size="lg" className="w-full">
            <ShoppingBasket className="size-4" />
            {addToBasketLabel}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-semibold text-foreground">
            <CardConditionBadge
              condition={binderCard.condition}
              className="rounded-sm py-0.5"
            />
            {conditionValue}
          </span>
          {shouldShowFinish && (
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-semibold text-foreground">
              {finishValue}
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-semibold text-foreground">
            <CountryFlag
              code={cardLanguageFlagCodes[binderCard.language]}
              className="h-3.5 w-5"
              label={languageValue}
            />
            {languageValue}
          </span>
        </div>
      </div>
    </section>
  );
};
