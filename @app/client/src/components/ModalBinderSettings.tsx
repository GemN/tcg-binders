import {
  BinderVisibility,
  useDeleteBinderMutation,
  useUpdateBinderVisibilityMutation,
} from "@app/graphql";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { BinderVisibilitySelect } from "@/components/BinderVisibilitySelect";
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
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Separator } from "@/components/ui/Separator";
import { handleError } from "@/lib/error";

interface ModalBinderSettingsProps {
  binderId: string;
  binderName: string;
  binderVisibility: BinderVisibility;
  open: boolean;
  onDeleted: () => void;
  onOpenChange: (open: boolean) => void;
  onVisibilityUpdated: () => Promise<unknown> | unknown;
}

export const ModalBinderSettings = ({
  binderId,
  binderName,
  binderVisibility,
  open,
  onDeleted,
  onOpenChange,
  onVisibilityUpdated,
}: ModalBinderSettingsProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const [selectedVisibility, setSelectedVisibility] =
    useState(binderVisibility);
  const [updateBinderVisibility, { loading: isUpdatingVisibility }] =
    useUpdateBinderVisibilityMutation();
  const [deleteBinder, { loading: isDeletingBinder }] =
    useDeleteBinderMutation();
  const isBusy = isUpdatingVisibility || isDeletingBinder;

  useEffect(() => {
    setSelectedVisibility(binderVisibility);
  }, [binderVisibility]);

  const handleVisibilityChange = async (nextVisibility: BinderVisibility) => {
    if (isBusy || nextVisibility === selectedVisibility) return;

    const previousVisibility = selectedVisibility;
    setSelectedVisibility(nextVisibility);

    try {
      const result = await updateBinderVisibility({
        variables: {
          id: binderId,
          visibility: nextVisibility,
        },
      });

      if (!result.data?.updateBindersCollection.affectedCount) {
        throw new Error(t("binder:settings.update_visibility_error"));
      }

      await onVisibilityUpdated();
      toast.success(t("binder:settings.update_visibility_success"));
    } catch (error) {
      setSelectedVisibility(previousVisibility);
      handleError(error, t("binder:settings.update_visibility_error"));
    }
  };

  const handleDeleteBinder = async () => {
    if (isDeletingBinder) return;

    try {
      const result = await deleteBinder({
        variables: {
          id: binderId,
        },
      });

      if (!result.data?.deleteFromBindersCollection?.affectedCount) {
        throw new Error(t("binder:settings.delete_error"));
      }

      toast.success(t("binder:settings.delete_success"));
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      handleError(error, t("binder:settings.delete_error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("binder:settings.title")}</DialogTitle>
          <DialogDescription>
            {t("binder:settings.description")}
          </DialogDescription>
        </DialogHeader>

        <BinderVisibilitySelect
          id="binder-settings-visibility"
          value={selectedVisibility}
          disabled={isBusy}
          onValueChange={handleVisibilityChange}
        />

        <Separator className="my-2" />

        <div className="grid gap-3">
          <div className="grid gap-1">
            <h3 className="text-sm font-medium">
              {t("binder:settings.delete_title")}
            </h3>
            <p className="text-sm leading-5 text-muted-foreground">
              {t("binder:settings.delete_description")}
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="w-fit"
                disabled={isBusy}
              >
                <Trash2 className="size-4" />
                {t("binder:settings.delete_button")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("binder:settings.delete_confirm_title")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("binder:settings.delete_confirm_description", {
                    name: binderName,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common:cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40"
                  disabled={isDeletingBinder}
                  onClick={handleDeleteBinder}
                >
                  {t("binder:settings.delete_confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
};
