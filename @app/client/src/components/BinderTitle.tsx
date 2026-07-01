import { useRenameBinderMutation } from "@app/graphql";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { handleError } from "@/lib/error";

interface BinderTitleProps {
  binderId: string;
  isOwner: boolean;
  name: string;
  onRename?: (name: string) => Promise<unknown> | unknown;
  onRenamed?: () => Promise<unknown> | unknown;
}

export const BinderTitle = ({
  binderId,
  isOwner,
  name,
  onRename,
  onRenamed,
}: BinderTitleProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const isSubmittingRef = useRef(false);
  const skipBlurSubmitRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [renameBinder, { loading: isRenamingRemote }] =
    useRenameBinderMutation();
  const [isRenamingLocal, setIsRenamingLocal] = useState(false);
  const loading = isRenamingRemote || isRenamingLocal;

  const displayedName = isEditing ? draftName : name;

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

  if (!isOwner) {
    return (
      <h1 className="font-display truncate text-2xl font-semibold tracking-normal text-binder-toolbar-foreground sm:text-3xl">
        {name}
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
    if (!nextName) {
      handleError(
        new Error(t("binder:rename_name_required")),
        t("binder:rename_error")
      );
      return;
    }

    if (nextName === name) {
      handleCancelRenameBinder();
      return;
    }

    isSubmittingRef.current = true;

    try {
      if (onRename) {
        setIsRenamingLocal(true);
        await onRename(nextName);
      } else {
        const result = await renameBinder({
          variables: {
            id: binderId,
            name: nextName,
          },
        });

        if (!result.data?.updateBindersCollection.affectedCount) {
          throw new Error(t("binder:rename_error"));
        }
      }

      await onRenamed?.();
      skipBlurSubmitRef.current = true;
      setIsEditing(false);
      setDraftName("");
    } catch (error) {
      handleError(error, t("binder:rename_error"));
    } finally {
      setIsRenamingLocal(false);
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
        className="font-display block field-sizing-content h-auto min-w-[1ch] max-w-full cursor-text truncate rounded-none border-0 border-b border-dotted border-transparent bg-transparent p-0 text-2xl font-semibold tracking-normal text-binder-toolbar-foreground shadow-none outline-none transition-colors hover:border-binder-toolbar-foreground focus:border-binder-toolbar-foreground focus-visible:ring-0 disabled:opacity-60 sm:text-3xl"
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
