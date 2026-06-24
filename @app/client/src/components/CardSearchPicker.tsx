import type { CardSearchQuery } from "@app/graphql";
import { useCardSearchQuery } from "@app/graphql";
import { LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { InputSearch } from "@/components/InputSearch";
import useClickOutside from "@/hooks/useClickOutside";
import { useDebounce } from "@/hooks/useDebounce";
import { type DraftCardSnapshot } from "@/hooks/useDraftBinder";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type CardSearchNode = NonNullable<
  CardSearchQuery["cardsCollection"]
>["edges"][number]["node"];

interface CardSearchPickerProps {
  containerClassName?: string;
  className?: string;
  iconClassName?: string;
  placeholder?: string;
  onSelect: (card: DraftCardSnapshot) => void;
}

const MINIMUM_SEARCH_LENGTH = 2;

const normalizeCard = (card: CardSearchNode): DraftCardSnapshot => {
  return {
    id: card.id,
    externalId: card.externalId,
    name: card.name,
    collectorNumber: card.collectorNumber,
    rarity: card.rarity,
    finishes: card.finishes.filter((finish): finish is string => !!finish),
    imageSmallUrl: card.imageSmallUrl,
    imageNormalUrl: card.imageNormalUrl,
    releasedAt: card.releasedAt,
    setCode: card.cardSet?.code,
    setName: card.cardSet?.name,
    marketPrices:
      card.marketPrices?.edges.map(({ node }) => ({
        source: node.source,
        finish: node.finish,
        amount: Number(node.amount),
        currency: node.currency,
        priceDate: node.priceDate,
      })) || [],
  };
};

export const CardSearchPicker = ({
  containerClassName,
  className,
  iconClassName,
  placeholder,
  onSelect,
}: CardSearchPickerProps) => {
  const { i18n, t } = useTranslation(["common"]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query.trim(), 300);
  const canSearch = debouncedQuery.length >= MINIMUM_SEARCH_LENGTH;
  const { data, loading } = useCardSearchQuery({
    variables: {
      query: `%${debouncedQuery}%`,
      first: 10,
    },
    skip: !canSearch,
  });

  const cards =
    data?.cardsCollection?.edges.map(({ node }) => normalizeCard(node)) || [];

  const handleSelect = (card: DraftCardSnapshot) => () => {
    onSelect(card);
    setQuery("");
    setIsOpen(false);
  };

  useClickOutside(containerRef, () => setIsOpen(false), { skip: !isOpen });

  return (
    <div ref={containerRef} className={cn("relative", containerClassName)}>
      <InputSearch
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder || t("common:card_search.placeholder")}
        iconClassName={iconClassName}
        containerClassName="w-full"
        className={className}
      />
      {isOpen && query.trim().length > 0 && (
        <div className="absolute z-[100] mt-2 w-full rounded-md border border-border bg-background text-foreground shadow-lg">
          {loading ? (
            <div className="flex h-20 items-center justify-center">
              <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : cards.length > 0 ? (
            <div className="max-h-[420px] overflow-y-auto p-1">
              {cards.map((card) => {
                const normalPrice =
                  card.marketPrices.find(
                    (price) => price.finish === "normal"
                  ) || card.marketPrices[0];

                return (
                  <button
                    key={card.id}
                    type="button"
                    className="group flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:outline-none"
                    onClick={handleSelect(card)}
                  >
                    <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-muted">
                      {card.imageSmallUrl ? (
                        <img
                          src={card.imageSmallUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-current/70">
                          {t("common:card_search.no_image")}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {card.name}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-current/70">
                        <span>{card.setCode || "MTG"}</span>
                        {card.collectorNumber && (
                          <span>#{card.collectorNumber}</span>
                        )}
                        {card.releasedAt && <span>{card.releasedAt}</span>}
                      </div>
                    </div>
                    {normalPrice && (
                      <div className="shrink-0 text-right text-xs">
                        <div className="font-medium">
                          {formatCurrency(
                            normalPrice.amount,
                            normalPrice.currency,
                            i18n.language
                          )}
                        </div>
                        <div className="text-current/70">
                          {normalPrice.source}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : canSearch ? (
            <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
              {t("common:card_search.no_cards_found")}
            </div>
          ) : (
            <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
              {t("common:card_search.minimum_query", {
                count: MINIMUM_SEARCH_LENGTH,
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
