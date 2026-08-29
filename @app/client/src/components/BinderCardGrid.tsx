import { BinderCard } from "@/components/BinderCard";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import { cn } from "@/lib/utils";

interface BinderCardGridProps {
  binderCards: BinderCardRecord[];
  className?: string;
  isDeletingCard?: boolean;
  isSelectionMode?: boolean;
  noImageLabel: string;
  onAddToCart?: (binderCard: BinderCardRecord) => void;
  onDeleteCard?: (binderCard: BinderCardRecord) => void;
  onOpenCard: (binderCard: BinderCardRecord, index: number) => void;
  onToggleCardSelection?: (binderCard: BinderCardRecord) => void;
  selectedBinderCardIds?: Set<string>;
  showConvertedMarketPrices: boolean;
}

export const BinderCardGrid = ({
  binderCards,
  className,
  isDeletingCard,
  isSelectionMode,
  noImageLabel,
  onAddToCart,
  onDeleteCard,
  onOpenCard,
  onToggleCardSelection,
  selectedBinderCardIds,
  showConvertedMarketPrices,
}: BinderCardGridProps) => {
  return (
    <div
      className={cn(
        "grid h-auto grid-cols-2 place-items-start content-start gap-3 gap-y-4 sm:grid-cols-4 md:h-full lg:grid-cols-7",
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
          showConvertedMarketPrices={showConvertedMarketPrices}
          onAddToCart={onAddToCart}
          onDelete={onDeleteCard}
          onOpen={onOpenCard}
          onToggleSelection={onToggleCardSelection}
        />
      ))}
    </div>
  );
};
