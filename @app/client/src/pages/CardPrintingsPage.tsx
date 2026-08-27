import {
  MarketPriceSource,
  useCardByIdQuery,
  useCardListingCountByNameQuery,
} from "@app/graphql";
import { ArrowRight, ChevronRight, Grid2X2, List } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router";

import { CardImage } from "@/components/CardImage";
import { Loading } from "@/components/Loading";
import { MarketPriceSourceIcon } from "@/components/MarketPriceSourceIcon";
import { Seo } from "@/components/Seo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { getPreferredCardFinish } from "@/config/card";
import { NAVBAR_CONTENT_OFFSET_CLASS_NAME } from "@/config/layout";
import { marketPriceSourceClassNames } from "@/config/marketPriceSource";
import {
  type CardVariant,
  useAllCardVariants,
} from "@/hooks/useAllCardVariants";
import { publicGraphqlRequestContext } from "@/lib/apollo";
import {
  formatBinderCardPrice,
  getLowestConvertedBinderCardPrice,
  getMarketPriceBySourceAndFinish,
} from "@/lib/binderCardPricing";
import { getCardScryfallId } from "@/lib/cardImageUrl";
import { formatCurrency } from "@/lib/currency";
import type { SeoProductInput } from "@/lib/jsonLd";
import type { SeoMetadata } from "@/lib/seoMetadata";
import { cn } from "@/lib/utils";
import { NotFound } from "@/pages/NotFound";
import {
  type ConvertAmountToLocalCurrency,
  usePricingSettings,
} from "@/providers/PricingSettingsContext";

import { createCardPrintingsPageJsonLd } from "./CardPrintingsPage.jsonLd";
import {
  type AvailableCardPrinting,
  type CardPrintingSortMode,
  getDisplayedCardPrintings,
} from "./CardPrintingsPage.utils";

type CardPrintingViewMode = "grid" | "list";

const isCardPrintingViewMode = (
  value: string | null
): value is CardPrintingViewMode => value === "grid" || value === "list";

type CardPrintingMarketPrice = NonNullable<
  CardVariant["marketPrices"]
>["edges"][number]["node"];
type FormatMarketPrice = (
  marketPrice: CardPrintingMarketPrice | null
) => string;

interface CardPrintingDisplayItem extends AvailableCardPrinting {
  lowestPriceLabel: string;
  variant: CardVariant;
}

interface GetLowestPrintingPriceParams {
  convertAmountToLocalCurrency: ConvertAmountToLocalCurrency;
  variant: CardVariant;
}

const getLowestPrintingPrice = ({
  convertAmountToLocalCurrency,
  variant,
}: GetLowestPrintingPriceParams) =>
  getLowestConvertedBinderCardPrice(
    [
      variant.lowestUsdBinderCards?.edges[0]?.node,
      variant.lowestThbBinderCards?.edges[0]?.node,
      variant.lowestEurBinderCards?.edges[0]?.node,
      variant.lowestGbpBinderCards?.edges[0]?.node,
      variant.lowestJpyBinderCards?.edges[0]?.node,
    ],
    convertAmountToLocalCurrency
  );

interface CardPrintingTileProps {
  item: CardPrintingDisplayItem;
  noImageLabel: string;
}

