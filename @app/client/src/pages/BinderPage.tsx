import { NetworkStatus } from "@apollo/client";
import {
  type BinderCardsOrderBy,
  OrderByDirection,
  useAddBinderCardMutation,
  useBinderByShortIdQuery,
  useBinderCardDetailWindowQuery,
  useDeleteBinderCardMutation,
} from "@app/graphql";
import { ChevronLeft, ChevronRight, Grid2X2, List } from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import type { BinderCardViewMode } from "@/components/BinderCard";
import { BinderCardGrid } from "@/components/BinderCardGrid";
import { BinderCardList } from "@/components/BinderCardList";
import { BinderNote } from "@/components/BinderNote";
import { BinderTitle } from "@/components/BinderTitle";
import { ButtonImportBinder } from "@/components/ButtonImportBinder";
import { CardSearchPicker } from "@/components/CardSearchPicker";
import { Loading } from "@/components/Loading";
import { ModalBinderCardDetail } from "@/components/ModalBinderCardDetail";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import type { DraftCardSnapshot } from "@/hooks/useDraftBinder";
import { useIsMobile } from "@/hooks/useMobile";
import type {
  BinderCardDetailRecord,
  BinderCardRecord,
} from "@/lib/binderCardPricing";
import { handleError } from "@/lib/error";
import { NotFound } from "@/pages/NotFound";
import { useSession } from "@/providers/SessionContext";

type BinderSortMode =
  | "seller_order"
  | "last_added"
  | "name"
  | "release_date"
  | "price_asc"
  | "price_desc";

const GRID_PAGE_SIZE = 14;
const LIST_PAGE_SIZE = 12;
const PRELOAD_PAGE_COUNT = 2;
const DETAIL_WINDOW_BEFORE_COUNT = 1;
const DETAIL_WINDOW_CARD_COUNT = 3;
const MOBILE_CARD_LIMIT = 500;

const getDefaultFinish = (card: DraftCardSnapshot): string => {
  if (card.finishes.includes("normal")) return "normal";
  return card.finishes[0] || "normal";
};

const shouldIgnoreBinderViewFocus = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    "button, input, textarea, select, [contenteditable='true'], [role='combobox'], [role='textbox']"
  );
};

const shouldIgnorePageNavigationKey = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    "input, textarea, select, [contenteditable='true'], [role='combobox'], [role='textbox'], [data-slot='dialog-content'], [data-slot='dropdown-menu-content'], [data-slot='select-content'], [aria-expanded='true']"
  );
};

const getBinderCardOrderBy = (
  sortMode: BinderSortMode
): BinderCardsOrderBy[] => {
  if (sortMode === "name") {
    return [
      { cardName: OrderByDirection.AscNullsLast },
      { cardReleasedAt: OrderByDirection.DescNullsLast },
      { id: OrderByDirection.AscNullsLast },
    ];
  }

  if (sortMode === "release_date") {
    return [
      { cardReleasedAt: OrderByDirection.DescNullsLast },
      { cardName: OrderByDirection.AscNullsLast },
      { id: OrderByDirection.AscNullsLast },
    ];
  }

  if (sortMode === "last_added") {
    return [
      { createdAt: OrderByDirection.DescNullsLast },
      { id: OrderByDirection.AscNullsLast },
    ];
  }

  if (sortMode === "price_asc") {
    return [
      { priceAmount: OrderByDirection.AscNullsLast },
      { cardName: OrderByDirection.AscNullsLast },
      { id: OrderByDirection.AscNullsLast },
    ];
  }

  if (sortMode === "price_desc") {
    return [
      { priceAmount: OrderByDirection.DescNullsLast },
      { cardName: OrderByDirection.AscNullsLast },
      { id: OrderByDirection.AscNullsLast },
    ];
  }

  return [
    { position: OrderByDirection.AscNullsLast },
    { createdAt: OrderByDirection.DescNullsLast },
    { id: OrderByDirection.AscNullsLast },
  ];
};

