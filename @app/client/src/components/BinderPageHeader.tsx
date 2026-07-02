import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { BinderNote } from "@/components/BinderNote";
import { BinderTitle } from "@/components/BinderTitle";
import {
  ButtonImportBinder,
  type ImportBinderCardsHandler,
} from "@/components/ButtonImportBinder";
import { CardSearchPicker } from "@/components/CardSearchPicker";
import { Switch } from "@/components/ui/Switch";
import type { DraftCardSnapshot } from "@/hooks/useDraftBinder";

interface BinderPageHeaderProps {
  binderId: string;
  binderName: string;
  binderNote: string;
  binderTcgId: string;
  headerAction?: ReactNode;
  isOwner: boolean;
  ownerByline?: ReactNode;
  showConvertedMarketPrices: boolean;
  titleAction?: ReactNode;
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
  headerAction,
  isOwner,
  ownerByline,
  showConvertedMarketPrices,
  titleAction,
  onAddCard,
  onBinderChanged,
  onImportCards,
  onRenameBinder,
  onShowConvertedMarketPricesChange,
  onUpdateBinderNote,
}: BinderPageHeaderProps) => {
  const { t } = useTranslation(["binder", "common"]);

  return (
    <div className="relative z-30 -mx-4 flex shrink-0 flex-col gap-4 border-y border-binder-toolbar-input/40 bg-binder-toolbar/95 px-4 py-3 text-binder-toolbar-foreground sm:-mx-6 sm:px-6 lg:-mx-20 lg:flex-row lg:items-start lg:justify-between lg:px-20">
      <div className="min-w-0">
        <BinderTitle
          binderId={binderId}
          isOwner={isOwner}
          name={binderName}
          onRename={onRenameBinder}
          onRenamed={onBinderChanged}
        />
        {ownerByline && (
          <div className="mt-0.5 mb-3 flex min-w-0 items-center">
            {ownerByline}
          </div>
        )}
        <BinderNote
          binderId={binderId}
          isOwner={isOwner}
          note={binderNote}
          onUpdate={onUpdateBinderNote}
          onUpdated={onBinderChanged}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isOwner && (
            <>
              <CardSearchPicker
                containerClassName="w-full sm:w-80"
                className="border-binder-toolbar-foreground/25 text-muted-foreground bg-background placeholder:text-muted-foreground"
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {titleAction}
          {titleAction && (
            <span
              aria-hidden="true"
              className="hidden h-4 w-px bg-binder-toolbar-foreground/25 sm:block"
            />
          )}
          <label className="inline-flex w-fit items-center gap-2 text-sm text-binder-toolbar-foreground/80">
            <Switch
              checked={showConvertedMarketPrices}
              onCheckedChange={onShowConvertedMarketPricesChange}
              aria-label={t("binder:show_converted_market_prices")}
            />
            <span>{t("binder:show_converted_market_prices")}</span>
          </label>
        </div>
      </div>
    </div>
  );
};
