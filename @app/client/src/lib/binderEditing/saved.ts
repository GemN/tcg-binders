import {
  type BinderCardDetailFieldsFragment,
  useAddBinderCardsMutation,
  useDeleteBinderCardMutation,
  useRenameBinderMutation,
  useUpdateBinderCardMutation,
  useUpdateBinderNoteMutation,
} from "@app/graphql";
import { useMemo } from "react";

import {
  createSavedBinderEditingAdapter,
  type SavedBinderEditingWrites,
} from "./savedAdapter";
import type { BinderEditing } from "./types";

export interface UseSavedBinderEditingParams {
  binderId: string;
  onCardUpdated?: (binderCard: BinderCardDetailFieldsFragment) => void;
  refresh: () => Promise<unknown> | unknown;
  tcgId: string;
}

export const useSavedBinderEditing = ({
  binderId,
  onCardUpdated,
  refresh,
  tcgId,
}: UseSavedBinderEditingParams): BinderEditing => {
  const [addBinderCards] = useAddBinderCardsMutation();
  const [deleteBinderCard] = useDeleteBinderCardMutation();
  const [renameBinder] = useRenameBinderMutation();
  const [updateBinderCard] = useUpdateBinderCardMutation();
  const [updateBinderNote] = useUpdateBinderNoteMutation();

  return useMemo(() => {
    const writes: SavedBinderEditingWrites = {
      addCards: async (objects) => {
        const result = await addBinderCards({ variables: { objects } });
        return result.data?.insertIntoBinderCardsCollection?.records.length ?? 0;
      },
      removeCard: async (binderCardId) => {
        const result = await deleteBinderCard({
          variables: { id: binderCardId },
        });
        return result.data?.deleteFromBinderCardsCollection?.affectedCount ?? 0;
      },
      renameBinder: async (id, name) => {
        const result = await renameBinder({ variables: { id, name } });
        return result.data?.updateBindersCollection.affectedCount ?? 0;
      },
      updateBinderNote: async (id, note) => {
        const result = await updateBinderNote({ variables: { id, note } });
        return result.data?.updateBindersCollection.affectedCount ?? 0;
      },
      updateCard: async (binderCardId, update) => {
        const result = await updateBinderCard({
          variables: { id: binderCardId, set: update },
        });
        return {
          affectedCount:
            result.data?.updateBinderCardsCollection.affectedCount ?? 0,
          record:
            result.data?.updateBinderCardsCollection.records[0] || undefined,
        };
      },
    };

    return createSavedBinderEditingAdapter({
      binderId,
      onCardUpdated,
      refresh,
      tcgId,
      writes,
    });
  }, [
    addBinderCards,
    binderId,
    deleteBinderCard,
    onCardUpdated,
    refresh,
    renameBinder,
    tcgId,
    updateBinderCard,
    updateBinderNote,
  ]);
};
