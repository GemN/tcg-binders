import {
  binderEditingDomainDefaults,
  type BinderEditing,
  type BinderEditingAddCardsRequest,
  type BinderEditingBulkOutcome,
  type BinderEditingCardInput,
  type BinderEditingCardUpdate,
  BinderEditingCoherenceError,
  BinderEditingError,
} from "./types.ts";

const ADD_CHUNK_SIZE = 50;
const BULK_CONCURRENCY = 4;

const getPreferredFinish = (finishes: string[]): string => {
  return finishes.includes("normal") ? "normal" : finishes[0] || "normal";
};

export interface BinderEditingWriteResult<TUpdatedCard = never> {
  applied: boolean;
  updatedCard?: TUpdatedCard;
}

export interface BinderEditingNormalizedCardInput
  extends BinderEditingCardInput {
  finish: string;
  note: string;
  quantity: number;
}

export interface BinderEditingBackend<TUpdatedCard = never> {
  addCards: (cards: BinderEditingNormalizedCardInput[]) => Promise<void>;
  cohere: (updatedCard?: TUpdatedCard) => Promise<void>;
  removeCard: (binderCardId: string) => Promise<boolean>;
  renameBinder: (name: string) => Promise<boolean>;
  updateBinderNote: (note: string) => Promise<boolean>;
  updateCard: (
    binderCardId: string,
    update: BinderEditingCardUpdate
  ) => Promise<BinderEditingWriteResult<TUpdatedCard>>;
}

export interface CreateBinderEditingParams<TUpdatedCard = never> {
  backend: BinderEditingBackend<TUpdatedCard>;
}

const createBulkOutcome = (): BinderEditingBulkOutcome => ({
  applied: 0,
  failed: 0,
  failedIndexes: [],
  skipped: 0,
});

const runWrite = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof BinderEditingError) throw error;
    throw new BinderEditingError("write_failed", error);
  }
};

const runCohere = async <TUpdatedCard>(
  backend: BinderEditingBackend<TUpdatedCard>,
  updatedCard?: TUpdatedCard,
  outcome?: BinderEditingBulkOutcome
): Promise<void> => {
  try {
    await backend.cohere(updatedCard);
  } catch (error) {
    throw new BinderEditingCoherenceError(error, outcome);
  }
};

const normalizeCardInput = (
  card: BinderEditingCardInput
): BinderEditingNormalizedCardInput => {
  if (!card.card.id) throw new BinderEditingError("invalid_card");

  const quantity = card.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new BinderEditingError("invalid_quantity");
  }

  if (card.priceAmount !== undefined && card.priceAmount !== null) {
    const amount = Number(card.priceAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BinderEditingError("invalid_price");
    }
  }

  return {
    ...card,
    finish: card.finish || getPreferredFinish(card.card.finishes),
    note: card.note?.trim() || "",
    quantity,
  };
};

const normalizeCardUpdate = (
  update: BinderEditingCardUpdate
): BinderEditingCardUpdate => {
  if (
    update.quantity !== undefined &&
    (!Number.isInteger(update.quantity) || update.quantity < 1)
  ) {
    throw new BinderEditingError("invalid_quantity");
  }

  if (update.priceAmount !== undefined && update.priceAmount !== null) {
    const amount = Number(update.priceAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BinderEditingError("invalid_price");
    }
  }

  return {
    ...update,
    note: update.note?.trim() ?? update.note,
  };
};

const runWithConcurrency = async <T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>
) => {
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(BULK_CONCURRENCY, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        await worker(items[index], index);
      }
    }
  );

  await Promise.all(workers);
};

const addCards = async <TUpdatedCard>(
  backend: BinderEditingBackend<TUpdatedCard>,
  { cards, onProgress }: BinderEditingAddCardsRequest
): Promise<BinderEditingBulkOutcome> => {
  const outcome = createBulkOutcome();
  const normalizedCards = cards.flatMap((card, originalIndex) => {
    try {
      return [{ card: normalizeCardInput(card), originalIndex }];
    } catch {
      outcome.failed += 1;
      outcome.failedIndexes.push(originalIndex);
      onProgress?.({ completed: outcome.failed, total: cards.length });
      return [];
    }
  });

  for (let index = 0; index < normalizedCards.length; index += ADD_CHUNK_SIZE) {
    const cardChunk = normalizedCards.slice(index, index + ADD_CHUNK_SIZE);

    try {
      await backend.addCards(cardChunk.map(({ card }) => card));
      outcome.applied += cardChunk.length;
      onProgress?.({
        completed: outcome.applied + outcome.failed,
        total: cards.length,
      });
    } catch {
      if (cardChunk.length === 1) {
        outcome.failed += 1;
        outcome.failedIndexes.push(cardChunk[0].originalIndex);
        onProgress?.({
          completed: outcome.applied + outcome.failed,
          total: cards.length,
        });
        continue;
      }

      for (let cardIndex = 0; cardIndex < cardChunk.length; cardIndex += 1) {
        try {
          await backend.addCards([cardChunk[cardIndex].card]);
          outcome.applied += 1;
        } catch {
          outcome.failed += 1;
          outcome.failedIndexes.push(cardChunk[cardIndex].originalIndex);
        }

        onProgress?.({
          completed: outcome.applied + outcome.failed,
          total: cards.length,
        });
      }
    }
  }

  outcome.failedIndexes.sort((left, right) => left - right);
  if (outcome.applied > 0) {
    await runCohere(backend, undefined, outcome);
  }
  return outcome;
};

