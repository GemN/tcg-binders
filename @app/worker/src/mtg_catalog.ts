import { spawn } from "child_process";
import { createWriteStream, promises as fsp } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";

const catalogBaseUrl = "https://mtgjson.com/api/v5/csv/";
const repoRoot = resolve(__dirname, "../../..");
const importerPath = join(repoRoot, "scripts/import-mtg-catalog.js");

interface MtgCatalogFile {
  archiveName: string;
  csvName: string;
  environmentVariable: string;
}

interface SyncMtgCatalogDependencies {
  createTempDirectory?(tempDirectoryPrefix: string): Promise<string>;
  fetchCatalog: typeof fetch;
  logProgress(message: string): void;
  removeTempDirectory?(tempDirectory: string): Promise<void>;
  runCatalogImporter: (environment: NodeJS.ProcessEnv) => Promise<void>;
}

const catalogFiles: readonly MtgCatalogFile[] = [
  {
    archiveName: "sets.csv.gz",
    csvName: "sets.csv",
    environmentVariable: "MTG_SETS_CSV",
  },
  {
    archiveName: "cards.csv.gz",
    csvName: "cards.csv",
    environmentVariable: "MTG_CARDS_CSV",
  },
  {
    archiveName: "cardPrices.csv.gz",
    csvName: "cardPrices.csv",
    environmentVariable: "MTG_CARD_PRICES_CSV",
  },
  {
    archiveName: "cardPurchaseUrls.csv.gz",
    csvName: "cardPurchaseUrls.csv",
    environmentVariable: "MTG_CARD_PURCHASE_URLS_CSV",
  },
  {
    archiveName: "cardIdentifiers.csv.gz",
    csvName: "cardIdentifiers.csv",
    environmentVariable: "MTG_CARD_IDENTIFIERS_CSV",
  },
];

export async function syncMtgCatalog(): Promise<void> {
  await syncMtgCatalogWithDependencies({
    fetchCatalog: fetch,
    logProgress: console.log,
    runCatalogImporter: runImporter,
  });
}

export async function syncMtgCatalogWithDependencies(
  dependencies: SyncMtgCatalogDependencies
): Promise<void> {
  dependencies.logProgress("MTG catalog sync started.");
  const tempDirectoryPrefix = join(tmpdir(), "tcgbinder-mtg-catalog-");
  let tempDirectory: string;

  try {
    const createTempDirectory =
      dependencies.createTempDirectory ?? createCatalogTempDirectory;
    tempDirectory = await createTempDirectory(tempDirectoryPrefix);
  } catch (error) {
    throw sanitizeMtgCatalogError(error, [
      `${tempDirectoryPrefix}XXXXXX`,
      tempDirectoryPrefix,
    ]);
  }

  dependencies.logProgress(
    `MTG catalog download temp folder: ${tempDirectory}`
  );
  const generatedCatalogPaths = [
    ...catalogFiles.map((catalogFile) =>
      join(tempDirectory, catalogFile.csvName)
    ),
    tempDirectory,
  ];
  let operationError: Error | undefined;

  try {
    const importerEnvironment = { ...process.env };

    for (const catalogFile of catalogFiles) {
      dependencies.logProgress(
        `Downloading and decompressing ${catalogFile.archiveName}.`
      );
      const csvPath = await downloadCatalogFile(
        catalogFile,
        tempDirectory,
        dependencies.fetchCatalog
      );
      dependencies.logProgress(
        `Downloaded and decompressed ${catalogFile.archiveName}.`
      );
      importerEnvironment[catalogFile.environmentVariable] = csvPath;
    }

    dependencies.logProgress("Starting MTG catalog importer.");
    await dependencies.runCatalogImporter(importerEnvironment);
    dependencies.logProgress("MTG catalog importer completed.");
  } catch (error) {
    operationError = sanitizeMtgCatalogError(error, generatedCatalogPaths);
  }

  dependencies.logProgress("Cleaning up MTG catalog sync files.");

  try {
    const removeTempDirectory =
      dependencies.removeTempDirectory ?? removeCatalogTempDirectory;
    await removeTempDirectory(tempDirectory);
    dependencies.logProgress("MTG catalog sync cleanup completed.");
  } catch (error) {
    dependencies.logProgress("MTG catalog sync cleanup failed.");

    if (!operationError) {
      throw sanitizeMtgCatalogError(error, generatedCatalogPaths);
    }
  }

  if (operationError) {
    throw operationError;
  }

  dependencies.logProgress("MTG catalog sync completed.");
}

