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

interface ModalBinderShareProps {
  binderName: string;
  open: boolean;
  shareUrl: string;
  onOpenChange: (open: boolean) => void;
}

export const ModalBinderShare = ({
  binderName,
  open,
  shareUrl,
  onOpenChange,
}: ModalBinderShareProps) => {
  const { t } = useTranslation(["binder", "common"]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex min-w-0 pr-8">
            <DialogTitle>{t("binder:share.title")}</DialogTitle>
          </div>
          <DialogDescription>
            {t("binder:share.description", { name: binderName })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <span className="text-sm font-medium">
            {t("binder:share.url_label")}
          </span>
          <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/30 py-1.5 pl-3 pr-1.5">
            <span className="min-w-0 flex-1 truncate text-sm tabular-nums">
              {shareUrl}
            </span>
            <CopyToClipboardButton value={shareUrl} />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("common:ok")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
