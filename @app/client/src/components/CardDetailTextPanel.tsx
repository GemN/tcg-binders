import type { Cards, CardSets, MtgCardDetails } from "@app/graphql";
import { format, parseISO } from "date-fns";
import { Sparkle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getRarityColor } from "@/components/getRarityColor";
import { OracleText } from "@/components/OracleText";
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

const metadataBadgeClassName =
  "max-w-full whitespace-normal font-display uppercase font-normal rounded-none border-transparent bg-[#E1DDFA] px-3 py-2 text-xs text-foreground";

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
    <div className="flex flex-col">
      <div>
        <div className="border-b border-dashed border-[#D8D3CC] pb-1">
          <Title className="text-2xl font-display font-medium leading-tight text-primary sm:text-[32px]">
            {title}
          </Title>
        </div>
        {detail?.typeLine && (
          <p className="mt-2 text-sm font-medium text-primary sm:text-base">
            {detail.typeLine}
          </p>
        )}
      </div>

      {(detail?.oracleText || hasMetadata || releasedAtLabel) && (
        <div className="mt-2">
          {detail?.oracleText && <OracleText text={detail.oracleText} />}
          {(hasMetadata || releasedAtLabel) && (
            <div className={detail?.oracleText ? "mt-4" : undefined}>
              {hasMetadata && (
                <div className="flex flex-wrap gap-1" role="list">
                  {card?.cardSet?.name && (
                    <Badge
                      className={metadataBadgeClassName}
                      role="listitem"
                      variant="secondary"
                    >
                      {card.cardSet.name}
                    </Badge>
                  )}
                  {card?.collectorNumber && (
                    <Badge
                      className={metadataBadgeClassName}
                      role="listitem"
                      variant="secondary"
                    >
                      #{card.collectorNumber}
                    </Badge>
                  )}
                  {card?.rarity && (
                    <Badge
                      className={metadataBadgeClassName}
                      role="listitem"
                      variant="secondary"
                    >
                      <Sparkle
                        aria-hidden="true"
                        className="size-[12px] shrink-0"
                        color={getRarityColor(card.rarity)}
                      />
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
                    "mt-4 w-full bg-[#ECE9E4] px-2 py-1 text-xs text-center text-muted-foreground sm:w-fit"
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
    </div>
  );
};
