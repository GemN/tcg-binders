import type { CurrencyCode, LanguageCode } from "@app/graphql";
import { Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { CardConditionBadge } from "@/components/CardConditionBadge";
import { CardFinishBadge } from "@/components/CardFinishBadge";
import { CardImage } from "@/components/CardImage";
import { CountryFlag } from "@/components/CountryFlag";
import { Button } from "@/components/ui/Button";
import { cardLanguageFlagCodes } from "@/config/card";
import type { CartItem } from "@/lib/cart";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

type CartNoticeTranslate = (
  key: string,
  options?: Record<string, unknown>
) => string;

const formatFallbackOption = (value: string): string => {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

interface GetCartNoticeOptionLabelParams {
  group: "language";
  t: CartNoticeTranslate;
  value: string | null;
}

const getCartNoticeOptionLabel = ({
  group,
  t,
  value,
}: GetCartNoticeOptionLabelParams): string | null => {
  if (!value) return null;

  return t(`common:card.${group}.${value}`, {
    defaultValue: formatFallbackOption(value),
  });
};

interface NavbarCartNoticeProps {
  isVisible: boolean;
  item: CartItem;
  itemCount: number;
  progress: number;
  onDismiss: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onUndo: () => void;
}

export const NavbarCartNotice = ({
  isVisible,
  item,
  itemCount,
  progress,
  onDismiss,
  onMouseEnter,
  onMouseLeave,
  onUndo,
}: NavbarCartNoticeProps) => {
  const { i18n, t } = useTranslation(["checkout", "common", "binder"]);
  const { convertAmountToLocalCurrency, currency } = usePricingSettings();
  const translate = t as unknown as CartNoticeTranslate;
  const languageLabel = getCartNoticeOptionLabel({
    group: "language",
    t: translate,
    value: item.language,
  });
  const priceLabel =
    item.unitPriceAmount !== null && item.unitPriceCurrency
      ? formatCurrency(
          item.unitPriceAmount,
          item.unitPriceCurrency as CurrencyCode,
          i18n.language
        )
      : t("checkout:no_price");
  const convertedPriceAmount =
    item.unitPriceAmount !== null &&
    item.unitPriceCurrency &&
    item.unitPriceCurrency !== currency
      ? convertAmountToLocalCurrency(
          item.unitPriceAmount,
          item.unitPriceCurrency as CurrencyCode
        )
      : null;
  const convertedPriceLabel =
    convertedPriceAmount !== null
      ? formatCurrency(convertedPriceAmount, currency, i18n.language)
      : null;

  return (
    <div
      aria-label={t("checkout:cart_notice.label")}
      className={cn(
        "fixed left-4 right-4 top-16 z-50 origin-top rounded-lg border-2 border-primary/80 bg-card p-4 text-card-foreground shadow-2xl transition-[opacity,transform] duration-200 ease-out sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[26rem]",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-3 opacity-0"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="dialog"
    >
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden rounded-t-md bg-primary/15">
        <div
          aria-hidden="true"
          className="h-full origin-left bg-primary"
          style={{
            transform: `scaleX(${Math.max(0, Math.min(1, progress))})`,
          }}
        />
      </div>
      <span className="absolute -top-2 right-3 hidden size-4 translate-x-1/2 rotate-45 border-l-2 border-t-2 border-primary/80 bg-card sm:block" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-3 top-3 size-8 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={t("common:close")}
        onClick={onDismiss}
      >
        <X className="size-5" />
      </Button>
      <p className="pr-10 text-base font-semibold text-foreground">
        {t("checkout:cart_notice.title", { count: itemCount })}
      </p>
      <div className="my-3 border-t border-border" />
      <p className="text-sm font-semibold text-muted-foreground">
        {t("checkout:cart_notice.last_added")}
      </p>
      <div className="mt-2 grid grid-cols-[6rem_minmax(0,1fr)_2.25rem] items-start gap-3 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-4">
        <CardImage
          alt={item.card.name}
          className="w-24 rounded-[4px] border border-border bg-background shadow-sm"
          finish={item.finish}
          imageSize="thumbnail"
          imageUrl={item.card.imageUrl}
          noImageLabel={t("binder:no_image")}
          showBadgeFinish={false}
          scryfallId={item.card.scryfallId}
        />
        <div className="min-w-0">
          <p className="line-clamp-2 text-base font-semibold leading-tight text-foreground">
            {item.quantity}x {item.card.name}
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            {item.seller.country && (
              <CountryFlag
                className="h-4 w-5"
                code={item.seller.country}
                label={item.seller.nickname}
              />
            )}
            <span className="min-w-0 truncate">{item.seller.nickname}</span>
          </div>
          <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "text-xl font-bold tabular-nums",
                item.unitPriceAmount === null && "text-warning"
              )}
            >
              {priceLabel}
            </span>
            {convertedPriceLabel && (
              <span className="text-sm text-muted-foreground">
                ~ {convertedPriceLabel}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CardConditionBadge condition={item.condition} showTooltip />
            {item.language && languageLabel && (
              <CountryFlag
                className="h-[18px] w-6"
                code={cardLanguageFlagCodes[item.language as LanguageCode]}
                label={languageLabel}
                showTooltip
              />
            )}
            <CardFinishBadge
              finish={item.finish}
              display="icon-label"
              className="h-5"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="h-9 w-9 shrink-0 px-0 transition-transform duration-150 ease-out sm:w-auto sm:px-3"
          onClick={onUndo}
        >
          <span className="sr-only sm:not-sr-only">{t("common:cancel")}</span>
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="my-3 border-t border-border" />
      <Button asChild className="w-full">
        <Link to="/cart" onClick={onDismiss}>
          {t("checkout:review_cart")}
        </Link>
      </Button>
    </div>
  );
};
