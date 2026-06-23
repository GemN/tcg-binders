import {
  BinderCard,
  type BinderCardRecord,
} from "@/components/BinderCard";
import { cn } from "@/lib/utils";

interface BinderCardListProps {
  binderCards: BinderCardRecord[];
  className?: string;
  noImageLabel: string;
}

export const BinderCardList = ({
  binderCards,
  className,
  noImageLabel,
}: BinderCardListProps) => {
  return (
    <div className={cn("grid content-center gap-3", className)}>
      {binderCards.map((binderCard) => (
        <BinderCard
          key={binderCard.id}
          binderCard={binderCard}
          noImageLabel={noImageLabel}
          viewMode="list"
        />
      ))}
    </div>
  );
};
