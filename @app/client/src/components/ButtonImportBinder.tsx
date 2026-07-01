import {
  useAddBinderCardsMutation,
  useCardsForBinderImportLazyQuery,
} from "@app/graphql";
import {
  CheckCircle2,
  FileText,
  Keyboard,
  Table2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
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
import { Dropzone } from "@/components/ui/Dropzone";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import {
  type BinderImportCardRecord,
  type BinderImportFormat,
  type BinderImportLookupBatch,
  type BinderImportParseResult,
  type BinderImportResolvedItem,
  type BinderImportResolveResult,
  createBinderImportLookupBatches,
  createBinderImportObjects,
  parseBinderImportText,
  parseManaBoxCsvImport,
  resolveBinderImportItems,
} from "@/lib/import";

interface ButtonImportBinderProps {
  binderId: string;
  onImportCards?: ImportBinderCardsHandler;
  onImported: () => Promise<unknown> | unknown;
  tcgId: string;
}

export interface ImportBinderCardsResult {
  failedInsertCount: number;
  failedItems?: BinderImportResolvedItem[];
  importedCount: number;
}

export interface ImportBinderCardsHandlerParams {
  items: BinderImportResolvedItem[];
  onProgress: (completed: number) => void;
  tcgId: string;
}

export type ImportBinderCardsHandler = (
  params: ImportBinderCardsHandlerParams
) => Promise<ImportBinderCardsResult> | ImportBinderCardsResult;

type BinderImportSource = "text" | "manabox_csv" | "text_file";
type BinderImportStep = "input" | "success";

interface BinderImportError {
  issues: BinderImportIssue[];
  title: string;
}

interface BinderImportIssue {
  id: string;
  text: string;
}

interface BinderImportPartialReview {
  issues: BinderImportIssue[];
  matchedItems: BinderImportResolvedItem[];
}

interface BinderImportProgress {
  completed: number;
  stage: "importing" | "matching";
  total: number;
}

interface BinderImportSuccess {
  importedCount: number;
  issues: BinderImportIssue[];
}

const importChunkSize = 50;

const getImportFormat = (source: BinderImportSource): BinderImportFormat => {
  return source === "manabox_csv" ? "manabox_csv" : "text";
};

const getFileAccept = (source: BinderImportSource): string => {
  return source === "manabox_csv" ? ".csv,text/csv" : ".txt,text/plain";
};

interface BinderImportIssueListProps {
  issues: BinderImportIssue[];
  title: string;
}

const BinderImportIssueList = ({
  issues,
  title,
}: BinderImportIssueListProps) => {
  if (issues.length === 0) return null;

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <ul className="grid max-h-48 gap-1 overflow-y-auto text-sm text-muted-foreground">
        {issues.map((issue) => (
          <li key={issue.id}>{issue.text}</li>
        ))}
      </ul>
    </div>
  );
};

interface BinderImportInputViewProps {
  fileAccept: string;
  fileDescription: string;
  fileLabel: string;
  importError: BinderImportError | null;
  importProgress: BinderImportProgress | null;
  importSource: BinderImportSource;
  isImporting: boolean;
  onFileSelect: (file: File) => void;
  onImportSourceChange: (value: string) => void;
  onTextInputChange: (value: string) => void;
  partialReview: BinderImportPartialReview | null;
  textInput: string;
}

