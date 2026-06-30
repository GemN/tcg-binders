import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CopyToClipboardButton } from "@/components/CopyToClipboardButton";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

export type DraftBinderShareStatus = "idle" | "creating" | "adding" | "ready";

interface ModalDraftBinderShareProps {
  binderName: string;
  cardCount: number;
  open: boolean;
  shareUrl: string;
  status: DraftBinderShareStatus;
  onOpenBinder: () => void;
  onOpenChange: (open: boolean) => void;
}

export const ModalDraftBinderShare = ({
  binderName,
  cardCount,
  open,
  shareUrl,
  status,
  onOpenBinder,
  onOpenChange,
}: ModalDraftBinderShareProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const isReady = status === "ready";
  const isInProgress = status === "creating" || status === "adding";
  const title = isReady
    ? t("binder:draft.ready_title")
    : status === "adding"
      ? t("binder:draft.adding_cards_title")
      : t("binder:draft.creating_title");
  const description = isReady
    ? t("binder:draft.ready_description")
    : status === "adding"
      ? t("binder:draft.adding_cards_description", {
          count: cardCount,
          name: binderName,
        })
      : t("binder:draft.creating_description", {
          name: binderName,
        });

  const handleOpenChange = (nextOpen: boolean) => {
    if (isInProgress) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isInProgress}>
        <DialogHeader>
          <div className="flex min-w-0 items-center gap-2 pr-8">
            {isReady ? (
              <CheckCircle2 className="size-5 shrink-0 text-success" />
            ) : (
              <LoaderCircle className="size-5 shrink-0 animate-spin text-primary" />
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isReady && (
          <div className="grid gap-2">
            <span className="text-sm font-medium">
              {t("binder:draft.share_url_label")}
            </span>
            <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/30 p-2">
              <span className="min-w-0 flex-1 truncate text-sm tabular-nums">
                {shareUrl}
              </span>
              <CopyToClipboardButton value={shareUrl} />
            </div>
          </div>
        )}

        {isReady && (
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("common:ok")}
              </Button>
            </DialogClose>
            <Button type="button" onClick={onOpenBinder}>
              {t("binder:draft.open_binder")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