async function createCatalogTempDirectory(
  tempDirectoryPrefix: string
): Promise<string> {
  return fsp.mkdtemp(tempDirectoryPrefix);
}

async function removeCatalogTempDirectory(
  tempDirectory: string
): Promise<void> {
  await fsp.rm(tempDirectory, { recursive: true, force: true });
}

function sanitizeMtgCatalogError(
  error: unknown,
  generatedCatalogPaths: readonly string[]
): Error {
  const originalError =
    error instanceof Error ? error : new Error(String(error));
  const sanitizedMessage = sanitizeMtgCatalogText(
    originalError.message,
    generatedCatalogPaths
  );
  const sanitizedStack = originalError.stack
    ? sanitizeMtgCatalogText(originalError.stack, generatedCatalogPaths)
    : undefined;

  if (
    sanitizedMessage === originalError.message &&
    sanitizedStack === originalError.stack
  ) {
    return originalError;
  }

  const sanitizedError = new Error(sanitizedMessage);
  sanitizedError.name = originalError.name;
  sanitizedError.stack = sanitizedStack;
  return sanitizedError;
}

function sanitizeMtgCatalogText(
  text: string,
  generatedCatalogPaths: readonly string[]
): string {
  return [...generatedCatalogPaths]
    .sort((left, right) => right.length - left.length)
    .reduce(
      (sanitizedText, generatedCatalogPath) =>
        sanitizedText
          .split(generatedCatalogPath)
          .join("<temporary MTG catalog path>"),
      text
    );
}

async function downloadCatalogFile(
  catalogFile: MtgCatalogFile,
  tempDirectory: string,
  fetchCatalog: typeof fetch
): Promise<string> {
  const url = new URL(catalogFile.archiveName, catalogBaseUrl);
  let response: Response;

  try {
    response = await fetchCatalog(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to download ${catalogFile.archiveName}: ${message}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to download ${catalogFile.archiveName}: ${response.status} ${response.statusText}`
    );
  }

  if (!response.body) {
    throw new Error(
      `Failed to download ${catalogFile.archiveName}: response body is empty`
    );
  }

  const csvPath = join(tempDirectory, catalogFile.csvName);

  try {
    await pipeline(
      Readable.fromWeb(response.body),
      createGunzip(),
      createWriteStream(csvPath)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to download and decompress ${catalogFile.archiveName}: ${message}`
    );
  }

  return csvPath;
}

export async function runImporter(
  environment: NodeJS.ProcessEnv,
  spawnProcess: typeof spawn = spawn
): Promise<void> {
  const importerEnvironment = { ...environment };
  const nodeOptions = importerEnvironment.NODE_OPTIONS?.replace(
    /(^|\s)(?:-r|--require)(?:\s+|=)(?:"@app\/config\/env"|'@app\/config\/env'|@app\/config\/env)(?=\s|$)/g,
    ""
  ).trim();

  if (nodeOptions) {
    importerEnvironment.NODE_OPTIONS = nodeOptions;
  } else {
    delete importerEnvironment.NODE_OPTIONS;
  }

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawnProcess(process.execPath, [importerPath], {
      cwd: repoRoot,
      env: importerEnvironment,
      stdio: ["ignore", "inherit", "inherit"],
    });

    child.once("error", (error) => {
      rejectPromise(
        new Error(`Failed to start MTG catalog importer: ${error.message}`)
      );
    });

    child.once("close", (exitCode, signal) => {
      if (exitCode === 0) {
        resolvePromise();
        return;
      }

      const result =
        exitCode === null
          ? `signal ${signal ?? "unknown"}`
          : `exit code ${exitCode}`;
      rejectPromise(new Error(`MTG catalog importer failed with ${result}`));
    });
  });
}
