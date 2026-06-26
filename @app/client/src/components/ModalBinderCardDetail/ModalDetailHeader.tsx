import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DialogClose } from "@/components/ui/Dialog";

interface ModalDetailHeaderProps {
  cancelLabel: string;
  currentIndex: number | null;
  isSaving: boolean;
  positionLabel: string | null;
  savingLabel: string;
  titleLabel: string;
}

export const ModalDetailHeader = ({
  cancelLabel,
  currentIndex,
  isSaving,
  positionLabel,
  savingLabel,
  titleLabel,
}: ModalDetailHeaderProps) => (
  <div className="flex shrink-0 items-center gap-2 border-b border-foreground/10 px-4 py-3 text-primary-foreground">
    <p className="mr-auto text-xs font-semibold uppercase">
      {currentIndex === null ? titleLabel : positionLabel}
    </p>
    {isSaving && (
      <span className="text-xs font-medium text-primary-foreground/75">
        {savingLabel}
      </span>
    )}
    <DialogClose asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={cancelLabel}
        className="text-primary-foreground hover:bg-foreground/10 hover:text-primary-foreground"
      >
        <X className="size-4" />
      </Button>
    </DialogClose>
  </div>
);
