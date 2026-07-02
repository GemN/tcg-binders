import type { CardSearchQuery } from "@app/graphql";
import { useCardSearchQuery } from "@app/graphql";
import { LoaderCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { CardImage } from "@/components/CardImage";
import { InputSearch } from "@/components/InputSearch";
import { MarketPriceSummary } from "@/components/MarketPriceSummary";
import useClickOutside from "@/hooks/useClickOutside";
import { useDebounce } from "@/hooks/useDebounce";
import {
  createDraftCardSnapshot,
  type DraftCardSnapshot,
} from "@/hooks/useDraftBinder";
import { getMarketPriceBySourceAndFinish } from "@/lib/binderCardPricing";
import { getCardScryfallId } from "@/lib/cardImageUrl";
import { cn } from "@/lib/utils";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

interface CardSearchPickerProps {
  containerClassName?: string;
  className?: string;
  iconClassName?: string;
  placeholder?: string;
  onSelect: (card: DraftCardSnapshot) => void;
}

interface ParsedCardSearchQuery {
  cardName: string;
  hasSetCode: boolean;
  searchText: string;
  setCode: string;
}

const MINIMUM_SEARCH_LENGTH = 2;
const SET_CODE_TOKEN_PATTERN = /^[A-Za-z0-9]{2,6}$/;

const parseCardSearchQuery = (value: string): ParsedCardSearchQuery => {
  const searchText = value.trim().replace(/\s+/g, " ");
  const tokens = searchText.split(" ");

  if (tokens.length < 2) {
    return {
      cardName: searchText,
      hasSetCode: false,
      searchText,
      setCode: "",
    };
  }

  const setCodeCandidate = tokens[tokens.length - 1].replace(
    /^[([{]+|[\])}]+$/g,
    ""
  );
  const cardName = tokens.slice(0, -1).join(" ");

  if (
    cardName.length < MINIMUM_SEARCH_LENGTH ||
    !SET_CODE_TOKEN_PATTERN.test(setCodeCandidate)
  ) {
    return {
      cardName: searchText,
      hasSetCode: false,
      searchText,
      setCode: "",
    };
  }

  return {
    cardName,
    hasSetCode: true,
    searchText,
    setCode: setCodeCandidate.toUpperCase(),
  };
};

const getSetScopedCards = (data: CardSearchQuery | undefined) => {
  return (
    data?.cardSetsCollection?.edges.flatMap(
      ({ node }) => node.cards?.edges.map(({ node: card }) => card) || []
    ) || []
  );
};

export const CardSearchPicker = ({
  containerClassName,
  className,
  iconClassName,
  placeholder,
  onSelect,
}: CardSearchPickerProps) => {
  const { t } = useTranslation(["common"]);
  const { priceSource } = usePricingSettings();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query.trim(), 300);
  const parsedQuery = useMemo(
    () => parseCardSearchQuery(debouncedQuery),
    [debouncedQuery]
  );
  const canSearch = parsedQuery.searchText.length >= MINIMUM_SEARCH_LENGTH;
  const { data, loading } = useCardSearchQuery({
    variables: {
      hasSetCode: parsedQuery.hasSetCode,
      nameQuery: `%${parsedQuery.cardName}%`,
      query: `%${parsedQuery.searchText}%`,
      setCode: parsedQuery.setCode,
      first: 10,
    },
    skip: !canSearch,
  });

  const setScopedCards = getSetScopedCards(data);
  const hasMatchingSet = !!data?.cardSetsCollection?.edges.length;
  const cardNodes =
    parsedQuery.hasSetCode && hasMatchingSet
      ? setScopedCards
      : data?.cardsCollection?.edges.map(({ node }) => node) || [];
  const cards = cardNodes.map((card) => createDraftCardSnapshot(card));

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
                const marketPrice = getMarketPriceBySourceAndFinish(
                  card.marketPrices,
                  priceSource,
                  ["normal"]
                );
                const cardFinish =
                  card.finishes.length === 1 ? card.finishes[0] : null;

                return (
                  <button
                    key={card.id}
                    type="button"
                    className="group flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:outline-none"
                    onClick={handleSelect(card)}
                  >
                    <CardImage
                      alt=""
                      className="h-16 w-12 shrink-0 rounded-sm border bg-muted"
                      fallbackClassName="text-xs text-current/70"
                      finish={cardFinish}
                      imageSize="thumbnail"
                      imageUrl={card.imageUrl}
                      noImageLabel={t("common:card_search.no_image")}
                      scryfallId={getCardScryfallId(card)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {card.name}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-current/70">
                        <span>{card.setCode || "MTG"}</span>
                        {card.collectorNumber && (
                          <span>#{card.collectorNumber}</span>
                        )}
                      </div>
                    </div>
                    <MarketPriceSummary
                      amount={marketPrice?.amount}
                      currency={marketPrice?.currency}
                      source={marketPrice?.source}
                    />
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
