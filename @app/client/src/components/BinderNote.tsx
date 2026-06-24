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
  onUpdated?: () => Promise<unknown> | unknown;
}

const normalizeBinderNote = (note: string): string => note.trim();

export const BinderNote = ({
  binderId,
  isOwner,
  note,
  onUpdated,
}: BinderNoteProps) => {
  const { t } = useTranslation(["common"]);
  const [modalDraftNote, setModalDraftNote] = useState(note);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompactClamped, setIsCompactClamped] = useState(false);
  const [updateBinderNote, { loading }] = useUpdateBinderNoteMutation();

  const displayedNote = normalizeBinderNote(note);
  const canShowNote = isOwner || !!displayedNote;
  const compactText = displayedNote || t("common:binder.note.placeholder");
  const isPlaceholder = !displayedNote;

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
      const result = await updateBinderNote({
        variables: {
          id: binderId,
          note: normalizedNote,
        },
      });

      if (!result.data?.updateBindersCollection.affectedCount) {
        throw new Error(t("common:binder.note.update_error"));
      }

      setModalDraftNote(normalizedNote);
      await onUpdated?.();
      return true;
    } catch (error) {
      handleError(error, t("common:binder.note.update_error"));
      return false;
    }
  };

  const handleOpenModal = () => {
    setModalDraftNote(displayedNote);
    setIsModalOpen(true);
  };

  const handleClampChange = useCallback(
    (nextIsClamped: boolean) => setIsCompactClamped(nextIsClamped),
    []
  );

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
          className={isPlaceholder ? "text-muted-foreground" : ""}
          indicator={
            displayedNote ? t("common:binder.note.show_more") : undefined
          }
          indicatorClassName="group-hover:underline group-hover:decoration-dotted"
          onClampChange={handleClampChange}
          shouldMeasure={!!displayedNote}
        >
          {compactText}
        </ClampedText>
      </button>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("common:binder.note.title")}</DialogTitle>
          </DialogHeader>

          {isOwner ? (
            <Textarea
              value={modalDraftNote}
              disabled={loading}
              aria-label={t("common:binder.note.label")}
              placeholder={t("common:binder.note.placeholder")}
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
                {t("common:binder.note.save")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