const BinderImportInputView = ({
  fileAccept,
  fileDescription,
  fileLabel,
  importError,
  importProgress,
  importSource,
  isImporting,
  onFileSelect,
  onImportSourceChange,
  onTextInputChange,
  partialReview,
  textInput,
}: BinderImportInputViewProps) => {
  const { t } = useTranslation(["binder"]);

  return (
    <div className="grid gap-4">
      <ToggleGroup
        type="single"
        value={importSource}
        variant="outline"
        className="w-full"
        onValueChange={onImportSourceChange}
      >
        <ToggleGroupItem
          value="text"
          disabled={isImporting}
          aria-label={t("binder:import.source.text")}
          className="h-10 px-2 text-foreground hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
        >
          <Keyboard className="size-4" />
          <span className="truncate">{t("binder:import.source.text")}</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="manabox_csv"
          disabled={isImporting}
          aria-label={t("binder:import.source.manabox_csv")}
          className="h-10 px-2 text-foreground hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
        >
          <Table2 className="size-4" />
          <span className="truncate">
            {t("binder:import.source.manabox_csv")}
          </span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="text_file"
          disabled={isImporting}
          aria-label={t("binder:import.source.file_txt")}
          className="h-10 px-2 text-foreground hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
        >
          <FileText className="size-4" />
          <span className="truncate">{t("binder:import.source.file_txt")}</span>
        </ToggleGroupItem>
      </ToggleGroup>

      {importSource === "text" ? (
        <div className="grid gap-2">
          <Label htmlFor="binder-import-input">
            {t("binder:import.label")}
          </Label>
          <Textarea
            id="binder-import-input"
            value={textInput}
            onChange={(event) => onTextInputChange(event.target.value)}
            rows={12}
            className="max-h-80 min-h-60 resize-y overflow-y-auto field-sizing-fixed font-mono text-sm"
            placeholder={t("binder:import.placeholder")}
            disabled={isImporting}
            autoFocus
          />
        </div>
      ) : (
        <div className="grid gap-2">
          <Label>{t("binder:import.file_label")}</Label>
          <Dropzone
            accept={fileAccept}
            description={fileDescription}
            disabled={isImporting}
            label={fileLabel}
            onFileSelect={onFileSelect}
          />
        </div>
      )}

      {importProgress && (
        <p className="text-sm text-muted-foreground">
          {t(`binder:import.progress.${importProgress.stage}`, {
            completed: importProgress.completed,
            total: importProgress.total,
          })}
        </p>
      )}

      {partialReview && (
        <div className="grid gap-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
          <div className="grid gap-1">
            <p className="font-medium text-foreground">
              {t("binder:import.partial_title")}
            </p>
            <p className="text-muted-foreground">
              {t("binder:import.partial_description", {
                count: partialReview.matchedItems.length,
              })}
            </p>
          </div>
          <BinderImportIssueList
            issues={partialReview.issues}
            title={t("binder:import.skipped_cards")}
          />
        </div>
      )}

      {importError && (
        <div
          role="alert"
          className="grid gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm"
        >
          <p className="font-medium text-destructive">{importError.title}</p>
          <BinderImportIssueList
            issues={importError.issues}
            title={t("binder:import.skipped_cards")}
          />
        </div>
      )}
    </div>
  );
};

interface BinderImportSuccessViewProps {
  success: BinderImportSuccess | null;
}

const BinderImportSuccessView = ({ success }: BinderImportSuccessViewProps) => {
  const { t } = useTranslation(["binder"]);

  return (
    <div className="grid gap-3 py-4 text-center">
      <CheckCircle2 className="mx-auto size-10 text-success" />
      <p className="font-medium text-foreground">
        {t("binder:import.imported_count", {
          count: success?.importedCount || 0,
        })}
      </p>
      {success && success.issues.length > 0 && (
        <div className="mt-1 rounded-md border border-border bg-muted/40 p-3 text-left">
          <BinderImportIssueList
            issues={success.issues}
            title={t("binder:import.skipped_cards")}
          />
        </div>
      )}
    </div>
  );
};

