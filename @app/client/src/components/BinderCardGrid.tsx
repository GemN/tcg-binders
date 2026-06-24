import { BinderCard } from "@/components/BinderCard";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import { cn } from "@/lib/utils";

interface BinderCardGridProps {
  binderCards: BinderCardRecord[];
  className?: string;
  isDeletingCard?: boolean;
  noImageLabel: string;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onOpenCard: (binderCard: BinderCardRecord, index: number) => void;
}

export const BinderCardGrid = ({
  binderCards,
  className,
  isDeletingCard,
  noImageLabel,
  onDeleteCard,
  onOpenCard,
}: BinderCardGridProps) => {
  return (
    <div
      className={cn(
        "grid h-full grid-cols-2 place-items-start content-start gap-2 gap-y-4 sm:grid-cols-4 lg:grid-cols-7",
        className
      )}
    >
      {binderCards.map((binderCard, index) => (
        <BinderCard
          key={binderCard.id}
          binderCard={binderCard}
          isDeleting={isDeletingCard}
          noImageLabel={noImageLabel}
          onDelete={onDeleteCard}
          onOpen={(openedBinderCard) => onOpenCard(openedBinderCard, index)}
        />
      ))}
    </div>
  );
};
