import { BinderVisibility } from "@app/graphql";
import {
  EyeOff,
  Globe,
  Lock,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { ButtonNewBinder } from "@/components/ButtonNewBinder";
import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { getCardImageUrls } from "@/lib/cardImageUrl";

export interface BinderGalleryBinder {
  cardCount: number;
  coverImageUrl?: string | null;
  coverScryfallId?: string | null;
  id: string;
  name: string;
  shortId: string;
  visibility: BinderVisibility;
}

interface BinderGalleryProps {
  binders: BinderGalleryBinder[];
  onOpenSettings: (binder: BinderGalleryBinder) => void;
}

type BinderVisibilityLabelKey =
  | "binder:settings.visibility.listed"
  | "binder:settings.visibility.unlisted"
  | "binder:settings.visibility.private";

interface BinderVisibilityOption {
  Icon: LucideIcon;
  labelKey: BinderVisibilityLabelKey;
  value: BinderVisibility;
}

const binderVisibilityOptions: BinderVisibilityOption[] = [
  {
    Icon: Globe,
    labelKey: "binder:settings.visibility.listed",
    value: BinderVisibility.Listed,
  },
  {
    Icon: EyeOff,
    labelKey: "binder:settings.visibility.unlisted",
    value: BinderVisibility.Unlisted,
  },
  {
    Icon: Lock,
    labelKey: "binder:settings.visibility.private",
    value: BinderVisibility.Private,
  },
];

const getBinderVisibilityOption = (
  visibility: BinderVisibility
): BinderVisibilityOption =>
  binderVisibilityOptions.find((option) => option.value === visibility) ??
  binderVisibilityOptions[1];

export const BinderGallery = ({
  binders,
  onOpenSettings,
}: BinderGalleryProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {binders.map((binder) => (
        <BinderGalleryItem
          key={binder.id}
          binder={binder}
          onOpenSettings={onOpenSettings}
        />
      ))}
      <BinderGalleryAddItem />
    </div>
  );
};

interface BinderGalleryItemProps {
  binder: BinderGalleryBinder;
  onOpenSettings: (binder: BinderGalleryBinder) => void;
}

const BinderGalleryItem = ({
  binder,
  onOpenSettings,
}: BinderGalleryItemProps) => {
  const { t } = useTranslation(["binder"]);
  const coverImageUrls = getCardImageUrls(
    binder.coverImageUrl,
    "art",
    binder.coverScryfallId
  );
  const visibilityOption = getBinderVisibilityOption(binder.visibility);
  const VisibilityIcon = visibilityOption.Icon;
  const visibilityLabel = t(visibilityOption.labelKey);

  return (
    <div className="group relative grid gap-2">
      <Link
        to={`/binder/${binder.shortId}`}
        className="block"
        aria-label={binder.name}
      >
        <div className="relative aspect-[2731/3239] overflow-hidden rounded-[3%_9%_9%_3%_/_4%_12%_12%_4%] bg-foreground shadow-sm ring-1 ring-card/20 outline outline-4 outline-offset-0 outline-transparent transition-[outline-color] group-hover:outline-primary/70 group-focus-within:outline-primary">
          {coverImageUrls.fallbackUrl && (
            <picture className="absolute inset-0 block">
              {coverImageUrls.webpUrl && (
                <source srcSet={coverImageUrls.webpUrl} type="image/webp" />
              )}
              <img
                src={coverImageUrls.fallbackUrl}
                alt=""
                className="h-full w-full object-cover"
                decoding="async"
                loading="lazy"
              />
            </picture>
          )}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-[11%] bg-gradient-to-r from-black/30 via-white/10 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-y-[3%] left-[7%] border-l border-dashed border-black/35"
          />
          <div
            aria-hidden="true"
            className="absolute inset-[3%] rounded-[inherit] border border-dashed border-black/35"
          />
          <div className="absolute inset-x-3 bottom-3">
            <div className="grid max-w-full gap-1 rounded-sm bg-foreground/85 px-3 py-2 text-left shadow-sm">
              <div className="flex min-w-0 items-start gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center text-white/85"
                      aria-label={visibilityLabel}
                    >
                      <VisibilityIcon className="size-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4}>
                    {visibilityLabel}
                  </TooltipContent>
                </Tooltip>
                <div className="line-clamp-2 min-w-0 text-sm font-semibold leading-5 text-white">
                  {binder.name}
                </div>
              </div>
              <span className="min-h-4 text-left text-xs font-medium leading-4 text-white/80">
                {t("binder:gallery.card_count", { count: binder.cardCount })}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="absolute right-2 top-2 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-md border border-white/80 bg-white text-foreground shadow-lg shadow-black/20 hover:bg-white/90 hover:text-foreground focus-visible:ring-white/70"
              aria-label={t("binder:settings.open_for", {
                name: binder.name,
              })}
              onClick={() => onOpenSettings(binder)}
            >
              <Settings className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={4}>
            {t("binder:settings.button")}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

const BinderGalleryAddItem = () => {
  const { t } = useTranslation(["common"]);

  return (
    <ButtonNewBinder
      trigger={
        <button
          type="button"
          className="group relative aspect-[2731/3239] cursor-pointer overflow-hidden rounded-[3%_9%_9%_3%_/_4%_12%_12%_4%] border border-dashed border-border bg-card/40 text-muted-foreground outline outline-4 outline-offset-0 outline-transparent transition-[outline-color,background-color,border-color,color] hover:border-primary/70 hover:bg-card/70 hover:text-foreground hover:outline-primary/70 focus-visible:outline-primary"
          aria-label={t("common:new_binder.button")}
        >
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-[11%] bg-gradient-to-r from-foreground/10 via-white/20 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-y-[3%] left-[7%] border-l border-dashed border-border"
          />
          <div
            aria-hidden="true"
            className="absolute inset-[3%] rounded-[inherit] border border-dashed border-border"
          />
          <span className="absolute inset-0 flex items-center justify-center px-4">
            <span className="inline-flex items-center justify-center gap-2 text-sm font-medium">
              <Plus className="size-4" />
              {t("common:add")}
            </span>
          </span>
        </button>
      }
    />
  );
};