const CardPrintingTile = ({ item, noImageLabel }: CardPrintingTileProps) => {
  const { t } = useTranslation("card");
  const { variant } = item;
  const setCode = variant.cardSet?.code || "-";
  const collectorNumber = variant.collectorNumber || "-";
  const setName = variant.cardSet?.name || "-";

  return (
    <Link
      to={`/card/${variant.id}`}
      className="group/card-image min-w-0 focus-visible:outline-none"
    >
      <CardImage
        alt={variant.name}
        className="w-full border border-border bg-muted shadow-sm outline outline-4 outline-offset-0 outline-transparent transition-[outline-color] group-hover/card-image:outline-primary/70 group-focus-within/card-image:outline-primary"
        finish={getPreferredCardFinish(variant.finishes)}
        imageSize="grid"
        imageUrl={variant.imageUrl}
        noImageLabel={noImageLabel}
        scryfallId={getCardScryfallId(variant)}
      />
      <div className="mt-2 min-w-0">
        <p className="line-clamp-2 text-sm font-medium">
          [{setCode} #{collectorNumber}] {setName}
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <p className="text-xs text-secondary">
            {t("listing_count", { count: item.listingCount })}
          </p>
          <p className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">
              {t("printings.from")}
            </span>
            <span className="font-display text-sm font-medium tabular-nums text-primary">
              {item.lowestPriceLabel}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
};

interface MarketPriceHeaderProps {
  label: string;
  source: MarketPriceSource;
}

const MarketPriceHeader = ({ label, source }: MarketPriceHeaderProps) => (
  <span
    className={cn(
      "flex items-center justify-end gap-1.5",
      marketPriceSourceClassNames[source]
    )}
  >
    <MarketPriceSourceIcon source={source} className="size-3.5" />
    <span>{label}</span>
  </span>
);

interface MobileMarketPriceProps {
  formatMarketPrice: FormatMarketPrice;
  label: string;
  marketPrice: CardPrintingMarketPrice | null;
  source: MarketPriceSource;
}

const MobileMarketPrice = ({
  formatMarketPrice,
  label,
  marketPrice,
  source,
}: MobileMarketPriceProps) => {
  const className = cn(
    "flex items-center whitespace-nowrap text-sm font-medium tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    marketPriceSourceClassNames[source]
  );
  const content = (
    <>
      <span className="sr-only">{label}:</span>
      <MarketPriceSourceIcon source={source} className="mr-1.5 size-4 shrink-0" />
      {formatMarketPrice(marketPrice)}
    </>
  );

  if (marketPrice?.buyUrl) {
    return (
      <a
        href={marketPrice.buyUrl}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return <p className={className}>{content}</p>;
};

interface MobileCardPrintingListItemProps {
  formatMarketPrice: FormatMarketPrice;
  item: CardPrintingDisplayItem;
  noImageLabel: string;
}

const MobileCardPrintingListItem = ({
  formatMarketPrice,
  item,
  noImageLabel,
}: MobileCardPrintingListItemProps) => {
  const { t } = useTranslation("card");
  const { variant } = item;
  const printingAccessibleName = `${variant.name}, ${variant.cardSet?.code || "-"} ${variant.collectorNumber || "-"}, ${variant.cardSet?.name || "-"}`;
  const preferredFinishes = [
    getPreferredCardFinish(variant.finishes),
    "normal",
  ];
  const marketPrices = variant.marketPrices?.edges.map(({ node }) => node);
  const cardKingdomMarketPrice = getMarketPriceBySourceAndFinish(
    marketPrices,
    MarketPriceSource.Cardkingdom,
    preferredFinishes
  );
  const tcgPlayerMarketPrice = getMarketPriceBySourceAndFinish(
    marketPrices,
    MarketPriceSource.Tcgplayer,
    preferredFinishes
  );
  const cardMarketMarketPrice = getMarketPriceBySourceAndFinish(
    marketPrices,
    MarketPriceSource.Cardmarket,
    preferredFinishes
  );

  return (
    <article className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto_auto] gap-x-3 gap-y-1 border border-dashed border-[#D8D3CC] bg-white p-4">
      <Link
        to={`/card/${variant.id}`}
        aria-label={t("printings.open_printing", {
          name: printingAccessibleName,
        })}
        className="col-start-1 row-span-3 row-start-1 inline-flex self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardImage
          alt={variant.name}
          className="h-20 w-auto bg-muted"
          finish={getPreferredCardFinish(variant.finishes)}
          imageSize="thumbnail"
          imageUrl={variant.imageUrl}
          noImageLabel={noImageLabel}
          showBadgeFinish={false}
          scryfallId={getCardScryfallId(variant)}
        />
      </Link>
      <p className="col-start-2 row-start-1 min-w-0 self-start truncate text-xs text-muted-foreground">
        {variant.cardSet?.code || "-"} #{variant.collectorNumber || "-"}
      </p>
      <Link
        to={`/card/${variant.id}`}
        className="col-start-2 row-start-2 min-w-0 self-start text-base font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {variant.cardSet?.name || "-"}
      </Link>
      <div className="col-start-3 row-span-2 row-start-1 flex self-start flex-col items-end gap-1 whitespace-nowrap text-right tabular-nums">
        <p className="flex items-baseline gap-1">
          <span className="text-xs text-muted-foreground">
            {t("printings.table.from")}
          </span>
          <span className="font-display text-base font-medium text-primary">
            {item.lowestPriceLabel}
          </span>
        </p>
        <p className="text-xs font-normal text-secondary">
          {t("listing_count", { count: item.listingCount })}
        </p>
      </div>
      <div className="col-span-2 col-start-2 row-start-3 flex min-w-0 flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <MobileMarketPrice
          formatMarketPrice={formatMarketPrice}
          label={t("printings.table.cardkingdom")}
          marketPrice={cardKingdomMarketPrice}
          source={MarketPriceSource.Cardkingdom}
        />
        <MobileMarketPrice
          formatMarketPrice={formatMarketPrice}
          label={t("printings.table.tcgplayer")}
          marketPrice={tcgPlayerMarketPrice}
          source={MarketPriceSource.Tcgplayer}
        />
        <MobileMarketPrice
          formatMarketPrice={formatMarketPrice}
          label={t("printings.table.cardmarket")}
          marketPrice={cardMarketMarketPrice}
          source={MarketPriceSource.Cardmarket}
        />
      </div>
    </article>
  );
};

interface DesktopCardPrintingListRowProps {
  formatMarketPrice: FormatMarketPrice;
  item: CardPrintingDisplayItem;
  noImageLabel: string;
}

const DesktopCardPrintingListRow = ({
  formatMarketPrice,
  item,
  noImageLabel,
}: DesktopCardPrintingListRowProps) => {
  const { t } = useTranslation("card");
  const { variant } = item;
  const printingAccessibleName = `${variant.name}, ${variant.cardSet?.code || "-"} ${variant.collectorNumber || "-"}, ${variant.cardSet?.name || "-"}`;
  const preferredFinishes = [
    getPreferredCardFinish(variant.finishes),
    "normal",
  ];
  const marketPrices = variant.marketPrices?.edges.map(({ node }) => node);
  const formatSourcePrice = (source: MarketPriceSource) =>
    formatMarketPrice(
      getMarketPriceBySourceAndFinish(marketPrices, source, preferredFinishes)
    );

  return (
    <TableRow className="border-x-0 border-t-0 border-b border-dashed border-[#D8D3CC] odd:bg-white even:bg-[#F4F1EC] hover:bg-accent/30">
      <TableCell className="w-16 px-3 py-2">
        <Link
          to={`/card/${variant.id}`}
          aria-label={t("printings.open_printing", {
            name: printingAccessibleName,
          })}
          className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CardImage
            alt={variant.name}
            className="h-16 w-auto bg-muted"
            finish={getPreferredCardFinish(variant.finishes)}
            imageSize="thumbnail"
            imageUrl={variant.imageUrl}
            noImageLabel={noImageLabel}
            showBadgeFinish={false}
            scryfallId={getCardScryfallId(variant)}
          />
        </Link>
      </TableCell>
      <TableCell className="px-3 py-2 text-sm font-medium">
        {variant.cardSet?.code || "-"}
      </TableCell>
      <TableCell className="px-3 py-2 tabular-nums">
        {variant.collectorNumber || "-"}
      </TableCell>
      <TableCell className="max-w-80 whitespace-normal px-3 py-2 text-sm">
        {variant.cardSet?.name || "-"}
      </TableCell>
      <TableCell className="px-3 py-2 text-right text-sm font-medium tabular-nums">
        {item.lowestPriceLabel}
      </TableCell>
      <TableCell className="px-3 py-2 text-right text-sm tabular-nums">
        {item.listingCount}
      </TableCell>
      <TableCell
        className={cn(
          "px-3 py-2 text-right text-sm font-medium tabular-nums",
          marketPriceSourceClassNames[MarketPriceSource.Cardkingdom]
        )}
      >
        {formatSourcePrice(MarketPriceSource.Cardkingdom)}
      </TableCell>
      <TableCell
        className={cn(
          "px-3 py-2 text-right text-sm font-medium tabular-nums",
          marketPriceSourceClassNames[MarketPriceSource.Tcgplayer]
        )}
      >
        {formatSourcePrice(MarketPriceSource.Tcgplayer)}
      </TableCell>
      <TableCell
        className={cn(
          "px-3 py-2 text-right text-sm font-medium tabular-nums",
          marketPriceSourceClassNames[MarketPriceSource.Cardmarket]
        )}
      >
        {formatSourcePrice(MarketPriceSource.Cardmarket)}
      </TableCell>
    </TableRow>
  );
};

interface CardPrintingsListProps {
  formatMarketPrice: FormatMarketPrice;
  items: CardPrintingDisplayItem[];
  noImageLabel: string;
}

const CardPrintingsList = ({
  formatMarketPrice,
  items,
  noImageLabel,
}: CardPrintingsListProps) => {
  const { t } = useTranslation("card");

  return (
    <>
      <div className="grid gap-4 md:hidden">
        {items.map((item) => (
          <MobileCardPrintingListItem
            key={item.id}
            formatMarketPrice={formatMarketPrice}
            item={item}
            noImageLabel={noImageLabel}
          />
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-md border border-[#D8D3CC] bg-white text-card-foreground md:block">
        <Table
          className="min-w-[1060px] text-sm"
          containerClassName="overflow-x-auto"
        >
          <TableHeader className="bg-[#ECE9E4]">
            <TableRow className="border-[#D8D3CC] hover:bg-transparent">
              <TableHead className="h-10 w-20 px-3 text-xs font-medium text-primary">
                {t("printings.table.card")}
              </TableHead>
              <TableHead className="h-10 w-24 px-3 text-xs font-medium text-primary">
                {t("printings.table.set")}
              </TableHead>
              <TableHead className="h-10 w-20 px-3 text-xs font-medium text-primary">
                {t("printings.table.number")}
              </TableHead>
              <TableHead className="h-10 min-w-52 px-3 text-xs font-medium text-primary">
                {t("printings.table.set_name")}
              </TableHead>
              <TableHead className="h-10 px-3 text-right text-xs font-medium text-primary">
                {t("printings.table.from")}
              </TableHead>
              <TableHead className="h-10 px-3 text-right text-xs font-medium text-primary">
                {t("printings.table.quantity")}
              </TableHead>
              <TableHead className="h-10 px-3 text-right text-xs font-medium text-primary">
                <MarketPriceHeader
                  label={t("printings.table.cardkingdom")}
                  source={MarketPriceSource.Cardkingdom}
                />
              </TableHead>
              <TableHead className="h-10 px-3 text-right text-xs font-medium text-primary">
                <MarketPriceHeader
                  label={t("printings.table.tcgplayer")}
                  source={MarketPriceSource.Tcgplayer}
                />
              </TableHead>
              <TableHead className="h-10 px-3 text-right text-xs font-medium text-primary">
                <MarketPriceHeader
                  label={t("printings.table.cardmarket")}
                  source={MarketPriceSource.Cardmarket}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <DesktopCardPrintingListRow
                key={item.id}
                formatMarketPrice={formatMarketPrice}
                item={item}
                noImageLabel={noImageLabel}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export const CardPrintingsPage = () => {
  const { i18n, t } = useTranslation(["card", "common"]);
  const { convertAmountToLocalCurrency, currency } = usePricingSettings();
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [sortMode, setSortMode] =
    useState<CardPrintingSortMode>("release_date");
  const { cardId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const viewMode: CardPrintingViewMode = isCardPrintingViewMode(viewParam)
    ? viewParam
    : "grid";
  const { data, error, loading } = useCardByIdQuery({
    variables: { cardId },
    skip: !cardId,
  });
  const card = data?.cardsCollection?.edges[0]?.node;
  const variants = useAllCardVariants({ cardName: card?.name || "" });
  const { data: listingCountData, loading: isListingCountLoading } =
    useCardListingCountByNameQuery({
      context: publicGraphqlRequestContext,
      variables: { cardName: card?.name || "" },
      skip: !card?.name,
    });
  const listingCount = listingCountData?.binderCardsCollection?.totalCount;
  const printingItems = useMemo<CardPrintingDisplayItem[]>(
    () =>
      variants.variants.map((variant) => {
        const lowestPrice = getLowestPrintingPrice({
          convertAmountToLocalCurrency,
          variant,
        });

        return {
          id: variant.id,
          listingCount: variant.publicBinderCards?.totalCount || 0,
          lowestPrice,
          lowestPriceLabel:
            lowestPrice === null
              ? "-"
              : formatCurrency(lowestPrice, currency, i18n.language),
          releasedAt: variant.releasedAt,
          variant,
        };
      }),
    [convertAmountToLocalCurrency, currency, i18n.language, variants.variants]
  );
  const displayedPrintings = useMemo(
    () => getDisplayedCardPrintings(printingItems, sortMode, showOnlyAvailable),
    [printingItems, showOnlyAvailable, sortMode]
  );
  const formatMarketPrice = useCallback<FormatMarketPrice>(
    (marketPrice) =>
      formatBinderCardPrice({
        amount: marketPrice?.amount,
        convertAmountToLocalCurrency,
        displayCurrency: currency,
        locale: i18n.language,
        shouldConvert: true,
        sourceCurrency: marketPrice?.currency,
      }) || "-",
    [convertAmountToLocalCurrency, currency, i18n.language]
  );
  useEffect(() => {
    if (viewParam === viewMode) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("view", viewMode);
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams, viewMode, viewParam]);
  const handleSortChange = (value: string) =>
    setSortMode(value as CardPrintingSortMode);
  const handleViewChange = (value: string) => {
    if (!isCardPrintingViewMode(value)) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("view", value);
    setSearchParams(nextSearchParams);
  };
  const seoCanonicalPath = `/card/${encodeURIComponent(cardId)}/printings`;
  const unresolvedSeoMetadata: SeoMetadata = {
    canonicalPath: seoCanonicalPath,
    robots: "noindex,follow",
    title: t("card:seo.printings.fallback_title"),
  };

  if ((loading && !data) || (card && variants.isLoading)) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center justify-center p-6",
          NAVBAR_CONTENT_OFFSET_CLASS_NAME
        )}
      >
        <Loading />
      </div>
    );
  }

  if (error && !card) {
    return (
      <div
        className={cn(
          "mx-auto w-full max-w-[1720px] px-4 pb-6 sm:px-6 lg:px-[60px]",
          NAVBAR_CONTENT_OFFSET_CLASS_NAME
        )}
      >
        <Seo metadata={unresolvedSeoMetadata} />
        <p className="mt-4 rounded-md border border-destructive/30 bg-card p-6 text-center text-destructive lg:mt-10">
          {t("card:printings.load_error")}
        </p>
      </div>
    );
  }

  if (!card) return <NotFound />;

  const seoProducts: SeoProductInput[] = variants.variants.map((variant) => ({
    collectorNumber: variant.collectorNumber,
    id: variant.id,
    imageUrl: variant.imageUrl,
    name: variant.name,
    setCode: variant.cardSet?.code,
  }));
  const seoTitle = t("card:seo.printings.title", { name: card.name });
  const seoDescription = t("card:seo.printings.description", {
    count: variants.totalCount ?? 0,
    name: card.name,
  });
  const seoMetadata: SeoMetadata = {
    canonicalPath: seoCanonicalPath,
    description: seoDescription,
    jsonLd: seoProducts.length
      ? createCardPrintingsPageJsonLd({
          description: seoDescription,
          products: seoProducts,
        })
      : undefined,
    robots: "noindex,follow",
    title: seoTitle,
  };
  const noResultsLabel = showOnlyAvailable
    ? t("card:printings.no_available")
    : t("card:printings.no_printings");

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1720px] px-4 pb-6 sm:px-6 lg:px-[60px]",
        NAVBAR_CONTENT_OFFSET_CLASS_NAME
      )}
    >
      <Seo metadata={seoMetadata} />
      <div className="pt-4 lg:pt-10">
        <nav aria-label={t("card:printings.breadcrumb_label")}>
          <ol className="flex min-w-0 items-center gap-2 text-sm">
            <li className="min-w-0">
              <Link
                to={`/card/${card.id}`}
                className="block truncate text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {card.name}
              </Link>
            </li>
            <li aria-hidden="true" className="shrink-0 text-muted-foreground">
              <ChevronRight className="size-4" />
            </li>
            <li
              aria-current="page"
              className="shrink-0 text-error underline underline-offset-4"
            >
              {t("card:printings.breadcrumb")}
            </li>
          </ol>
        </nav>

        <h1 className="mt-4 font-display text-2xl font-medium leading-tight text-primary sm:text-[32px]">
          {card.name}
        </h1>

        <div className="mt-1 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {variants.totalCount !== undefined && (
              <p className="text-sm text-[#6F6A63]">
                {t("card:printings.count", { count: variants.totalCount })}
              </p>
            )}
            <Link
              to={`/card/${card.id}/listings`}
              className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {isListingCountLoading || listingCount === undefined
                ? t("card:printings.all_listings_loading")
                : t("card:printings.all_listings", { count: listingCount })}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm">
              <Switch
                checked={showOnlyAvailable}
                aria-label={t("card:printings.show_only_available")}
                onCheckedChange={setShowOnlyAvailable}
              />
              <span>{t("card:printings.show_only_available")}</span>
            </label>
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <Select value={sortMode} onValueChange={handleSortChange}>
                <SelectTrigger
                  className="min-w-0 flex-1 sm:w-44 sm:flex-none"
                  aria-label={t("card:printings.sort_by")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="release_date">
                    {t("card:printings.sort.release_date")}
                  </SelectItem>
                  <SelectItem value="price_asc">
                    {t("card:printings.sort.price_asc")}
                  </SelectItem>
                  <SelectItem value="price_desc">
                    {t("card:printings.sort.price_desc")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <ToggleGroup
                type="single"
                value={viewMode}
                variant="outline"
                className="w-fit shrink-0"
                onValueChange={handleViewChange}
              >
                <ToggleGroupItem
                  value="grid"
                  className="w-9"
                  aria-label={t("card:printings.view.grid")}
                >
                  <Grid2X2 className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="list"
                  className="w-9"
                  aria-label={t("card:printings.view.list")}
                >
                  <List className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        {displayedPrintings.length > 0 && viewMode === "grid" && (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {displayedPrintings.map((item) => (
              <CardPrintingTile
                key={item.id}
                item={item}
                noImageLabel={t("common:card_search.no_image")}
              />
            ))}
          </div>
        )}

        {displayedPrintings.length > 0 && viewMode === "list" && (
          <div className="mt-8">
            <CardPrintingsList
              formatMarketPrice={formatMarketPrice}
              items={displayedPrintings}
              noImageLabel={t("common:card_search.no_image")}
            />
          </div>
        )}

        {!variants.isLoadingAll &&
          !variants.error &&
          !variants.loadMoreError &&
          displayedPrintings.length === 0 && (
            <p className="mt-8 border border-dashed border-[#D8D3CC] bg-white p-8 text-center text-sm text-muted-foreground">
              {noResultsLabel}
            </p>
          )}

        {variants.isLoadingAll && (
          <div className="mt-8 flex justify-center">
            <Loading />
          </div>
        )}
        {(variants.error || variants.loadMoreError) && (
          <p className="mt-6 rounded-md border border-destructive/30 bg-card p-4 text-center text-sm text-destructive">
            {t("card:printings.load_error")}
          </p>
        )}
      </div>
    </div>
  );
};