export const BinderPage = () => {
  const { t } = useTranslation(["common"]);
  const { session } = useSession();
  const { shortId = "" } = useParams();
  const binderViewRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();
  const [sortMode, setSortMode] = useState<BinderSortMode>("seller_order");
  const [viewMode, setViewMode] = useState<BinderCardViewMode>("grid");
  const [showConvertedMarketPrices, setShowConvertedMarketPrices] =
    useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );
  const [selectedBinderCard, setSelectedBinderCard] = useState<
    BinderCardRecord | BinderCardDetailRecord | null
  >(null);
  const cardsPerPage = viewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;
  const cardOffset = isMobile ? 0 : pageIndex * cardsPerPage;
  const cardFirst = isMobile
    ? MOBILE_CARD_LIMIT
    : (PRELOAD_PAGE_COUNT + 1) * cardsPerPage;
  const cardOrderBy = useMemo(() => getBinderCardOrderBy(sortMode), [sortMode]);
  const detailCardOffset =
    selectedCardIndex === null
      ? 0
      : Math.max(selectedCardIndex - DETAIL_WINDOW_BEFORE_COUNT, 0);
  const { data, loading, networkStatus, refetch } = useBinderByShortIdQuery({
    variables: { shortId, cardFirst, cardOffset, cardOrderBy },
    skip: !shortId,
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  });
  const { data: detailData, loading: isDetailLoading } =
    useBinderCardDetailWindowQuery({
      variables: {
        shortId,
        cardFirst: DETAIL_WINDOW_CARD_COUNT,
        cardOffset: detailCardOffset,
        cardOrderBy,
      },
      skip: !shortId || selectedCardIndex === null,
      notifyOnNetworkStatusChange: true,
      returnPartialData: true,
    });
  const [addBinderCard, { loading: isAddingCard }] = useAddBinderCardMutation();
  const [deleteBinderCard, { loading: isDeletingCard }] =
    useDeleteBinderCardMutation();

  const binder = data?.binderByShortId;
  const binderCards = useMemo(() => {
    return (
      data?.binderCardsByShortId?.edges
        .map(({ node }) => node)
        .filter((binderCard) => !!binderCard.card) || []
    );
  }, [data?.binderCardsByShortId?.edges]);
  const visibleBinderCards = isMobile
    ? binderCards
    : binderCards.slice(0, cardsPerPage);
  const detailBinderCards = useMemo(() => {
    return (
      detailData?.binderCardsByShortId?.edges
        .map(({ node }) => node)
        .filter((binderCard) => !!binderCard.card) || []
    );
  }, [detailData?.binderCardsByShortId?.edges]);
  const totalBinderCards = data?.binderCardCountByShortId ?? binderCards.length;
  const totalPages = Math.max(Math.ceil(totalBinderCards / cardsPerPage), 1);
  const canTurnPreviousPage = !isMobile && pageIndex > 0;
  const canTurnNextPage = !isMobile && pageIndex + 1 < totalPages;
  const canGoPreviousDetailCard =
    selectedCardIndex !== null && selectedCardIndex > 0;
  const canGoNextDetailCard =
    selectedCardIndex !== null && selectedCardIndex + 1 < totalBinderCards;
  const isPageLoading =
    !isMobile && networkStatus === NetworkStatus.setVariables;

  useEffect(() => {
    setPageIndex(0);
    setSelectedCardIndex(null);
    setSelectedBinderCard(null);
  }, [shortId, isMobile]);

  useEffect(() => {
    if (selectedCardIndex === null || isDetailLoading) return;

    const detailWindowIndex = selectedCardIndex - detailCardOffset;
    const nextSelectedBinderCard = detailBinderCards[detailWindowIndex];
    if (nextSelectedBinderCard) {
      setSelectedBinderCard(nextSelectedBinderCard);
    }
  }, [detailBinderCards, detailCardOffset, isDetailLoading, selectedCardIndex]);

  useEffect(() => {
    if (isMobile || selectedCardIndex !== null) return;

    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (shouldIgnorePageNavigationKey(event.target)) return;

      const binderView = binderViewRef.current;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target !== document.body &&
        !binderView?.contains(target)
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && canTurnPreviousPage) {
        event.preventDefault();
        setPageIndex((currentPage) => Math.max(currentPage - 1, 0));
      }

      if (event.key === "ArrowRight" && canTurnNextPage) {
        event.preventDefault();
        setPageIndex((currentPage) =>
          Math.min(currentPage + 1, totalPages - 1)
        );
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);

    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [
    canTurnNextPage,
    canTurnPreviousPage,
    isMobile,
    selectedCardIndex,
    totalPages,
  ]);

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!binder) {
    return <NotFound />;
  }

  const isOwner = !!session?.user.id && session.user.id === binder.ownerId;

  const handleAddCard = async (card: DraftCardSnapshot) => {
    try {
      await addBinderCard({
        variables: {
          binderId: binder.id,
          cardId: card.id,
          finish: getDefaultFinish(card),
          position: 0,
          tcgId: binder.tcgId,
        },
      });
      await refetch();
    } catch (error) {
      handleError(error, t("common:binder.add_card_error"));
    }
  };

  const getLoadedBinderCardByIndex = (
    nextCardIndex: number
  ): BinderCardRecord | BinderCardDetailRecord | null => {
    const detailWindowIndex = nextCardIndex - detailCardOffset;
    if (
      detailWindowIndex >= 0 &&
      detailWindowIndex < detailBinderCards.length
    ) {
      return detailBinderCards[detailWindowIndex];
    }

    const pageWindowIndex = nextCardIndex - cardOffset;
    if (pageWindowIndex >= 0 && pageWindowIndex < binderCards.length) {
      return binderCards[pageWindowIndex];
    }

    return null;
  };

  const clearSelectedBinderCard = () => {
    setSelectedCardIndex(null);
    setSelectedBinderCard(null);
  };

  const handleDeleteCard = async (binderCard: BinderCardRecord) => {
    try {
      await deleteBinderCard({
        variables: { id: binderCard.id },
      });

      if (selectedBinderCard?.id === binderCard.id) {
        clearSelectedBinderCard();
      }

      const nextTotalBinderCards = Math.max(totalBinderCards - 1, 0);
      const nextLastPageIndex = Math.max(
        Math.ceil(nextTotalBinderCards / cardsPerPage) - 1,
        0
      );
      setPageIndex((currentPageIndex) =>
        Math.min(currentPageIndex, nextLastPageIndex)
      );

      await refetch();
    } catch (error) {
      handleError(error, t("common:binder.delete_card_error"));
    }
  };

  const handleOpenCard = (binderCard: BinderCardRecord, index: number) => {
    setSelectedCardIndex(cardOffset + index);
    setSelectedBinderCard(binderCard);
  };

  const handleDetailOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;

    if (selectedCardIndex !== null && !isMobile) {
      setPageIndex(Math.floor(selectedCardIndex / cardsPerPage));
    }

    clearSelectedBinderCard();
  };

  const handleGoToDetailCard = (nextCardIndex: number) => {
    if (nextCardIndex < 0 || nextCardIndex >= totalBinderCards) return;

    setSelectedCardIndex(nextCardIndex);
    setSelectedBinderCard(getLoadedBinderCardByIndex(nextCardIndex));
  };

  const handleSortChange = (value: string) => {
    setSortMode(value as BinderSortMode);
    setPageIndex(0);
    clearSelectedBinderCard();
  };

  const handleViewChange = (value: BinderCardViewMode) => {
    setViewMode(value);
    setPageIndex(0);
    clearSelectedBinderCard();
  };

  const handlePreviousPage = () => {
    setPageIndex((currentPage) => Math.max(currentPage - 1, 0));
  };

  const handleNextPage = () => {
    if (!canTurnNextPage) return;

    setPageIndex((currentPage) => currentPage + 1);
  };

  const focusBinderView = () => {
    binderViewRef.current?.focus({ preventScroll: true });
  };

  const handleBinderViewKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (shouldIgnorePageNavigationKey(event.target)) return;

    if (event.key === "ArrowLeft" && canTurnPreviousPage) {
      event.preventDefault();
      handlePreviousPage();
    }

    if (event.key === "ArrowRight" && canTurnNextPage) {
      event.preventDefault();
      handleNextPage();
    }
  };

  return (
    <div className="relative isolate flex min-h-[calc(100svh-3.5rem)] w-full flex-1 overflow-y-auto bg-background text-foreground md:overflow-hidden">
      <div className="relative z-10 flex min-h-[calc(100svh-3.5rem)] w-full flex-col gap-5 px-4 pb-4 sm:px-6 lg:px-20">
        <div className="relative z-30 -mx-4 flex shrink-0 flex-col gap-4 border-y border-binder-toolbar-input/40 bg-binder-toolbar/95 px-4 py-3 text-binder-toolbar-foreground sm:-mx-6 sm:px-6 lg:-mx-20 lg:flex-row lg:items-start lg:justify-between lg:px-20">
          <div className="min-w-0">
            <BinderTitle
              binderId={binder.id}
              isOwner={isOwner}
              name={binder.name}
              onRenamed={refetch}
            />
            <BinderNote
              binderId={binder.id}
              isOwner={isOwner}
              note={binder.note}
              onUpdated={refetch}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {isOwner && (
                <>
                  <CardSearchPicker
                    containerClassName="w-full sm:w-80"
                    className="border-binder-toolbar-foreground/25 text-muted-foreground bg-background placeholder:text-muted-foreground"
                    placeholder={t("common:binder.search_placeholder")}
                    onSelect={handleAddCard}
                  />
                  <ButtonImportBinder
                    binderId={binder.id}
                    tcgId={binder.tcgId}
                    onImported={refetch}
                  />
                </>
              )}
              <Select value={sortMode} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full border-border bg-background text-foreground sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-background text-foreground">
                  <SelectItem value="seller_order">
                    {t("common:binder.sort.seller_order")}
                  </SelectItem>
                  <SelectItem value="last_added">
                    {t("common:binder.sort.last_added")}
                  </SelectItem>
                  <SelectItem value="name">
                    {t("common:binder.sort.name")}
                  </SelectItem>
                  <SelectItem value="release_date">
                    {t("common:binder.sort.release_date")}
                  </SelectItem>
                  <SelectItem value="price_asc">
                    {t("common:binder.sort.price_asc")}
                  </SelectItem>
                  <SelectItem value="price_desc">
                    {t("common:binder.sort.price_desc")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <ToggleGroup
                type="single"
                value={viewMode}
                size="sm"
                className="w-full border border-border bg-background p-1 text-foreground sm:w-auto"
                onValueChange={(value) => {
                  if (!value) return;
                  handleViewChange(value as BinderCardViewMode);
                }}
              >
                <ToggleGroupItem
                  value="grid"
                  size="sm"
                  className="h-8 flex-1 px-3 text-foreground hover:bg-primary hover:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground sm:flex-none"
                >
                  <Grid2X2 className="size-4" />
                  {t("common:binder.view.grid")}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="list"
                  size="sm"
                  className="h-8 flex-1 px-3 text-foreground hover:bg-primary hover:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground sm:flex-none"
                >
                  <List className="size-4" />
                  {t("common:binder.view.list")}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex justify-end">
              <label className="inline-flex w-fit items-center gap-2 text-sm text-binder-toolbar-foreground/80">
                <Switch
                  checked={showConvertedMarketPrices}
                  onCheckedChange={setShowConvertedMarketPrices}
                  aria-label={t("common:binder.show_converted_market_prices")}
                />
                <span>{t("common:binder.show_converted_market_prices")}</span>
              </label>
            </div>
          </div>
        </div>

        {!isMobile && visibleBinderCards.length > 0 && (
          <p className="-mt-2 shrink-0 text-sm text-muted-foreground">
            {t("common:binder.page_progress", {
              cardCount: t("common:binder.unique_card_count", {
                count: totalBinderCards,
              }),
              page: pageIndex + 1,
              pageCount: totalPages,
            })}
          </p>
        )}

        {isAddingCard && (
          <p className="shrink-0 text-sm text-muted-foreground">
            {t("common:binder.adding_card")}
          </p>
        )}

        {isPageLoading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Loading />
          </div>
        ) : visibleBinderCards.length > 0 ? (
          <div
            ref={binderViewRef}
            tabIndex={0}
            onMouseDown={(event) => {
              if (!shouldIgnoreBinderViewFocus(event.target)) {
                focusBinderView();
              }
            }}
            onKeyDown={handleBinderViewKeyDown}
            className="relative -mx-4 min-h-0 flex-1 px-4 pb-4 outline-none sm:-mx-6 sm:px-6 md:pb-0 lg:-mx-20 lg:px-20"
          >
            {!isMobile && (
              <>
                <button
                  type="button"
                  aria-label={t("common:previous")}
                  disabled={!canTurnPreviousPage}
                  className="group/page-zone absolute inset-y-0 left-0 z-20 hidden w-4 items-center justify-center bg-transparent transition-colors hover:bg-linear-to-r hover:from-primary/25 hover:via-primary/5 hover:to-transparent focus-visible:bg-linear-to-r focus-visible:from-primary/25 focus-visible:via-primary/5 focus-visible:to-transparent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-0 sm:w-6 md:flex lg:w-20"
                  onClick={() => {
                    handlePreviousPage();
                    focusBinderView();
                  }}
                >
                  <span className="flex size-4 items-center justify-center rounded-full border border-binder-toolbar-foreground/20 bg-binder-toolbar/80 text-binder-toolbar-foreground/80 shadow-2xl shadow-foreground/20 backdrop-blur transition group-hover/page-zone:scale-110 group-hover/page-zone:bg-primary group-hover/page-zone:text-primary-foreground group-focus-visible/page-zone:scale-110 group-focus-visible/page-zone:bg-primary group-focus-visible/page-zone:text-primary-foreground sm:size-6 lg:size-12">
                    <ChevronLeft className="size-3 sm:size-4 lg:size-6" />
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t("common:next")}
                  disabled={!canTurnNextPage}
                  className="group/page-zone absolute inset-y-0 right-0 z-20 hidden w-4 items-center justify-center bg-transparent transition-colors hover:bg-linear-to-l hover:from-primary/25 hover:via-primary/5 hover:to-transparent focus-visible:bg-linear-to-l focus-visible:from-primary/25 focus-visible:via-primary/5 focus-visible:to-transparent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-0 sm:w-6 md:flex lg:w-20"
                  onClick={() => {
                    handleNextPage();
                    focusBinderView();
                  }}
                >
                  <span className="flex size-4 items-center justify-center rounded-full border border-binder-toolbar-foreground/20 bg-binder-toolbar/80 text-binder-toolbar-foreground/80 shadow-2xl shadow-foreground/20 backdrop-blur transition group-hover/page-zone:scale-110 group-hover/page-zone:bg-primary group-hover/page-zone:text-primary-foreground group-focus-visible/page-zone:scale-110 group-focus-visible/page-zone:bg-primary group-focus-visible/page-zone:text-primary-foreground sm:size-6 lg:size-12">
                    <ChevronRight className="size-3 sm:size-4 lg:size-6" />
                  </span>
                </button>
              </>
            )}
            {viewMode === "grid" ? (
              <BinderCardGrid
                binderCards={visibleBinderCards}
                className="min-h-full"
                isDeletingCard={isDeletingCard}
                noImageLabel={t("common:binder.no_image")}
                onDeleteCard={isOwner ? handleDeleteCard : undefined}
                onOpenCard={handleOpenCard}
              />
            ) : (
              <BinderCardList
                binderCards={visibleBinderCards}
                className="min-h-full w-full"
                isDeletingCard={isDeletingCard}
                onDeleteCard={isOwner ? handleDeleteCard : undefined}
                onOpenCard={handleOpenCard}
                showConvertedMarketPrices={showConvertedMarketPrices}
              />
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed border-binder-toolbar/40 bg-binder-toolbar/15">
            <p className="text-sm text-muted-foreground">
              {t("common:binder.empty")}
            </p>
          </div>
        )}
      </div>
      <ModalBinderCardDetail
        binderCard={selectedBinderCard}
        canGoNext={canGoNextDetailCard}
        canGoPrevious={canGoPreviousDetailCard}
        currentIndex={selectedCardIndex}
        isEditable={isOwner}
        isLoading={isDetailLoading}
        open={selectedCardIndex !== null}
        showConvertedMarketPrices={showConvertedMarketPrices}
        totalCards={totalBinderCards}
        onBinderCardUpdated={(binderCard) => {
          setSelectedBinderCard(binderCard);
          void refetch();
        }}
        onGoNext={() => {
          if (selectedCardIndex !== null) {
            handleGoToDetailCard(selectedCardIndex + 1);
          }
        }}
        onGoPrevious={() => {
          if (selectedCardIndex !== null) {
            handleGoToDetailCard(selectedCardIndex - 1);
          }
        }}
        onOpenChange={handleDetailOpenChange}
      />
    </div>
  );
};
