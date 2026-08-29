import type { BinderVisibility } from "@app/graphql";
import { EllipsisVertical, Eye, Settings, Upload } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { BinderNote } from "@/components/BinderNote";
import { BinderTitle } from "@/components/BinderTitle";
import { BinderVisibilityIcon } from "@/components/BinderVisibilityIcon";
import { ButtonImportBinder } from "@/components/ButtonImportBinder";
import { CardSearchPicker } from "@/components/CardSearchPicker";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import type {
  BinderEditing,
  BinderEditingCardSnapshot,
} from "@/lib/binderEditing";
import {
  isBinderEditingCoherenceError,
  presentBinderEditingError,
} from "@/lib/binderEditing";

interface BinderPageHeaderProps {
  binderEditing?: BinderEditing;
  binderName: string;
  binderNote: string;
  binderTcgId: string;
  binderVisibility: BinderVisibility;
  headerAction?: ReactNode;
  isOwnerView: boolean;
  mobileHeaderAction?: ReactNode;
  ownerByline?: ReactNode;
  titleAction?: ReactNode;
  viewCount?: number;
  onCoherenceFailure?: () => void;
  onOpenSettings?: () => void;
}

export const BinderPageHeader = ({
  binderEditing,
  binderName,
  binderNote,
  binderTcgId,
  binderVisibility,
  headerAction,
  isOwnerView,
  mobileHeaderAction,
  ownerByline,
  titleAction,
  viewCount,
  onCoherenceFailure,
  onOpenSettings,
}: BinderPageHeaderProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [requiresReload, setRequiresReload] = useState(false);
  const canShowMobileActions =
    (!!binderEditing && !requiresReload) || !!onOpenSettings;

  const handleAddCard = async (card: BinderEditingCardSnapshot) => {
    if (!binderEditing || isAddingCard || requiresReload) return;

    setIsAddingCard(true);
    try {
      await binderEditing.addCard({ card });
    } catch (error) {
      presentBinderEditingError(error, {
        fallbackMessage: t("binder:add_card_error"),
        reasonMessages: {
          coherence_failed: t("binder:editing.coherence_failed"),
        },
      });
      if (isBinderEditingCoherenceError(error)) {
        if (onCoherenceFailure) {
          onCoherenceFailure();
        } else {
          setRequiresReload(true);
        }
      }
    } finally {
      setIsAddingCard(false);
    }
  };

  return (
    <div
      className="relative z-30 grid shrink-0 grid-cols-1 gap-4 text-binder-toolbar-foreground lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-start lg:gap-2"
    >
      <div className="row-start-1 min-w-0 lg:col-start-1 lg:row-start-1">
        <div className="flex min-w-0 items-center gap-2">
          {isOwnerView && (
            <BinderVisibilityIcon
              className="size-8 text-binder-toolbar-foreground/80"
              visibility={binderVisibility}
            />
          )}
          <div className="min-w-0">
            <BinderTitle
              binderEditing={binderEditing}
              name={binderName}
              onCoherenceFailure={onCoherenceFailure}
            />
          </div>
        </div>
        {((isOwnerView && viewCount !== undefined) ||
          (!ownerByline && titleAction)) && (
          <div className="mt-0.5 flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              {isOwnerView && viewCount !== undefined && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm text-binder-toolbar-foreground/80 tabular-nums"
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
              {!ownerByline && titleAction}
            </div>
          </div>
        )}
        {ownerByline && (
          <div className="mt-0.5 mb-3 flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              {ownerByline}
              {titleAction}
            </div>
          </div>
        )}
        <BinderNote
          binderEditing={binderEditing}
          note={binderNote}
          onCoherenceFailure={onCoherenceFailure}
        />
      </div>
      {(binderEditing ||
        requiresReload ||
        onOpenSettings ||
        mobileHeaderAction) && (
        <div
          className={`row-start-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 ${!binderEditing && !requiresReload ? "lg:hidden" : "lg:col-start-2 lg:row-start-1 lg:flex lg:flex-nowrap"}`}
        >
          {binderEditing && !requiresReload && (
            <>
              <CardSearchPicker
                containerClassName="min-w-0 w-full lg:w-80 lg:flex-none"
                placeholder={t("binder:search_placeholder")}
                onSelect={handleAddCard}
              />
              <ButtonImportBinder
                binderEditing={binderEditing}
                open={isImportOpen}
                showTrigger={false}
                tcgId={binderTcgId}
                onCoherenceFailure={onCoherenceFailure}
                onOpenChange={setIsImportOpen}
              />
              <div className="hidden lg:block">
                <ButtonImportBinder
                  binderEditing={binderEditing}
                  onCoherenceFailure={onCoherenceFailure}
                  tcgId={binderTcgId}
                />
              </div>
              {isAddingCard && (
                <span className="col-span-full text-sm text-binder-toolbar-foreground/80 lg:col-auto">
                  {t("binder:adding_card")}
                </span>
              )}
            </>
          )}
          {(canShowMobileActions || mobileHeaderAction) && (
            <div className="col-start-2 row-start-1 flex items-center gap-2 lg:hidden">
              {canShowMobileActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={t("binder:actions.more")}
                    >
                      <EllipsisVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    aria-label={t("binder:actions.more")}
                  >
                    {binderEditing && !requiresReload && (
                      <DropdownMenuItem
                        onSelect={() => setIsImportOpen(true)}
                      >
                        <Upload className="size-4" />
                        {t("binder:import.button")}
                      </DropdownMenuItem>
                    )}
                    {onOpenSettings && (
                      <DropdownMenuItem onSelect={onOpenSettings}>
                        <Settings className="size-4" />
                        {t("binder:settings.button")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {mobileHeaderAction}
            </div>
          )}
          {requiresReload && (
            <p className="col-span-full max-w-sm text-sm text-binder-toolbar-foreground/80 lg:col-auto">
              {t("binder:editing.coherence_failed")}
            </p>
          )}
        </div>
      )}
      {headerAction && (
        <div className="hidden items-center justify-self-end gap-2 lg:col-start-3 lg:row-start-1 lg:flex">
          {headerAction}
        </div>
      )}
    </div>
  );
};
