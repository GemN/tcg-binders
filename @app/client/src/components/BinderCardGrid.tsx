import {
  BinderCard,
  type BinderCardRecord,
} from "@/components/BinderCard";
import { cn } from "@/lib/utils";

interface BinderCardGridProps {
  binderCards: BinderCardRecord[];
  className?: string;
  noImageLabel: string;
}

export const BinderCardGrid = ({
  binderCards,
  className,
  noImageLabel,
}: BinderCardGridProps) => {
  return (
    <div
      className={cn(
        "grid h-full grid-cols-2 place-items-start content-start gap-2 gap-y-4 sm:grid-cols-4 lg:grid-cols-7",
        className
      )}
    >
      {binderCards.map((binderCard) => (
        <BinderCard
          key={binderCard.id}
          binderCard={binderCard}
          noImageLabel={noImageLabel}
          viewMode="grid"
        />
      ))}
    </div>
  );
};
