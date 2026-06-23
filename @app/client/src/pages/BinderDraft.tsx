import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { CardSearchPicker } from "@/components/CardSearchPicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  CARD_CONDITION_OPTIONS,
  CARD_CURRENCY_OPTIONS,
  CARD_LANGUAGE_OPTIONS,
  type DraftBinderCard,
  type DraftCardCondition,
  type DraftCardCurrency,
  type DraftCardLanguage,
  useDraftBinder,
} from "@/hooks/useDraftBinder";
import { useSession } from "@/providers/SessionContext";

const formatLabel = (value: string): string => {
  return value.replace(/_/g, " ");
};

const formatPrice = (
  amount: number,
  currency: string,
  locale: string
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

interface BinderDraftCardRowProps {
  draftCard: DraftBinderCard;
  onUpdate: (patch: Partial<DraftBinderCard>) => void;
  onRemove: () => void;
}

const BinderDraftCardRow = ({
  draftCard,
  onUpdate,
  onRemove,
}: BinderDraftCardRowProps) => {
  const { i18n, t } = useTranslation(["common"]);
  const finishOptions =
    draftCard.card.finishes.length > 0 ? draftCard.card.finishes : ["normal"];
  const formatOptionLabel = (
    scope: "condition" | "finish" | "language",
    value: string
  ) => t(`common:card.${scope}.${value}`, { defaultValue: formatLabel(value) });

  return (
    <article className="grid gap-4 rounded-md border bg-card p-3 text-card-foreground shadow-xs md:grid-cols-[88px_minmax(180px,1fr)_minmax(360px,2fr)_auto]">
      <div className="flex aspect-[63/88] w-20 items-center justify-center overflow-hidden rounded-sm border bg-muted md:w-full">
        {draftCard.card.imageNormalUrl || draftCard.card.imageSmallUrl ? (
          <img
            src={
              draftCard.card.imageNormalUrl ||
              draftCard.card.imageSmallUrl ||
              ""
            }
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-muted-foreground">
            {t("common:card_search.no_image")}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold tracking-normal">
          {draftCard.card.name}
        </h2>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{draftCard.card.setCode || "MTG"}</span>
          {draftCard.card.collectorNumber && (
            <span>#{draftCard.card.collectorNumber}</span>
          )}
          {draftCard.card.releasedAt && (
            <span>{draftCard.card.releasedAt}</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {draftCard.card.marketPrices.slice(0, 3).map((price) => (
            <Badge
              key={`${price.source}-${price.finish}`}
              variant="outline"
              className="capitalize"
            >
              {price.source} {formatOptionLabel("finish", price.finish)}:{" "}
              {formatPrice(price.amount, price.currency, i18n.language)}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t("common:draft_binder.quantity")}
          <Input
            type="number"
            min={1}
            value={draftCard.quantity}
            onChange={(event) =>
              onUpdate({ quantity: Number(event.target.value) || 1 })
            }
          />
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t("common:draft_binder.finish")}
          <Select
            value={draftCard.finish}
            onValueChange={(finish) => onUpdate({ finish })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {finishOptions.map((finish) => (
                <SelectItem key={finish} value={finish}>
                  {formatOptionLabel("finish", finish)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t("common:draft_binder.condition")}
          <Select
            value={draftCard.condition}
            onValueChange={(condition) =>
              onUpdate({ condition: condition as DraftCardCondition })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARD_CONDITION_OPTIONS.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  {formatOptionLabel("condition", condition)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t("common:draft_binder.language")}
          <Select
            value={draftCard.language}
            onValueChange={(language) =>
              onUpdate({ language: language as DraftCardLanguage })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARD_LANGUAGE_OPTIONS.map((language) => (
                <SelectItem key={language} value={language}>
                  {formatOptionLabel("language", language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground sm:col-span-1 lg:col-span-2">
          {t("common:draft_binder.manual_price")}
          <Input
            type="number"
            min={0}
            step="0.01"
            value={draftCard.priceAmount ?? ""}
            onChange={(event) =>
              onUpdate({
                priceAmount:
                  event.target.value === ""
                    ? undefined
                    : Number(event.target.value),
              })
            }
          />
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground sm:col-span-1 lg:col-span-2">
          {t("common:draft_binder.currency")}
          <Select
            value={draftCard.priceCurrency || CARD_CURRENCY_OPTIONS[0]}
            onValueChange={(priceCurrency) =>
              onUpdate({ priceCurrency: priceCurrency as DraftCardCurrency })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARD_CURRENCY_OPTIONS.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground sm:col-span-2 lg:col-span-4">
          {t("common:draft_binder.note")}
          <Textarea
            value={draftCard.note || ""}
            onChange={(event) => onUpdate({ note: event.target.value })}
            className="min-h-12 resize-none"
          />
        </label>
      </div>

      <div className="flex items-start justify-end">
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="size-4" />
          <span className="sr-only">
            {t("common:draft_binder.remove_card")}
          </span>
        </Button>
      </div>
    </article>
  );
};

export const BinderDraft = () => {
  const { t } = useTranslation(["common"]);
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useSession();
  const { draftBinder, setName, addCard, updateCard, removeCard, clearDraft } =
    useDraftBinder();

  const handleSave = () => {
    if (!session) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }

    toast.info(t("common:draft_binder.save_not_ready"));
  };

  return (
    <div className="flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button type="button" variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="size-4" />
                <span className="sr-only">
                  {t("common:draft_binder.back_home")}
                </span>
              </Link>
            </Button>
            <Input
              value={draftBinder.name}
              placeholder={t("common:draft_binder.untitled_name")}
              aria-label={t("common:draft_binder.name_label")}
              onChange={(event) => setName(event.target.value)}
              className="h-11 max-w-md text-lg font-semibold"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearDraft();
                toast.success(t("common:draft_binder.draft_cleared"));
              }}
              disabled={draftBinder.cards.length === 0}
            >
              {t("common:draft_binder.clear")}
            </Button>
            <Button type="button" onClick={handleSave}>
              <Save className="size-4" />
              {t("common:draft_binder.save_share")}
            </Button>
          </div>
        </div>

        <section className="grid gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-normal">
                {t("common:draft_binder.title")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("common:draft_binder.card_count", {
                  count: draftBinder.cards.length,
                })}
              </p>
            </div>
            <CardSearchPicker
              containerClassName="w-full md:max-w-md"
              placeholder={t("common:draft_binder.add_another_card")}
              onSelect={addCard}
            />
          </div>
        </section>

        {draftBinder.cards.length > 0 ? (
          <section className="grid gap-3">
            {draftBinder.cards.map((draftCard) => (
              <BinderDraftCardRow
                key={draftCard.draftId}
                draftCard={draftCard}
                onUpdate={(patch) => updateCard(draftCard.draftId, patch)}
                onRemove={() => removeCard(draftCard.draftId)}
              />
            ))}
          </section>
        ) : (
          <section className="flex min-h-[320px] items-center justify-center rounded-md border border-dashed">
            <div className="w-full max-w-md px-4 text-center">
              <h2 className="text-lg font-medium tracking-normal">
                {t("common:draft_binder.empty")}
              </h2>
              <div className="mt-4">
                <CardSearchPicker onSelect={addCard} />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
