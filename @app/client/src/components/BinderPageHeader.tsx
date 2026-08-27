import type { BinderVisibility } from "@app/graphql";
import { Eye } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { BinderNote } from "@/components/BinderNote";
import { BinderTitle } from "@/components/BinderTitle";
import { BinderVisibilityIcon } from "@/components/BinderVisibilityIcon";
import {
  ButtonImportBinder,
} from "@/components/ButtonImportBinder";
import { CardSearchPicker } from "@/components/CardSearchPicker";
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
  ownerByline?: ReactNode;
  titleAction?: ReactNode;
  viewCount?: number;
  onCoherenceFailure?: () => void;
}

export const BinderPageHeader = ({
  binderEditing,
  binderName,
  binderNote,
  binderTcgId,
  binderVisibility,
  headerAction,
  isOwnerView,
  ownerByline,
  titleAction,
  viewCount,
  onCoherenceFailure,
}: BinderPageHeaderProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [requiresReload, setRequiresReload] = useState(false);

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
      className="relative z-30 flex shrink-0 flex-col gap-4 border border-border/50
       bg-binder-toolbar px-4 py-4 text-binder-toolbar-foreground rounded-lg
      sm:-mx-4 sm:px-4 lg:flex-row lg:items-start lg:justify-between"
    >
      <div className="min-w-0">
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
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {isOwnerView && viewCount !== undefined && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex items-center gap-1.5 text-sm text-binder-toolbar-foreground/80 tabular-nums"
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
        )}
        {ownerByline && (
          <div className="mt-0.5 mb-3 flex min-w-0 items-center gap-3">
            {ownerByline}
            {titleAction}
          </div>
        )}
        <BinderNote
          binderEditing={binderEditing}
          note={binderNote}
          onCoherenceFailure={onCoherenceFailure}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {binderEditing && !requiresReload && (
          <>
            <CardSearchPicker
              containerClassName="w-full sm:w-80"
              placeholder={t("binder:search_placeholder")}
              onSelect={handleAddCard}
            />
            <ButtonImportBinder
              binderEditing={binderEditing}
              onCoherenceFailure={onCoherenceFailure}
              tcgId={binderTcgId}
            />
            {isAddingCard && (
              <span className="text-sm text-binder-toolbar-foreground/80">
                {t("binder:adding_card")}
              </span>
            )}
          </>
        )}
        {requiresReload && (
          <p className="max-w-sm text-sm text-binder-toolbar-foreground/80">
            {t("binder:editing.coherence_failed")}
          </p>
        )}
        {headerAction}
      </div>
    </div>
  );
};
