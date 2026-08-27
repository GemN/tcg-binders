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
import type { BinderEditing } from "@/lib/binderEditing";
import {
  isBinderEditingCoherenceError,
  presentBinderEditingError,
} from "@/lib/binderEditing";

interface BinderNoteProps {
  binderEditing?: BinderEditing;
  note: string;
  onCoherenceFailure?: () => void;
}

const normalizeBinderNote = (note: string): string => note.trim();

export const BinderNote = ({
  binderEditing,
  note,
  onCoherenceFailure,
}: BinderNoteProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const [modalDraftNote, setModalDraftNote] = useState(note);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompactClamped, setIsCompactClamped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedNoteAfterRefreshFailure, setSavedNoteAfterRefreshFailure] =
    useState<string | null>(null);

  const displayedNote = normalizeBinderNote(
    savedNoteAfterRefreshFailure ?? note
  );
  const canShowNote = !!binderEditing || !!displayedNote;
  const compactText = displayedNote || t("binder:note.placeholder");
  const isPlaceholder = !displayedNote;

  const handleClampChange = useCallback(
    (nextIsClamped: boolean) => setIsCompactClamped(nextIsClamped),
    []
  );

  useEffect(() => {
    setSavedNoteAfterRefreshFailure(null);
  }, [note]);

  useEffect(() => {
    if (!isModalOpen) {
      setModalDraftNote(displayedNote);
    }
  }, [displayedNote, isModalOpen]);

  if (!canShowNote) return null;

  const handleSaveNote = async (nextNote: string): Promise<boolean> => {
    if (loading) return false;

    const normalizedNote = normalizeBinderNote(nextNote);
    if (normalizedNote === displayedNote) {
      setModalDraftNote(displayedNote);
      return true;
    }

    try {
      setLoading(true);
      await binderEditing?.updateBinderNote(normalizedNote);
      setModalDraftNote(normalizedNote);
      return true;
    } catch (error) {
      presentBinderEditingError(error, {
        fallbackMessage: t("binder:note.update_error"),
        reasonMessages: {
          coherence_failed: t("binder:editing.coherence_failed"),
        },
      });
      if (isBinderEditingCoherenceError(error)) {
        setSavedNoteAfterRefreshFailure(normalizedNote);
        setModalDraftNote(normalizedNote);
        onCoherenceFailure?.();
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setModalDraftNote(displayedNote);
    setIsModalOpen(true);
  };

  return (
    <div className="mt-4 max-w-xl">
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

          {binderEditing ? (
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
              {binderEditing ? t("common:cancel") : t("common:ok")}
            </Button>
            {binderEditing && (
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
