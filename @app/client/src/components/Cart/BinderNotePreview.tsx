import { useTranslation } from "react-i18next";

interface BinderNotePreviewProps {
  note: string;
}

export const BinderNotePreview = ({ note }: BinderNotePreviewProps) => {
  const { t } = useTranslation(["checkout"]);
  const displayedNote = note.trim();

  if (!displayedNote) return null;

  return (
    <div className="border-t border-border bg-muted/35 px-3 py-3 lg:px-4">
      <p className="text-sm font-semibold text-foreground">
        {t("checkout:binder_note")}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {displayedNote}
      </p>
    </div>
  );
};
