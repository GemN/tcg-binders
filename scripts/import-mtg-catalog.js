#!/usr/bin/env node

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const setsCsv = path.resolve(
  process.env.MTG_SETS_CSV || path.join(repoRoot, "scripts/sets.csv")
);
const cardsCsv = path.resolve(
  process.env.MTG_CARDS_CSV || path.join(repoRoot, "scripts/cards.csv")
);
const cardPricesCsv = path.resolve(
  process.env.MTG_CARD_PRICES_CSV ||
    path.join(repoRoot, "scripts/cardPrices.csv")
);
const cardPurchaseUrlsCsv = path.resolve(
  process.env.MTG_CARD_PURCHASE_URLS_CSV ||
    path.join(repoRoot, "scripts/cardPurchaseUrls.csv")
);
const cardIdentifiersCsv = path.resolve(
  process.env.MTG_CARD_IDENTIFIERS_CSV ||
    path.join(repoRoot, "scripts/cardIdentifiers.csv")
);
const sqlPath = path.join(repoRoot, "scripts/import-mtg-catalog.sql");
const psqlStderrMaxBuffer = 16 * 1024 * 1024;
const catalogCsvPaths = [
  setsCsv,
  cardsCsv,
  cardPricesCsv,
  cardPurchaseUrlsCsv,
  cardIdentifiersCsv,
];
const generatedCatalogTempPaths = catalogCsvPaths.flatMap((csvPath) => {
  const csvDirectory = path.dirname(csvPath);

  return path.basename(csvDirectory).startsWith("tcgbinder-mtg-catalog-")
    ? [csvPath, csvDirectory]
    : [];
});

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
}

function parseDbUrlFromSupabaseStatus(output) {
  const match = output.match(/^DB_URL="([^"]+)"$/m);
  return match ? match[1] : null;
}

