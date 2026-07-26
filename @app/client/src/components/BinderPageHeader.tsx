import type { BinderVisibility } from "@app/graphql";
import { Eye } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { BinderNote } from "@/components/BinderNote";
import { BinderTitle } from "@/components/BinderTitle";
import { BinderVisibilityIcon } from "@/components/BinderVisibilityIcon";
import {
  ButtonImportBinder,
  type ImportBinderCardsHandler,
} from "@/components/ButtonImportBinder";
import { CardSearchPicker } from "@/components/CardSearchPicker";
import { Switch } from "@/components/ui/Switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import type { DraftCardSnapshot } from "@/hooks/useDraftBinder";

interface BinderPageHeaderProps {
  binderId: string;
  binderName: string;
  binderNote: string;
  binderTcgId: string;
  binderVisibility: BinderVisibility;
  canEditBinder: boolean;
  headerAction?: ReactNode;
  ownerByline?: ReactNode;
  showConvertedMarketPrices: boolean;
  titleAction?: ReactNode;
  viewCount?: number;
  onAddCard: (card: DraftCardSnapshot) => void;
  onBinderChanged: () => Promise<unknown> | unknown;
  onImportCards?: ImportBinderCardsHandler;
  onRenameBinder?: (name: string) => Promise<unknown> | unknown;
  onShowConvertedMarketPricesChange: (checked: boolean) => void;
  onUpdateBinderNote?: (note: string) => Promise<unknown> | unknown;
}

export const BinderPageHeader = ({
  binderId,
  binderName,
  binderNote,
  binderTcgId,
  binderVisibility,
  canEditBinder,
  headerAction,
  ownerByline,
  showConvertedMarketPrices,
  titleAction,
  viewCount,
  onAddCard,
  onBinderChanged,
  onImportCards,
  onRenameBinder,
  onShowConvertedMarketPricesChange,
  onUpdateBinderNote,
}: BinderPageHeaderProps) => {
  const { t } = useTranslation(["binder", "common"]);

  return (
    <div
      className="relative z-30 flex shrink-0 flex-col gap-4 border border-border/50
       bg-binder-toolbar px-4 py-4 text-binder-toolbar-foreground rounded-lg
      sm:-mx-4 sm:px-4 lg:flex-row lg:items-start lg:justify-between"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          {canEditBinder && (
            <BinderVisibilityIcon
              className="size-8 text-binder-toolbar-foreground/80"
              visibility={binderVisibility}
            />
          )}
          <div className="min-w-0">
            <BinderTitle
              binderId={binderId}
              isOwner={canEditBinder}
              name={binderName}
              onRename={onRenameBinder}
              onRenamed={onBinderChanged}
            />
          </div>
        </div>
        {canEditBinder && viewCount !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-binder-toolbar-foreground/80 tabular-nums"
                aria-label={`${t("binder:stats.views")}: ${viewCount}`}
                tabIndex={0}
              >
                <Eye aria-hidden="true" className="size-4" />
                {viewCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              {t("binder:stats.views")}
            </TooltipContent>
          </Tooltip>
        )}
        {ownerByline && (
          <div className="mt-0.5 mb-3 flex min-w-0 items-center">
            {ownerByline}
          </div>
        )}
        <BinderNote
          binderId={binderId}
          isOwner={canEditBinder}
          note={binderNote}
          onUpdate={onUpdateBinderNote}
          onUpdated={onBinderChanged}
        />
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {canEditBinder && (
            <>
              <CardSearchPicker
                containerClassName="w-full sm:w-80"
                placeholder={t("binder:search_placeholder")}
                onSelect={onAddCard}
              />
              <ButtonImportBinder
                binderId={binderId}
                tcgId={binderTcgId}
                onImportCards={onImportCards}
                onImported={onBinderChanged}
              />
            </>
          )}
          {headerAction}
        </div>
        <div className="flex flex-col gap-4 items-end">
          <label className="inline-flex w-fit items-center gap-2 text-sm text-primary">
            <Switch
              checked={showConvertedMarketPrices}
              onCheckedChange={onShowConvertedMarketPricesChange}
              aria-label={t("binder:show_converted_market_prices")}
            />
            <span>{t("binder:show_converted_market_prices")}</span>
          </label>
          {titleAction}
        </div>
      </div>
    </div>
  );
};
