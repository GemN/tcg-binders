import type { BinderEditingBulkOutcome } from "./types.ts";

export interface BinderEditingPageAccessRequest {
  isOwner: boolean;
  isPublicPreview: boolean;
  requiresReload: boolean;
}

export interface BinderEditingPageAccess {
  canMutateBinder: boolean;
  canShowOwnerMetadata: boolean;
  canUseCommerce: boolean;
}

export const getBinderEditingPageAccess = ({
  isOwner,
  isPublicPreview,
  requiresReload,
}: BinderEditingPageAccessRequest): BinderEditingPageAccess => ({
  canMutateBinder: isOwner && !isPublicPreview && !requiresReload,
  canShowOwnerMetadata: isOwner && !isPublicPreview,
  canUseCommerce: !isOwner || isPublicPreview,
});

export const getAppliedBinderCardIds = (
  requestedBinderCardIds: string[],
  outcome: Pick<BinderEditingBulkOutcome, "failedIndexes">
): string[] => {
  const failedIndexes = new Set(outcome.failedIndexes);
  return requestedBinderCardIds.filter((_, index) => !failedIndexes.has(index));
};

export const addLocallyDeletedBinderCardIds = (
  currentIds: ReadonlySet<string>,
  appliedIds: string[]
): Set<string> => new Set([...currentIds, ...appliedIds]);

export const excludeLocallyDeletedBinderCards = <T extends { id: string }>(
  binderCards: T[],
  locallyDeletedIds: ReadonlySet<string>
): T[] => binderCards.filter((binderCard) => !locallyDeletedIds.has(binderCard.id));

export interface BinderCardCountAdjustment {
  appliedBinderCardIds: ReadonlySet<string>;
  filterKey: string;
  sourceCount: number;
}

export interface CreateBinderCardCountAdjustmentRequest {
  appliedBinderCardIds: string[];
  filterKey: string;
  sourceCount: number;
}

export const createBinderCardCountAdjustment = ({
  appliedBinderCardIds,
  filterKey,
  sourceCount,
}: CreateBinderCardCountAdjustmentRequest): BinderCardCountAdjustment => ({
  appliedBinderCardIds: new Set(appliedBinderCardIds),
  filterKey,
  sourceCount,
});

const getCountAfterAppliedDeletes = (
  adjustment: BinderCardCountAdjustment
): number => {
  return Math.max(
    adjustment.sourceCount - adjustment.appliedBinderCardIds.size,
    0
  );
};

export const reconcileBinderCardCountAdjustment = (
  remoteCount: number,
  adjustment: BinderCardCountAdjustment | null,
  currentFilterKey: string
): BinderCardCountAdjustment | null => {
  if (!adjustment || adjustment.filterKey !== currentFilterKey) {
    return adjustment;
  }

  return remoteCount <= getCountAfterAppliedDeletes(adjustment)
    ? null
    : adjustment;
};

export const getLocallyAdjustedBinderCardCount = (
  remoteCount: number,
  adjustment: BinderCardCountAdjustment | null,
  currentFilterKey: string
): number => {
  if (!adjustment || adjustment.filterKey !== currentFilterKey) {
    return remoteCount;
  }

  const appliedCount = adjustment.appliedBinderCardIds.size;
  const countAfterAppliedDeletes = getCountAfterAppliedDeletes(adjustment);
  const unresolvedDeleteCount = Math.min(
    appliedCount,
    Math.max(remoteCount - countAfterAppliedDeletes, 0)
  );

  return Math.max(remoteCount - unresolvedDeleteCount, 0);
};