function getDatabaseUrl() {
  if (process.env.MTG_IMPORT_DATABASE_URL) {
    return process.env.MTG_IMPORT_DATABASE_URL;
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }

  const status = spawnSync("yarn", ["db", "supabase", "status", "-o", "env"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (status.status === 0) {
    const dbUrl = parseDbUrlFromSupabaseStatus(status.stdout);

    if (dbUrl) {
      return dbUrl;
    }
  }

  return "postgresql://postgres:postgres@127.0.0.1:55322/postgres";
}

function escapeCopyPath(filePath) {
  return filePath.replace(/\\/g, "\\\\").replace(/'/g, "''");
}

function sanitizeGeneratedTempPaths(
  output,
  catalogTempPaths = generatedCatalogTempPaths,
  importTempPaths = []
) {
  const knownTempPaths = [
    ...catalogTempPaths.map((tempPath) => ({
      replacement: "<temporary MTG catalog path>",
      tempPath,
    })),
    ...importTempPaths.map((tempPath) => ({
      replacement: "<temporary MTG import path>",
      tempPath,
    })),
  ].sort((left, right) => right.tempPath.length - left.tempPath.length);

  return knownTempPaths.reduce(
    (sanitizedOutput, { replacement, tempPath }) =>
      sanitizedOutput.replaceAll(tempPath, replacement),
    String(output)
  );
}

function sanitizePsqlOutput(output, databaseUrl, importTempPaths) {
  return sanitizeGeneratedTempPaths(
    output,
    generatedCatalogTempPaths,
    importTempPaths
  ).replaceAll(databaseUrl, "<database URL>");
}

function writeProcessStderr(message) {
  process.stderr.write(message);
}

function removeImportTempDirectory(tempDirectory) {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

function createRunnableSqlFile(tempDir) {
  const sql = fs
    .readFileSync(sqlPath, "utf8")
    .replaceAll("__MTG_SETS_CSV__", escapeCopyPath(setsCsv))
    .replaceAll("__MTG_CARDS_CSV__", escapeCopyPath(cardsCsv))
    .replaceAll("__MTG_CARD_PRICES_CSV__", escapeCopyPath(cardPricesCsv))
    .replaceAll(
      "__MTG_CARD_PURCHASE_URLS_CSV__",
      escapeCopyPath(cardPurchaseUrlsCsv)
    )
    .replaceAll(
      "__MTG_CARD_IDENTIFIERS_CSV__",
      escapeCopyPath(cardIdentifiersCsv)
    );
  const tempSqlPath = path.join(tempDir, "import-mtg-catalog.sql");

  fs.writeFileSync(tempSqlPath, sql, "utf8");

  return { tempSqlPath };
}

async function main(
  spawnPsql = spawnSync,
  writeStderr = writeProcessStderr,
  removeTempDirectory = removeImportTempDirectory,
  logProgress = console.log
) {
  requireFile(setsCsv);
  requireFile(cardsCsv);
  requireFile(cardPricesCsv);
  requireFile(cardPurchaseUrlsCsv);
  requireFile(cardIdentifiersCsv);
  requireFile(sqlPath);

  const databaseUrl = getDatabaseUrl();
  const tempDirectoryPrefix = path.join(os.tmpdir(), "tcgbinder-mtg-import-");
  let tempDir;

  try {
    tempDir = fs.mkdtempSync(tempDirectoryPrefix);
  } catch (error) {
    throw sanitizeImporterError(error, databaseUrl, [
      `${tempDirectoryPrefix}XXXXXX`,
      tempDirectoryPrefix,
    ]);
  }

  logProgress(`MTG catalog import temp folder: ${tempDir}`);
  const importTempPaths = [tempDir];
  let operationError;
  let psqlExitCode;

  try {
    const { tempSqlPath } = createRunnableSqlFile(tempDir);
    importTempPaths.unshift(tempSqlPath);
    const result = spawnPsql(
      "psql",
      ["-d", databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", tempSqlPath],
      {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: psqlStderrMaxBuffer,
        stdio: ["inherit", "inherit", "pipe"],
      }
    );

    if (result.stderr) {
      writeStderr(
        sanitizePsqlOutput(result.stderr, databaseUrl, importTempPaths)
      );
    }

    if (result.error) {
      console.error(
        sanitizePsqlOutput(result.error.message, databaseUrl, importTempPaths)
      );
      psqlExitCode = 1;
    } else if (result.signal) {
      console.error(`psql terminated by signal ${result.signal}`);
      psqlExitCode = 1;
    } else if (result.status === null) {
      console.error("psql terminated without an exit status");
      psqlExitCode = 1;
    } else {
      psqlExitCode = result.status;
    }
  } catch (error) {
    operationError = sanitizeImporterError(error, databaseUrl, importTempPaths);
  }

  let cleanupError;

  try {
    removeTempDirectory(tempDir);
  } catch (error) {
    cleanupError = sanitizeImporterError(error, databaseUrl, importTempPaths);
  }

  if (cleanupError) {
    const cleanupFailureMessage = `MTG catalog importer cleanup failed: ${cleanupError.message}`;

    if (operationError || psqlExitCode !== 0) {
      try {
        writeStderr(`${cleanupFailureMessage}\n`);
      } catch {
        // Preserve the primary importer failure if reporting cleanup also fails.
      }
    } else {
      throw new Error(cleanupFailureMessage);
    }
  }

  if (operationError) {
    throw operationError;
  }

  return psqlExitCode;
}

function sanitizeImporterError(error, databaseUrl, importTempPaths) {
  const originalError =
    error instanceof Error ? error : new Error(String(error));
  const sanitizedMessage = sanitizePsqlOutput(
    originalError.message,
    databaseUrl,
    importTempPaths
  );
  const sanitizedStack = originalError.stack
    ? sanitizePsqlOutput(originalError.stack, databaseUrl, importTempPaths)
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

if (require.main === module) {
  main()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      const output =
        error instanceof Error ? (error.stack ?? error.message) : String(error);
      console.error(sanitizeGeneratedTempPaths(output));
      process.exitCode = 1;
    });
}

module.exports = { main, sanitizeGeneratedTempPaths };