export const createBinderEditing = <TUpdatedCard>({
  backend,
}: CreateBinderEditingParams<TUpdatedCard>): BinderEditing => ({
  addCard: async (card) => {
    normalizeCardInput(card);
    const outcome = await addCards(backend, { cards: [card] });
    if (outcome.applied !== 1) throw new BinderEditingError("write_failed");
  },
  addCards: (request) => addCards(backend, request),
  applyCardKingdomMultiplier: async ({ cards, multiplier }) => {
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      throw new BinderEditingError("invalid_multiplier");
    }

    const outcome = createBulkOutcome();
    await runWithConcurrency(cards, async (card, index) => {
      if (card.sourcePriceAmount === null) {
        outcome.skipped += 1;
        return;
      }

      if (
        !Number.isFinite(card.sourcePriceAmount) ||
        card.sourcePriceAmount < 0
      ) {
        outcome.failed += 1;
        outcome.failedIndexes.push(index);
        return;
      }

      const nextPriceAmount = card.sourcePriceAmount * multiplier;
      if (!Number.isFinite(nextPriceAmount) || nextPriceAmount < 0) {
        outcome.failed += 1;
        outcome.failedIndexes.push(index);
        return;
      }

      const priceAmount = nextPriceAmount.toFixed(2);
      try {
        const result = await backend.updateCard(card.binderCardId, {
          dynamicPriceRule: null,
          priceAmount,
          priceCurrency: binderEditingDomainDefaults.currency,
        });
        if (!result.applied) throw new BinderEditingError("write_failed");
        outcome.applied += 1;
      } catch {
        outcome.failed += 1;
        outcome.failedIndexes.push(index);
      }
    });

    outcome.failedIndexes.sort((left, right) => left - right);
    if (outcome.applied > 0) {
      await runCohere(backend, undefined, outcome);
    }
    return outcome;
  },
  removeCard: async (binderCardId) => {
    if (!binderCardId) throw new BinderEditingError("card_not_found");
    await runWrite(async () => {
      if (!(await backend.removeCard(binderCardId))) {
        throw new BinderEditingError("card_not_found");
      }
    });
    await runCohere(backend);
  },
  removeCards: async (binderCardIds) => {
    const outcome = createBulkOutcome();
    await runWithConcurrency(binderCardIds, async (binderCardId, index) => {
      try {
        if (!(await backend.removeCard(binderCardId))) {
          throw new BinderEditingError("card_not_found");
        }
        outcome.applied += 1;
      } catch {
        outcome.failed += 1;
        outcome.failedIndexes.push(index);
      }
    });

    if (outcome.applied > 0) {
      await runCohere(backend, undefined, outcome);
    }
    return outcome;
  },
  renameBinder: async (name) => {
    const normalizedName = name.trim();
    if (!normalizedName) throw new BinderEditingError("name_required");
    await runWrite(async () => {
      if (!(await backend.renameBinder(normalizedName))) {
        throw new BinderEditingError("write_failed");
      }
    });
    await runCohere(backend);
  },
  updateBinderNote: async (note) => {
    const normalizedNote = note.trim();
    await runWrite(async () => {
      if (!(await backend.updateBinderNote(normalizedNote))) {
        throw new BinderEditingError("write_failed");
      }
    });
    await runCohere(backend);
  },
  updateCard: async (binderCardId, update) => {
    if (!binderCardId) throw new BinderEditingError("card_not_found");
    const result = await runWrite(async () => {
      const writeResult = await backend.updateCard(
        binderCardId,
        normalizeCardUpdate(update)
      );
      if (!writeResult.applied) throw new BinderEditingError("card_not_found");
      return writeResult;
    });
    await runCohere(backend, result.updatedCard);
  },
});
