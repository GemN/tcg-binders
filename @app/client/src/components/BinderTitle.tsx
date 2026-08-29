import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { BinderEditing } from "@/lib/binderEditing";
import {
  isBinderEditingCoherenceError,
  presentBinderEditingError,
} from "@/lib/binderEditing";

interface BinderTitleProps {
  binderEditing?: BinderEditing;
  name: string;
  onCoherenceFailure?: () => void;
}

export const BinderTitle = ({
  binderEditing,
  name,
  onCoherenceFailure,
}: BinderTitleProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const isSubmittingRef = useRef(false);
  const skipBlurSubmitRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedNameAfterRefreshFailure, setSavedNameAfterRefreshFailure] =
    useState<string | null>(null);

  const displayedName = isEditing
    ? draftName
    : savedNameAfterRefreshFailure ?? name;

  useEffect(() => {
    setSavedNameAfterRefreshFailure(null);
  }, [name]);

  useEffect(() => {
    if (isEditing) return;
    setDraftName("");
  }, [isEditing, name]);

  useEffect(() => {
    if (!isEditing) return;

    const titleInput = titleInputRef.current;
    if (!titleInput) return;

    const titleLength = titleInput.value.length;
    titleInput.focus();
    titleInput.setSelectionRange(titleLength, titleLength);
  }, [isEditing]);

  if (!binderEditing) {
    return (
      <h1 className="font-display truncate text-[32px] font-semibold leading-[1.3] tracking-normal text-primary md:text-[40px]">
        {displayedName}
      </h1>
    );
  }

  const handleStartRenameBinder = () => {
    if (loading || isEditing) return;

    setDraftName(name);
    setIsEditing(true);
  };

  const handleCancelRenameBinder = () => {
    skipBlurSubmitRef.current = true;
    setDraftName("");
    setIsEditing(false);
  };

  const handleRenameBinder = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (loading || isSubmittingRef.current) return;

    const nextName = draftName.trim();

    if (nextName === name) {
      handleCancelRenameBinder();
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      await binderEditing.renameBinder(nextName);
      skipBlurSubmitRef.current = true;
      setIsEditing(false);
      setDraftName("");
    } catch (error) {
      presentBinderEditingError(error, {
        fallbackMessage: t("binder:rename_error"),
        reasonMessages: {
          coherence_failed: t("binder:editing.coherence_failed"),
          name_required: t("binder:rename_name_required"),
        },
      });
      if (isBinderEditingCoherenceError(error)) {
        skipBlurSubmitRef.current = true;
        setSavedNameAfterRefreshFailure(nextName);
        setIsEditing(false);
        setDraftName("");
        onCoherenceFailure?.();
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <form className="min-w-0" onSubmit={handleRenameBinder}>
      <input
        ref={titleInputRef}
        type="text"
        value={displayedName}
        size={Math.max(displayedName.length, 1)}
        disabled={loading}
        readOnly={!isEditing}
        aria-label={t("binder:rename_label")}
        className="font-display block field-sizing-content h-auto min-w-[1ch] max-w-full cursor-text truncate rounded-none border-0 border-b border-dotted border-transparent bg-transparent p-0 text-[32px] font-semibold leading-none tracking-normal text-binder-toolbar-foreground shadow-none outline-none transition-colors hover:border-binder-toolbar-foreground focus:border-binder-toolbar-foreground focus-visible:ring-0 disabled:opacity-60 md:text-[40px]"
        onBlur={() => {
          if (skipBlurSubmitRef.current) {
            skipBlurSubmitRef.current = false;
            return;
          }

          void handleRenameBinder();
        }}
        onChange={(event) => setDraftName(event.target.value)}
        onFocus={handleStartRenameBinder}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;

          event.preventDefault();
          handleCancelRenameBinder();
        }}
      />
    </form>
  );
};
