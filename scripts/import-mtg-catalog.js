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
const sqlPath = path.join(repoRoot, "scripts/import-mtg-catalog.sql");

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing required file: ${filePath}`);
    process.exit(1);
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

function createRunnableSqlFile() {
  const sql = fs
    .readFileSync(sqlPath, "utf8")
    .replaceAll("__MTG_SETS_CSV__", escapeCopyPath(setsCsv))
    .replaceAll("__MTG_CARDS_CSV__", escapeCopyPath(cardsCsv))
    .replaceAll("__MTG_CARD_PRICES_CSV__", escapeCopyPath(cardPricesCsv))
    .replaceAll(
      "__MTG_CARD_PURCHASE_URLS_CSV__",
      escapeCopyPath(cardPurchaseUrlsCsv)
    );
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tcgbinder-mtg-import-"));
  const tempSqlPath = path.join(tempDir, "import-mtg-catalog.sql");

  fs.writeFileSync(tempSqlPath, sql, "utf8");

  return { tempDir, tempSqlPath };
}

requireFile(setsCsv);
requireFile(cardsCsv);
requireFile(cardPricesCsv);
requireFile(cardPurchaseUrlsCsv);
requireFile(sqlPath);

const databaseUrl = getDatabaseUrl();
const { tempDir, tempSqlPath } = createRunnableSqlFile();

try {
  const result = spawnSync(
    "psql",
    ["-d", databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", tempSqlPath],
    {
      cwd: repoRoot,
      stdio: "inherit",
    }
  );

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status || 0);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
