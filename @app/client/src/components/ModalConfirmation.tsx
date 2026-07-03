import type { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";

interface ModalConfirmationBaseProps {
  buttonCancelLabel?: string;
  buttonConfirmLabel?: string;
  cancelButtonClassName?: string;
  confirmButtonClassName?: string;
  confirmDisabled?: boolean;
  description?: ReactNode;
  title: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

interface ModalConfirmationControlledProps extends ModalConfirmationBaseProps {
  open: boolean;
  trigger?: ReactElement;
  onOpenChange: (open: boolean) => void;
}

interface ModalConfirmationTriggerProps extends ModalConfirmationBaseProps {
  open?: never;
  trigger: ReactElement;
  onOpenChange?: never;
}

type ModalConfirmationProps =
  | ModalConfirmationControlledProps
  | ModalConfirmationTriggerProps;

export const ModalConfirmation = ({
  buttonCancelLabel,
  buttonConfirmLabel,
  cancelButtonClassName,
  confirmButtonClassName,
  confirmDisabled,
  description,
  open,
  title,
  trigger,
  onCancel,
  onConfirm,
  onOpenChange,
}: ModalConfirmationProps) => {
  const { t } = useTranslation("common");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={cancelButtonClassName}
            onClick={onCancel}
          >
            {buttonCancelLabel ?? t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={confirmButtonClassName}
            disabled={confirmDisabled}
            onClick={() => void onConfirm()}
          >
            {buttonConfirmLabel ?? t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
