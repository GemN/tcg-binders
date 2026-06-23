import { cn } from "@/lib/utils";

export type BinderCardViewMode = "grid" | "list";

export interface BinderCardRecord {
  card: {
    cardSet?: {
      code?: string | null;
      name?: string | null;
    } | null;
    imageNormalUrl?: string | null;
    imageSmallUrl?: string | null;
    name: string;
    releasedAt?: string | null;
  } | null;
  id: string;
}

interface BinderCardProps {
  binderCard: BinderCardRecord;
  noImageLabel: string;
  viewMode: BinderCardViewMode;
}

const BinderCardImage = ({
  card,
  noImageLabel,
  className,
}: {
  card: BinderCardRecord["card"];
  noImageLabel: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex aspect-[63/88] items-center justify-center overflow-hidden rounded-md border border-primary/25 bg-background/70 shadow-2xl shadow-background/40 ring-1 ring-background/40",
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
    </div>
  );
};

const BinderCardMeta = ({ binderCard }: { binderCard: BinderCardRecord }) => {
  const card = binderCard.card;

  return (
    <div className="min-w-0">
      <h2 className="truncate text-sm font-medium">{card?.name}</h2>
      <p className="mt-1 truncate text-xs text-current/70">
        {card?.cardSet?.code || "MTG"}
        {card?.releasedAt ? ` · ${card.releasedAt}` : ""}
      </p>
    </div>
  );
};

export const BinderCard = ({
  binderCard,
  noImageLabel,
  viewMode,
}: BinderCardProps) => {
  if (viewMode === "list") {
    return (
      <article className="flex items-center gap-4 rounded-md border border-binder-toolbar-foreground/20 bg-binder-toolbar/80 p-3 text-binder-toolbar-foreground shadow-xl shadow-foreground/10 backdrop-blur">
        <BinderCardImage
          card={binderCard.card}
          noImageLabel={noImageLabel}
          className="h-24 w-[68px] shrink-0"
        />
        <BinderCardMeta binderCard={binderCard} />
      </article>
    );
  }

  return (
    <article className="group grid w-full max-w-[12rem] gap-2 text-foreground transition-transform hover:-translate-y-1">
      <BinderCardImage
        card={binderCard.card}
        noImageLabel={noImageLabel}
      />
      <BinderCardMeta binderCard={binderCard} />
    </article>
  );
};