export const ButtonImportBinder = ({
  binderId,
  onImportCards,
  onImported,
  tcgId,
}: ButtonImportBinderProps) => {
  const { t } = useTranslation(["binder", "common"]);
  const fileReadTokenRef = useRef(0);
  const importRunningRef = useRef(false);
  const importSourceRef = useRef<BinderImportSource>("text");
  const [isOpen, setIsOpen] = useState(false);
  const [importSource, setImportSource] = useState<BinderImportSource>("text");
  const [importStep, setImportStep] = useState<BinderImportStep>("input");
  const [textInput, setTextInput] = useState("");
  const [fileInput, setFileInput] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importError, setImportError] = useState<BinderImportError | null>(
    null
  );
  const [partialReview, setPartialReview] =
    useState<BinderImportPartialReview | null>(null);
  const [importSuccess, setImportSuccess] =
    useState<BinderImportSuccess | null>(null);
  const [importProgress, setImportProgress] =
    useState<BinderImportProgress | null>(null);
  const [isImportRunning, setIsImportRunning] = useState(false);
  const [loadCards, { loading: isLoadingCards }] =
    useCardsForBinderImportLazyQuery({
      fetchPolicy: "network-only",
    });
  const [addBinderCards, { loading: isImportingCards }] =
    useAddBinderCardsMutation();
  const isImporting = isLoadingCards || isImportingCards || isImportRunning;
  const isFileImportSource = importSource !== "text";

  importSourceRef.current = importSource;

  const resetState = () => {
    fileReadTokenRef.current += 1;
    importSourceRef.current = "text";
    setImportSource("text");
    setImportStep("input");
    setTextInput("");
    setFileInput("");
    setSelectedFileName("");
    setImportError(null);
    setPartialReview(null);
    setImportSuccess(null);
    setImportProgress(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isImporting && !nextOpen) return;

    setIsOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const insertBinderCards = async (
    items: BinderImportResolvedItem[],
    onProgress: (completed: number) => void
  ): Promise<ImportBinderCardsResult> => {
    if (onImportCards) {
      return onImportCards({ items, onProgress, tcgId });
    }

    const objects = createBinderImportObjects({
      binderId,
      items,
      tcgId,
    });
    let failedInsertCount = 0;
    const failedItems: BinderImportResolvedItem[] = [];
    let importedCount = 0;

    for (let index = 0; index < items.length; index += importChunkSize) {
      const itemChunk = items.slice(index, index + importChunkSize);
      const objectChunk = objects.slice(index, index + importChunkSize);

      try {
        await addBinderCards({ variables: { objects: objectChunk } });
        importedCount += objectChunk.length;
        onProgress(importedCount + failedInsertCount);
      } catch (chunkError) {
        if (objectChunk.length === 1) {
          failedInsertCount += 1;
          failedItems.push(itemChunk[0]);
          console.error(chunkError);
          onProgress(importedCount + failedInsertCount);
          continue;
        }

        for (let itemIndex = 0; itemIndex < objectChunk.length; itemIndex += 1) {
          try {
            await addBinderCards({
              variables: { objects: [objectChunk[itemIndex]] },
            });
            importedCount += 1;
          } catch (itemError) {
            failedInsertCount += 1;
            failedItems.push(itemChunk[itemIndex]);
            console.error(itemError);
          }
          onProgress(importedCount + failedInsertCount);
        }
      }
    }

    return { failedInsertCount, failedItems, importedCount };
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

  const getRejectedLineReasonLabel = (reason: string): string => {
    switch (reason) {
      case "Invalid quantity":
        return t("binder:import.errors.reason.invalid_quantity");
      case "Missing CSV header":
        return t("binder:import.errors.reason.missing_csv_header");
      case "Missing card name":
        return t("binder:import.errors.reason.missing_card_name");
      case "Unsupported line format":
        return t("binder:import.errors.reason.unsupported_line_format");
      default:
        return t("binder:import.errors.reason.unknown");
    }
  };

  const buildRejectedLineIssues = (
    parseResult: BinderImportParseResult
  ): BinderImportIssue[] => {
    return parseResult.rejectedLines.map((line, index) => ({
      id: `rejected-${line.line}-${index}`,
      text: t("binder:import.errors.rejected_line", {
        line: line.line,
        reason: getRejectedLineReasonLabel(line.reason),
        value: line.value,
      }),
    }));
  };

  const buildUnmatchedItemIssues = (
    resolveResult: BinderImportResolveResult
  ): BinderImportIssue[] => {
    return resolveResult.unmatchedItems.map((item, index) => ({
      id: `unmatched-${item.sourceLine}-${index}`,
      text: t("binder:import.errors.unmatched_item", {
        line: item.sourceLine,
        name: item.name,
      }),
    }));
  };

  const buildFailedInsertIssues = (
    items: BinderImportResolvedItem[] | undefined,
    failedInsertCount: number
  ): BinderImportIssue[] => {
    if (!items?.length) {
      return [
        {
          id: "failed-insert-count",
          text: t("binder:import.failed_insert_count", {
            count: failedInsertCount,
          }),
        },
      ];
    }

    return items.map(({ item }, index) => ({
      id: `failed-insert-${item.sourceLine}-${index}`,
      text: t("binder:import.errors.insert_item", {
        line: item.sourceLine,
        name: item.name,
      }),
    }));
  };

  const getEmptyImportErrorTitle = () => {
    if (importSource === "text") {
      return t("binder:import.empty");
    }

    if (!selectedFileName) {
      return t("binder:import.errors.select_file");
    }

    return importSource === "manabox_csv"
      ? t("binder:import.empty_csv")
      : t("binder:import.errors.empty_txt");
  };

  const runWithImportGuard = async (operation: () => Promise<void>) => {
    if (importRunningRef.current) return;

    importRunningRef.current = true;
    setIsImportRunning(true);

    try {
      await operation();
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));

      console.error(error);
      setImportError({
        issues: [
          {
            id: "unknown-import-error",
            text: errorObj.message || t("binder:import.error"),
          },
        ],
        title: t("binder:import.errors.unknown_title"),
      });
    } finally {
      importRunningRef.current = false;
      setIsImportRunning(false);
      setImportProgress(null);
    }
  };

  const importResolvedItems = async (
    matchedItems: BinderImportResolvedItem[],
    skippedIssues: BinderImportIssue[]
  ) => {
    setImportError(null);
    setPartialReview(null);
    setImportSuccess(null);
    setImportProgress({
      completed: 0,
      stage: "importing",
      total: matchedItems.length,
    });

    const insertResult = await insertBinderCards(matchedItems, (completed) => {
      setImportProgress({
        completed,
        stage: "importing",
        total: matchedItems.length,
      });
    });

    if (insertResult.importedCount > 0) {
      await onImported();
    }

    const failedInsertIssues =
      insertResult.failedInsertCount > 0
        ? buildFailedInsertIssues(
            insertResult.failedItems,
            insertResult.failedInsertCount
          )
        : [];

    setImportSuccess({
      importedCount: insertResult.importedCount,
      issues: [...skippedIssues, ...failedInsertIssues],
    });
    setImportStep("success");
  };

  const handleImport = () => {
    void runWithImportGuard(async () => {
      const format = getImportFormat(importSource);
      const sourceText = isFileImportSource ? fileInput : textInput;
      const value = sourceText.trim();
      if (!value) {
        setPartialReview(null);
        setImportError({
          issues: [],
          title: getEmptyImportErrorTitle(),
        });
        return;
      }

      const parseResult =
        format === "manabox_csv"
          ? parseManaBoxCsvImport(value)
          : parseBinderImportText(value);
      const parseIssues = buildRejectedLineIssues(parseResult);

      if (parseResult.items.length === 0) {
        setPartialReview(null);
        setImportError({
          issues: parseIssues,
          title: t("binder:import.no_parseable_cards"),
        });
        return;
      }

      setImportError(null);
      setPartialReview(null);
      setImportSuccess(null);
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
      const issues = [
        ...parseIssues,
        ...buildUnmatchedItemIssues(resolveResult),
      ];

      if (issues.length > 0) {
        if (resolveResult.matchedItems.length > 0) {
          setPartialReview({
            issues,
            matchedItems: resolveResult.matchedItems,
          });
          return;
        }

        setImportError({
          issues,
          title: t("binder:import.errors.match_title"),
        });
        return;
      }

      await importResolvedItems(resolveResult.matchedItems, []);
    });
  };

  const handleConfirmPartialImport = () => {
    if (!partialReview) return;

    void runWithImportGuard(async () => {
      await importResolvedItems(partialReview.matchedItems, partialReview.issues);
    });
  };

  const handleImportSourceChange = (value: string) => {
    if (!value || isImporting) return;

    const nextImportSource = value as BinderImportSource;

    fileReadTokenRef.current += 1;
    importSourceRef.current = nextImportSource;
    setImportSource(nextImportSource);
    setFileInput("");
    setSelectedFileName("");
    setImportError(null);
    setPartialReview(null);
    setImportProgress(null);
  };

  const readImportFile = async (file: File) => {
    const readToken = fileReadTokenRef.current + 1;
    const sourceAtReadStart = importSourceRef.current;

    fileReadTokenRef.current = readToken;
    setImportError(null);
    setPartialReview(null);
    setFileInput("");
    setSelectedFileName(file.name);

    try {
      const text = await file.text();
      if (
        fileReadTokenRef.current !== readToken ||
        importSourceRef.current !== sourceAtReadStart ||
        sourceAtReadStart === "text"
      ) {
        return;
      }

      setFileInput(text);
    } catch (error) {
      if (
        fileReadTokenRef.current !== readToken ||
        importSourceRef.current !== sourceAtReadStart
      ) {
        return;
      }

      console.error(error);
      setFileInput("");
      setImportError({
        issues: [],
        title: t("binder:import.errors.file_read"),
      });
    }
  };

  const handleSuccessOk = () => {
    setIsOpen(false);
    resetState();
  };

  const hasSuccessIssues = !!importSuccess?.issues.length;
  const importActionLabel = partialReview
    ? t("binder:import.import_matched_count", {
        count: partialReview.matchedItems.length,
      })
    : t("binder:import.import");
  const fileLabel = selectedFileName
    ? t("binder:import.selected_file", {
        name: selectedFileName,
      })
    : t("binder:import.file_drop_label");
  const fileDescription =
    importSource === "manabox_csv"
      ? t("binder:import.accepted_csv")
      : t("binder:import.accepted_txt");

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-9 px-2 sm:px-3">
          <Upload className="size-4" />
          {t("binder:import.button")}
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={!isImporting && importStep !== "success"}
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>
            {importStep === "success"
              ? t(
                  hasSuccessIssues
                    ? "binder:import.partial_success_title"
                    : "binder:import.success_title"
                )
              : t("binder:import.title")}
          </DialogTitle>
          <DialogDescription>
            {importStep === "success"
              ? t(
                  hasSuccessIssues
                    ? "binder:import.partial_success_description"
                    : "binder:import.success_description"
                )
              : t("binder:import.description")}
          </DialogDescription>
        </DialogHeader>

        {importStep === "success" ? (
          <BinderImportSuccessView success={importSuccess} />
        ) : (
          <BinderImportInputView
            fileAccept={getFileAccept(importSource)}
            fileDescription={fileDescription}
            fileLabel={fileLabel}
            importError={importError}
            importProgress={importProgress}
            importSource={importSource}
            isImporting={isImporting}
            onFileSelect={readImportFile}
            onImportSourceChange={handleImportSourceChange}
            onTextInputChange={(value) => {
              setTextInput(value);
              setImportError(null);
              setPartialReview(null);
            }}
            partialReview={partialReview}
            textInput={textInput}
          />
        )}

        <DialogFooter>
          {importStep === "success" ? (
            <Button type="button" onClick={handleSuccessOk}>
              {t("common:ok")}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isImporting}
                onClick={() => handleOpenChange(false)}
              >
                {t("common:cancel")}
              </Button>
              <Button
                type="button"
                isLoading={isImporting}
                onClick={partialReview ? handleConfirmPartialImport : handleImport}
              >
                {importActionLabel}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
