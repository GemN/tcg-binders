import {
  useAddBinderCardMutation,
  useBinderByShortIdQuery,
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
import { CardSearchPicker } from "@/components/CardSearchPicker";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import type { DraftCardSnapshot } from "@/hooks/useDraftBinder";
import { useIsMobile } from "@/hooks/useMobile";
import { handleError } from "@/lib/error";
import { NotFound } from "@/pages/NotFound";
import { useSession } from "@/providers/SessionContext";

type BinderSortMode = "seller_order" | "name" | "release_date";

const GRID_PAGE_SIZE = 14;
const LIST_PAGE_SIZE = 12;
const PRELOAD_PAGE_COUNT = 2;
const MOBILE_CARD_LIMIT = 500;

const getDefaultFinish = (card: DraftCardSnapshot): string => {
  if (card.finishes.includes("normal")) return "normal";
  return card.finishes[0] || "normal";
};

const shouldIgnorePageKey = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    "button, input, textarea, select, [contenteditable='true'], [role='combobox'], [role='textbox']"
  );
};

export const BinderPage = () => {
  const { t } = useTranslation(["common"]);
  const { session } = useSession();
  const { shortId = "" } = useParams();
  const binderViewRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();
  const [sortMode, setSortMode] = useState<BinderSortMode>("seller_order");
  const [viewMode, setViewMode] = useState<BinderCardViewMode>("grid");
  const [pageIndex, setPageIndex] = useState(0);
  const cardsPerPage =
    viewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;
  const cardFirst = isMobile
    ? MOBILE_CARD_LIMIT
    : (pageIndex + PRELOAD_PAGE_COUNT + 1) * cardsPerPage;
  const { data, loading, refetch } = useBinderByShortIdQuery({
    variables: { shortId, cardSort: sortMode, cardFirst },
    skip: !shortId,
    notifyOnNetworkStatusChange: true,
  });
  const [addBinderCard, { loading: isAddingCard }] =
    useAddBinderCardMutation();

  const binder = data?.binderByShortId;
  const binderCards = useMemo(() => {
    return (
      data?.binderCardsByShortId?.edges
        .map(({ node }) => node)
        .filter((binderCard) => !!binderCard.card) || []
    );
  }, [data?.binderCardsByShortId?.edges]);
  const backgroundImageUrl = useMemo(() => {
    const binderCard = binderCards.find(
      ({ card }) => card?.imageNormalUrl || card?.imageSmallUrl
    );

    return (
      binderCard?.card?.imageNormalUrl ||
      binderCard?.card?.imageSmallUrl ||
      null
    );
  }, [binderCards]);
  const pageStart = pageIndex * cardsPerPage;
  const visibleBinderCards = isMobile
    ? binderCards
    : binderCards.slice(pageStart, pageStart + cardsPerPage);
  const hasNextPage =
    !isMobile &&
    (binderCards.length > pageStart + cardsPerPage ||
      !!data?.binderCardsByShortId?.pageInfo.hasNextPage);
  const canTurnPreviousPage =
    !isMobile && visibleBinderCards.length > 0 && pageIndex > 0;
  const canTurnNextPage =
    !isMobile && visibleBinderCards.length > 0 && hasNextPage;
  const isPageLoading =
    loading &&
    !isMobile &&
    visibleBinderCards.length === 0 &&
    binderCards.length > 0;

  useEffect(() => {
    setPageIndex(0);
  }, [shortId, isMobile]);

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

  const handleSortChange = (value: string) => {
    setSortMode(value as BinderSortMode);
    setPageIndex(0);
  };

  const handleViewChange = (value: BinderCardViewMode) => {
    setViewMode(value);
    setPageIndex(0);
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

  const handleBinderViewKeyDown = (
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    if (shouldIgnorePageKey(event.target)) return;

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
    <div className="relative isolate flex min-h-[calc(100svh-3.5rem)] w-full flex-1 overflow-y-auto bg-zinc-950 text-white md:overflow-hidden">
      {backgroundImageUrl && (
        <img
          src={backgroundImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
        />
      )}
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-black/75 to-transparent" />

      <div className="relative z-10 flex min-h-[calc(100svh-3.5rem)] w-full flex-col gap-5 px-4 py-4 sm:px-6 lg:px-20">
        <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-normal text-white sm:text-3xl">
              {binder.name}
            </h1>
            {!isMobile && visibleBinderCards.length > 0 && (
              <p className="mt-1 text-sm text-white/60">
                {t("common:binder.page", { page: pageIndex + 1 })}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {isOwner && (
              <CardSearchPicker
                className="w-full sm:w-80"
                inputClassName="border-white/15 bg-black/55 text-white placeholder:text-white/50 backdrop-blur"
                placeholder={t("common:binder.search_placeholder")}
                onSelect={handleAddCard}
              />
            )}
            <Select value={sortMode} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full border-white/15 bg-black/55 text-white backdrop-blur sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seller_order">
                  {t("common:binder.sort.seller_order")}
                </SelectItem>
                <SelectItem value="name">
                  {t("common:binder.sort.name")}
                </SelectItem>
                <SelectItem value="release_date">
                  {t("common:binder.sort.release_date")}
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="inline-flex w-full rounded-md border border-white/15 bg-black/45 p-1 backdrop-blur sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={viewMode === "grid"}
                className={
                  viewMode === "grid"
                    ? "h-8 flex-1 bg-white/20 text-white hover:bg-white/25 hover:text-white sm:flex-none"
                    : "h-8 flex-1 text-white/70 hover:bg-white/15 hover:text-white sm:flex-none"
                }
                onClick={() => handleViewChange("grid")}
              >
                <Grid2X2 className="size-4" />
                {t("common:binder.view.grid")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={viewMode === "list"}
                className={
                  viewMode === "list"
                    ? "h-8 flex-1 bg-white/20 text-white hover:bg-white/25 hover:text-white sm:flex-none"
                    : "h-8 flex-1 text-white/70 hover:bg-white/15 hover:text-white sm:flex-none"
                }
                onClick={() => handleViewChange("list")}
              >
                <List className="size-4" />
                {t("common:binder.view.list")}
              </Button>
            </div>
          </div>
        </div>

        {isAddingCard && (
          <p className="shrink-0 text-sm text-white/65">
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
              if (!shouldIgnorePageKey(event.target)) {
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
                  className="group/page-zone absolute inset-y-0 left-0 z-20 hidden w-1/5 items-center justify-start bg-transparent px-4 transition-colors hover:bg-linear-to-r hover:from-white/18 hover:via-white/5 hover:to-transparent focus-visible:bg-linear-to-r focus-visible:from-white/18 focus-visible:via-white/5 focus-visible:to-transparent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-0 md:flex lg:px-6"
                  onClick={() => {
                    handlePreviousPage();
                    focusBinderView();
                  }}
                >
                  <span className="flex size-12 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/75 shadow-2xl shadow-black/40 backdrop-blur transition group-hover/page-zone:scale-110 group-hover/page-zone:bg-white/15 group-hover/page-zone:text-white group-focus-visible/page-zone:scale-110 group-focus-visible/page-zone:bg-white/15 group-focus-visible/page-zone:text-white">
                    <ChevronLeft className="size-6" />
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t("common:next")}
                  disabled={!canTurnNextPage}
                  className="group/page-zone absolute inset-y-0 right-0 z-20 hidden w-1/5 items-center justify-end bg-transparent px-4 transition-colors hover:bg-linear-to-l hover:from-white/18 hover:via-white/5 hover:to-transparent focus-visible:bg-linear-to-l focus-visible:from-white/18 focus-visible:via-white/5 focus-visible:to-transparent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-0 md:flex lg:px-6"
                  onClick={() => {
                    handleNextPage();
                    focusBinderView();
                  }}
                >
                  <span className="flex size-12 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/75 shadow-2xl shadow-black/40 backdrop-blur transition group-hover/page-zone:scale-110 group-hover/page-zone:bg-white/15 group-hover/page-zone:text-white group-focus-visible/page-zone:scale-110 group-focus-visible/page-zone:bg-white/15 group-focus-visible/page-zone:text-white">
                    <ChevronRight className="size-6" />
                  </span>
                </button>
              </>
            )}
            {viewMode === "grid" ? (
              <BinderCardGrid
                binderCards={visibleBinderCards}
                className="min-h-full"
                noImageLabel={t("common:binder.no_image")}
              />
            ) : (
              <BinderCardList
                binderCards={visibleBinderCards}
                className="mx-auto min-h-full w-full max-w-4xl"
                noImageLabel={t("common:binder.no_image")}
              />
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed border-white/20 bg-black/30">
            <p className="text-sm text-white/60">
              {t("common:binder.empty")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
