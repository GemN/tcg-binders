import { useUpdateBinderNoteMutation } from "@app/graphql";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ClampedText } from "@/components/ClampedText";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { handleError } from "@/lib/error";

interface BinderNoteProps {
  binderId: string;
  isOwner: boolean;
  note: string;
  onUpdate?: (note: string) => Promise<unknown> | unknown;
  onUpdated?: () => Promise<unknown> | unknown;
}

const normalizeBinderNote = (note: string): string => note.trim();

export const BinderNote = ({
  binderId,
  isOwner,
  note,
  onUpdate,
  onUpdated,
}: BinderNoteProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const [modalDraftNote, setModalDraftNote] = useState(note);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompactClamped, setIsCompactClamped] = useState(false);
  const [updateBinderNote, { loading: isUpdatingRemote }] =
    useUpdateBinderNoteMutation();
  const [isUpdatingLocal, setIsUpdatingLocal] = useState(false);
  const loading = isUpdatingRemote || isUpdatingLocal;

  const displayedNote = normalizeBinderNote(note);
  const canShowNote = isOwner || !!displayedNote;
  const compactText = displayedNote || t("binder:note.placeholder");
  const isPlaceholder = !displayedNote;

  const handleClampChange = useCallback(
    (nextIsClamped: boolean) => setIsCompactClamped(nextIsClamped),
    []
  );

  useEffect(() => {
    if (!isModalOpen) {
      setModalDraftNote(note);
    }
  }, [isModalOpen, note]);

  if (!canShowNote) return null;

  const handleSaveNote = async (nextNote: string): Promise<boolean> => {
    if (loading) return false;

    const normalizedNote = normalizeBinderNote(nextNote);
    if (normalizedNote === displayedNote) {
      setModalDraftNote(displayedNote);
      return true;
    }

    try {
      if (onUpdate) {
        setIsUpdatingLocal(true);
        await onUpdate(normalizedNote);
      } else {
        const result = await updateBinderNote({
          variables: {
            id: binderId,
            note: normalizedNote,
          },
        });

        if (!result.data?.updateBindersCollection.affectedCount) {
          throw new Error(t("binder:note.update_error"));
        }
      }

      setModalDraftNote(normalizedNote);
      await onUpdated?.();
      return true;
    } catch (error) {
      handleError(error, t("binder:note.update_error"));
      return false;
    } finally {
      setIsUpdatingLocal(false);
    }
  };

  const handleOpenModal = () => {
    setModalDraftNote(displayedNote);
    setIsModalOpen(true);
  };

  return (
    <div className="mt-2 max-w-xl">
      <button
        type="button"
        className={`group relative block w-full text-left text-sm leading-5 text-foreground transition-colors ${
          isCompactClamped ? "pr-16" : ""
        }`}
        onClick={handleOpenModal}
      >
        <ClampedText
          className={`
            border-b border-dotted border-transparent hover:border-foreground cursor-pointer ${isPlaceholder ? "text-muted-foreground" : ""}
          `}
          indicator={displayedNote ? t("binder:note.show_more") : undefined}
          indicatorClassName="font-bold text-black group-hover:underline group-hover:decoration-dotted"
          onClampChange={handleClampChange}
          shouldMeasure={!!displayedNote}
        >
          {compactText}
        </ClampedText>
      </button>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("binder:note.title")}</DialogTitle>
          </DialogHeader>

          {isOwner ? (
            <Textarea
              value={modalDraftNote}
              disabled={loading}
              aria-label={t("binder:note.label")}
              placeholder={t("binder:note.placeholder")}
              className="min-h-56 resize-y"
              onChange={(event) => setModalDraftNote(event.target.value)}
            />
          ) : (
            <p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm leading-6">
              {displayedNote}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalDraftNote(note);
                setIsModalOpen(false);
              }}
            >
              {isOwner ? t("common:cancel") : t("common:ok")}
            </Button>
            {isOwner && (
              <Button
                type="button"
                isLoading={loading}
                onClick={async () => {
                  const didSave = await handleSaveNote(modalDraftNote);
                  if (didSave) {
                    setIsModalOpen(false);
                  }
                }}
              >
                {t("binder:note.save")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
