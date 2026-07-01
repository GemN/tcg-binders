import { BinderCard } from "@/components/BinderCard";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import { cn } from "@/lib/utils";

interface BinderCardGridProps {
  binderCards: BinderCardRecord[];
  className?: string;
  isDeletingCard?: boolean;
  isSelectionMode?: boolean;
  noImageLabel: string;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onOpenCard: (binderCard: BinderCardRecord, index: number) => void;
  onToggleCardSelection?: (binderCard: BinderCardRecord) => void;
  selectedBinderCardIds?: Set<string>;
}

export const BinderCardGrid = ({
  binderCards,
  className,
  isDeletingCard,
  isSelectionMode,
  noImageLabel,
  onDeleteCard,
  onOpenCard,
  onToggleCardSelection,
  selectedBinderCardIds,
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
          index={index}
          isDeleting={isDeletingCard}
          isSelected={selectedBinderCardIds?.has(binderCard.id)}
          isSelectionMode={isSelectionMode}
          noImageLabel={noImageLabel}
          onDelete={onDeleteCard}
          onOpen={onOpenCard}
          onToggleSelection={onToggleCardSelection}
        />
      ))}
    </div>
  );
};
