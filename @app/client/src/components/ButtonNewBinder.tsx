import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { useCreateBinderMutation } from "@app/graphql";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { handleError } from "@/lib/error";

export const ButtonNewBinder = () => {
  const { t } = useTranslation(["common"]);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [createBinder, { loading }] = useCreateBinderMutation();

  const resetForm = () => {
    setName("");
    setValidationError("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError(t("common:new_binder.name_required"));
      return;
    }

    try {
      const result = await createBinder({
        variables: {
          name: trimmedName,
        },
      });
      const binder =
        result.data?.insertIntoBindersCollection?.records[0] || null;

      if (!binder?.shortId) {
        throw new Error(t("common:new_binder.create_error"));
      }

      setIsOpen(false);
      resetForm();
      navigate(`/binder/${binder.shortId}`);
    } catch (error) {
      handleError(error, t("common:new_binder.create_error"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-9 px-2 sm:px-3">
          <Plus className="size-4" />
          {t("common:new_binder.button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("common:new_binder.title")}</DialogTitle>
            <DialogDescription>
              {t("common:new_binder.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="new-binder-name">
              {t("common:new_binder.name_label")}
            </Label>
            <Input
              id="new-binder-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setValidationError("");
              }}
              disabled={loading}
              autoFocus
              aria-invalid={!!validationError}
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setIsOpen(false)}
            >
              {t("common:cancel")}
            </Button>
            <Button type="submit" isLoading={loading}>
              {t("common:new_binder.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
