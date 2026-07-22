import type { Cards, CardSets, MtgCardDetails } from "@app/graphql";
import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/Badge";

type CardDetail = Pick<MtgCardDetails, "oracleText" | "typeLine"> | null;

export type CardDetailTextPanelCard = Pick<
  Cards,
  "collectorNumber" | "rarity" | "releasedAt"
> & {
  cardSet?: Pick<CardSets, "name"> | null;
};

const formatMetadataLabel = (value: string): string => {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

interface CardDetailTextPanelProps {
  card: CardDetailTextPanelCard | null | undefined;
  detail: CardDetail;
  title: string;
  titleAs?: "h1" | "h2";
}

export const CardDetailTextPanel = ({
  card,
  detail,
  title,
  titleAs: Title = "h2",
}: CardDetailTextPanelProps) => {
  const { t } = useTranslation(["common"]);
  const hasMetadata = !!(
    card?.cardSet?.name ||
    card?.collectorNumber ||
    card?.rarity
  );
  const releasedAtLabel = card?.releasedAt
    ? format(parseISO(card.releasedAt), "PPP")
    : null;

  return (
    <>
      <div>
        <Title className="text-2xl font-semibold leading-tight text-foreground">
          {title}
        </Title>
        {detail?.typeLine && (
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {detail.typeLine}
          </p>
        )}
      </div>

      {(detail?.oracleText || hasMetadata || releasedAtLabel) && (
        <div className="rounded-md border border-border bg-card p-4">
          {detail?.oracleText && (
            <p className="whitespace-pre-line text-sm leading-6 text-card-foreground">
              {detail.oracleText}
            </p>
          )}
          {(hasMetadata || releasedAtLabel) && (
            <div className={detail?.oracleText ? "mt-4" : undefined}>
              {hasMetadata && (
                <div className="flex flex-wrap gap-2" role="list">
                  {card?.cardSet?.name && (
                    <Badge
                      className="max-w-full whitespace-normal"
                      role="listitem"
                      variant="secondary"
                    >
                      {card.cardSet.name}
                    </Badge>
                  )}
                  {card?.collectorNumber && (
                    <Badge role="listitem" variant="outline">
                      #{card.collectorNumber}
                    </Badge>
                  )}
                  {card?.rarity && (
                    <Badge role="listitem" variant="outline">
                      {t(`common:card.rarity.${card.rarity}`, {
                        defaultValue: formatMetadataLabel(card.rarity),
                      })}
                    </Badge>
                  )}
                </div>
              )}
              {releasedAtLabel && card?.releasedAt && (
                <p
                  className={
                    hasMetadata
                      ? "mt-2 text-sm text-muted-foreground"
                      : "text-sm text-muted-foreground"
                  }
                >
                  <time dateTime={card.releasedAt}>
                    {t("common:card.released", { date: releasedAtLabel })}
                  </time>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
