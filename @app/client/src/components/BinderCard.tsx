import { useTranslation } from "react-i18next";

import { BinderCardActionsMenu } from "@/components/BinderCardActionsMenu";
import {
  type BinderCardRecord,
  formatBinderCardPrice,
} from "@/lib/binderCardPricing";
import { getCardConditionAbbreviation } from "@/lib/cardCondition";
import { cn } from "@/lib/utils";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

export type BinderCardViewMode = "grid" | "list";

interface BinderCardProps {
  binderCard: BinderCardRecord;
  isDeleting?: boolean;
  noImageLabel: string;
  onDelete?: (binderCard: BinderCardRecord) => void;
  onOpen: (binderCard: BinderCardRecord) => void;
}

interface BinderCardImageProps {
  card: BinderCardRecord["card"];
  conditionLabel: string;
  noImageLabel: string;
  priceLabel: string;
  quantityLabel: string;
  className?: string;
}

const BinderCardImage = ({
  card,
  conditionLabel,
  noImageLabel,
  priceLabel,
  quantityLabel,
  className,
}: BinderCardImageProps) => {
  return (
    <div
      className={cn(
        "relative flex aspect-[63/88] items-center justify-center overflow-hidden rounded-md border border-primary/25 bg-background/70 shadow-2xl shadow-background/40 ring-1 ring-background/40",
        className
      )}
    >
      {card?.imageNormalUrl || card?.imageSmallUrl ? (
        <img
          src={card.imageNormalUrl || card.imageSmallUrl || ""}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-sm text-muted-foreground">{noImageLabel}</span>
      )}
      <span className="absolute bottom-2 left-2 flex w-fit flex-col items-start gap-1 text-xs font-semibold tabular-nums text-white">
        <span className="w-fit rounded-sm bg-black/70 px-2 py-0.5">
          {conditionLabel}
        </span>
        <span className="w-fit rounded-sm bg-black/70 px-2 py-0.5">
          {quantityLabel}
        </span>
      </span>
      <span className="absolute right-2 bottom-2 rounded-sm bg-black/70 px-2 py-1 text-xs font-semibold tabular-nums text-white">
        {priceLabel}
      </span>
    </div>
  );
};

const useBinderCardPriceLabel = (binderCard: BinderCardRecord): string => {
  const { i18n } = useTranslation(["common"]);
  const { convertAmount, currency } = usePricingSettings();
  const displayPrice = formatBinderCardPrice({
    amount: binderCard.priceAmount,
    convertAmount,
    displayCurrency: currency,
    locale: i18n.language,
    shouldConvert: true,
    sourceCurrency: binderCard.priceCurrency,
  });

  return displayPrice || "-";
};

export const BinderCard = ({
  binderCard,
  isDeleting,
  noImageLabel,
  onDelete,
  onOpen,
}: BinderCardProps) => {
  const { t } = useTranslation(["common"]);
  const priceLabel = useBinderCardPriceLabel(binderCard);
  const conditionLabel = t(
    `common:card.condition_short.${binderCard.condition}`,
    {
      defaultValue: getCardConditionAbbreviation(binderCard.condition),
    }
  );
  const cardName = binderCard.card?.name || noImageLabel;

  return (
    <div className="relative w-full max-w-[12rem] text-left text-foreground">
      <button
        type="button"
        aria-label={t("common:binder.detail.open_card", { name: cardName })}
        className="group grid w-full cursor-pointer transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={() => onOpen(binderCard)}
      >
        <BinderCardImage
          card={binderCard.card}
          conditionLabel={conditionLabel}
          noImageLabel={noImageLabel}
          priceLabel={priceLabel}
          quantityLabel={String(binderCard.quantity)}
        />
      </button>
      {onDelete && (
        <BinderCardActionsMenu
          cardName={cardName}
          className="absolute top-2 right-2"
          disabled={isDeleting}
          onDelete={() => onDelete(binderCard)}
        />
      )}
    </div>
  );
};
