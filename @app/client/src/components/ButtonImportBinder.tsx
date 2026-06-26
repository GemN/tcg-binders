import {
  type BinderCardsInsertInput,
  useAddBinderCardsMutation,
  useCardsForBinderImportLazyQuery,
} from "@app/graphql";
import { Upload } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
  type BinderImportFormat,
  type BinderImportCardRecord,
  type BinderImportLookupBatch,
  type BinderImportParseResult,
  type BinderImportResolveResult,
  createBinderImportLookupBatches,
  createBinderImportObjects,
  parseBinderImportText,
  parseManaBoxCsvImport,
  resolveBinderImportItems,
} from "@/lib/import";
import { handleError } from "@/lib/error";

interface ButtonImportBinderProps {
  binderId: string;
  onImported: () => Promise<unknown> | unknown;
  tcgId: string;
}

interface BinderImportResult {
  failedInsertCount: number;
  importedCount: number;
  parseResult: BinderImportParseResult;
  resolveResult: BinderImportResolveResult;
}

interface BinderImportProgress {
  completed: number;
  stage: "importing" | "matching";
  total: number;
}

const importChunkSize = 50;

export const ButtonImportBinder = ({
  binderId,
  onImported,
  tcgId,
}: ButtonImportBinderProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const manaBoxFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const [importResult, setImportResult] = useState<BinderImportResult | null>(
    null
  );
  const [importProgress, setImportProgress] =
    useState<BinderImportProgress | null>(null);
  const [loadCards, { loading: isLoadingCards }] =
    useCardsForBinderImportLazyQuery({
      fetchPolicy: "network-only",
    });
  const [addBinderCards, { loading: isImportingCards }] =
    useAddBinderCardsMutation();
  const isImporting = isLoadingCards || isImportingCards;

  const resetState = () => {
    setInput("");
    setValidationError("");
    setImportResult(null);
    setImportProgress(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const insertBinderCards = async (
    objects: BinderCardsInsertInput[],
    onProgress: (completed: number) => void
  ): Promise<{ failedInsertCount: number; importedCount: number }> => {
    let failedInsertCount = 0;
    let importedCount = 0;

    for (let index = 0; index < objects.length; index += importChunkSize) {
      const chunk = objects.slice(index, index + importChunkSize);

      try {
        await addBinderCards({ variables: { objects: chunk } });
        importedCount += chunk.length;
        onProgress(importedCount + failedInsertCount);
      } catch (chunkError) {
        if (chunk.length === 1) {
          failedInsertCount += 1;
          console.error(chunkError);
          onProgress(importedCount + failedInsertCount);
          continue;
        }

        for (const object of chunk) {
          try {
            await addBinderCards({ variables: { objects: [object] } });
            importedCount += 1;
          } catch (itemError) {
            failedInsertCount += 1;
            console.error(itemError);
          }
          onProgress(importedCount + failedInsertCount);
        }
      }
    }

    return { failedInsertCount, importedCount };
  };

  const loadCardsForImport = async (
    batches: BinderImportLookupBatch[],
    onProgress: (completed: number) => void
  ): Promise<BinderImportCardRecord[]> => {
    const cardsById = new Map<string, BinderImportCardRecord>();
    let completedItems = 0;

    for (const batch of batches) {
      let after: string | null | undefined;
      let hasNextPage = true;

      while (hasNextPage) {
        const result = await loadCards({
          variables: {
            after,
            filter: batch.filter,
            first: batch.first,
          },
        });
        const collection = result.data?.cardsCollection;

        collection?.edges.forEach(({ node }) => {
          cardsById.set(node.id, node);
        });

        after = collection?.pageInfo.endCursor;
        hasNextPage = !!collection?.pageInfo.hasNextPage && !!after;
      }

      completedItems += batch.items.length;
      onProgress(completedItems);
    }

    return [...cardsById.values()];
  };

  const handleImport = async (
    format: BinderImportFormat,
    sourceText: string
  ) => {
    const value = sourceText.trim();
    if (!value) {
      setValidationError(
        format === "manabox_csv"
          ? t("binder:import.empty_csv")
          : t("binder:import.empty")
      );
      return;
    }

    const parseResult =
      format === "manabox_csv"
        ? parseManaBoxCsvImport(value)
        : parseBinderImportText(value);

    if (parseResult.items.length === 0) {
      setImportResult(null);
      setValidationError(t("binder:import.no_parseable_cards"));
      return;
    }

    try {
      setValidationError("");
      setImportResult(null);
      const lookupBatches = createBinderImportLookupBatches(
        parseResult.items,
        tcgId
      );
      setImportProgress({
        completed: 0,
        stage: "matching",
        total: parseResult.items.length,
      });
      const cards = await loadCardsForImport(lookupBatches, (completed) => {
        setImportProgress({
          completed,
          stage: "matching",
          total: parseResult.items.length,
        });
      });
      const resolveResult = resolveBinderImportItems(parseResult.items, cards);
      const objects = createBinderImportObjects({
        binderId,
        items: resolveResult.matchedItems,
        tcgId,
      });

      let insertResult = { failedInsertCount: 0, importedCount: 0 };

      if (objects.length > 0) {
        setImportProgress({
          completed: 0,
          stage: "importing",
          total: objects.length,
        });
        insertResult = await insertBinderCards(objects, (completed) => {
          setImportProgress({
            completed,
            stage: "importing",
            total: objects.length,
          });
        });
      }

      if (insertResult.importedCount > 0) {
        await onImported();
      }

      setImportResult({
        failedInsertCount: insertResult.failedInsertCount,
        importedCount: insertResult.importedCount,
        parseResult,
        resolveResult,
      });
      setImportProgress(null);
    } catch (error) {
      setImportProgress(null);
      handleError(error, t("binder:import.error"));
    }
  };

  const handleImportText = () => {
    void handleImport("text", input);
  };

  const handlePickManaBoxCsv = () => {
    manaBoxFileInputRef.current?.click();
  };

  const handleManaBoxFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const csvText = await file.text();
      await handleImport("manabox_csv", csvText);
    } catch (error) {
      handleError(error, t("binder:import.error"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-9 px-2 sm:px-3">
          <Upload className="size-4" />
          {t("binder:import.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("binder:import.title")}</DialogTitle>
          <DialogDescription>
            {t("binder:import.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="binder-import-input">
            {t("binder:import.label")}
          </Label>
          <Textarea
            id="binder-import-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setValidationError("");
              setImportResult(null);
            }}
            rows={12}
            className="max-h-80 min-h-60 resize-y overflow-y-auto field-sizing-fixed font-mono text-sm"
            placeholder={t("binder:import.placeholder")}
            disabled={isImporting}
          />
          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
          {importProgress && (
            <p className="text-sm text-muted-foreground">
              {t(`binder:import.progress.${importProgress.stage}`, {
                completed: importProgress.completed,
                total: importProgress.total,
              })}
            </p>
          )}
        </div>

        {importResult && (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
            <p className="font-medium text-foreground">
              {t("binder:import.imported_count", {
                count: importResult.importedCount,
              })}
            </p>
            <p className="mt-1 text-muted-foreground">
              {t("binder:import.skipped_count", {
                count:
                  importResult.resolveResult.unmatchedItems.length +
                  importResult.parseResult.rejectedLines.length +
                  importResult.failedInsertCount,
              })}
            </p>
            {importResult.failedInsertCount > 0 && (
              <p className="mt-1 text-muted-foreground">
                {t("binder:import.failed_insert_count", {
                  count: importResult.failedInsertCount,
                })}
              </p>
            )}
            {importResult.resolveResult.unmatchedItems.length > 0 && (
              <p className="mt-2 text-muted-foreground">
                {t("binder:import.unmatched_preview", {
                  names: importResult.resolveResult.unmatchedItems
                    .slice(0, 3)
                    .map((item) => item.name)
                    .join(", "),
                })}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isImporting}
            onClick={() => setIsOpen(false)}
          >
            {t("common:cancel")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isImporting}
            onClick={handlePickManaBoxCsv}
          >
            {t("binder:import.manabox_csv")}
          </Button>
          <input
            ref={manaBoxFileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => void handleManaBoxFileChange(event)}
          />
          <Button
            type="button"
            isLoading={isImporting}
            onClick={handleImportText}
          >
            {t("binder:import.import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
