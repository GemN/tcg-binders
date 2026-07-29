const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { gzipSync } = require("node:zlib");

const {
  runImporter,
  syncMtgCatalogWithDependencies,
} = require("../dist/mtg_catalog");

const catalogFiles = [
  {
    url: "https://mtgjson.com/api/v5/csv/sets.csv.gz",
    environmentVariable: "MTG_SETS_CSV",
    csvName: "sets.csv",
  },
  {
    url: "https://mtgjson.com/api/v5/csv/cards.csv.gz",
    environmentVariable: "MTG_CARDS_CSV",
    csvName: "cards.csv",
  },
  {
    url: "https://mtgjson.com/api/v5/csv/cardPrices.csv.gz",
    environmentVariable: "MTG_CARD_PRICES_CSV",
    csvName: "cardPrices.csv",
  },
  {
    url: "https://mtgjson.com/api/v5/csv/cardPurchaseUrls.csv.gz",
    environmentVariable: "MTG_CARD_PURCHASE_URLS_CSV",
    csvName: "cardPurchaseUrls.csv",
  },
  {
    url: "https://mtgjson.com/api/v5/csv/cardIdentifiers.csv.gz",
    environmentVariable: "MTG_CARD_IDENTIFIERS_CSV",
    csvName: "cardIdentifiers.csv",
  },
];

const ignoreProgress = () => {};

test("sets import columns match the MTGJSON CSV order", () => {
  const importerSql = fs.readFileSync(
    path.resolve(__dirname, "../../../scripts/import-mtg-catalog.sql"),
    "utf8"
  );
  const tableDeclaration = importerSql.match(
    /create temp table import_mtg_sets_raw \(\n([\s\S]*?)\n\) on commit drop;/
  );

  assert.ok(tableDeclaration);
  assert.deepEqual(
    tableDeclaration[1]
      .split("\n")
      .map((line) => line.trim().replace(/,$/, "").split(/\s+/)[0]),
    [
      "code",
      "name",
      "release_date",
      "set_type",
      "is_online_only",
      "is_foil_only",
      "tcgplayer_group_id",
      "is_non_foil_only",
      "parent_code",
      "total_set_size",
      "base_set_size",
      "keyrune_code",
      "is_partial_preview",
      "is_foreign_only",
      "is_paper_only",
      "languages",
      "token_set_code",
      "mtgo_code",
      "block",
      "mcm_id",
      "mcm_name",
      "mcm_id_extras",
    ]
  );
});

test("imports a multiface printing once using its side-a identity", async (t) => {
  const configuredAdminDatabaseUrl =
    process.env.MTG_IMPORT_TEST_ADMIN_DATABASE_URL;
  const adminDatabaseUrl =
    configuredAdminDatabaseUrl ||
    "postgresql://postgres:postgres@127.0.0.1:55322/postgres";
  const availabilityCheck = runPsql(adminDatabaseUrl, "select 1;");

  if (availabilityCheck.status !== 0) {
    if (configuredAdminDatabaseUrl) {
      assertPsqlSucceeded(availabilityCheck);
    }

    t.skip("Local PostgreSQL is not available for the MTG importer test.");
    return;
  }

  const databaseName = `tcgbinder_mtg_import_${process.pid}_${Date.now()}`;
  const databaseUrl = new URL(adminDatabaseUrl);
  databaseUrl.pathname = `/${databaseName}`;
  const fixtureDirectory = await fsp.mkdtemp(
    path.join(os.tmpdir(), "tcgbinder-mtg-multiface-test-")
  );
  const expectedState = {
    cards: [
      {
        collector_number: "9001",
        external_id: "00000000-0000-4000-8000-0000000000a1",
        layout: "transform",
        mana_cost: "{U}",
        mana_value: "1.00",
        name: "Tamiyo, Inquisitive Student // Tamiyo, Seasoned Scholar",
        oracle_text: "Flying\nWhenever Tamiyo attacks, investigate.",
        scryfall_id: "00000000-0000-4000-8000-0000000000c1",
        type_line: "Legendary Creature — Moonfolk Wizard",
      },
    ],
    prices: [
      {
        amount: "1.11",
        buy_url: "https://example.test/front-cardkingdom",
        external_id: "00000000-0000-4000-8000-0000000000a1",
        finish: "normal",
        source: "cardkingdom",
      },
      {
        amount: "2.22",
        buy_url: "https://example.test/back-tcgplayer",
        external_id: "00000000-0000-4000-8000-0000000000a1",
        finish: "foil",
        source: "tcgplayer",
      },
    ],
  };
  let operationError;

  try {
    assertPsqlSucceeded(
      runPsql(adminDatabaseUrl, `create database "${databaseName}";`)
    );
    assertPsqlSucceeded(
      runPsql(databaseUrl.toString(), createMtgImporterTestSchema())
    );
    await writeMultifaceCatalogFixture(fixtureDirectory);

    runRealCatalogImporter(fixtureDirectory, databaseUrl.toString());
    assert.deepEqual(
      readMultifaceImportState(databaseUrl.toString()),
      expectedState
    );

    runRealCatalogImporter(fixtureDirectory, databaseUrl.toString());
    assert.deepEqual(
      readMultifaceImportState(databaseUrl.toString()),
      expectedState
    );
  } catch (error) {
    operationError = error;
  }

  const cleanupErrors = [];

  try {
    await fsp.rm(fixtureDirectory, { recursive: true, force: true });
  } catch (error) {
    cleanupErrors.push(error);
  }

  try {
    assertPsqlSucceeded(
      runPsql(
        adminDatabaseUrl,
        `drop database if exists "${databaseName}" with (force);`
      )
    );
  } catch (error) {
    cleanupErrors.push(error);
  }

  if (operationError) {
    for (const cleanupError of cleanupErrors) {
      t.diagnostic(`MTG importer test cleanup failed: ${cleanupError.message}`);
    }
    throw operationError;
  }

  if (cleanupErrors.length === 1) {
    throw cleanupErrors[0];
  }

  if (cleanupErrors.length > 1) {
    throw new AggregateError(
      cleanupErrors,
      "MTG importer test cleanup failed."
    );
  }
});

test("downloads the five catalog files, maps their paths, and cleans up", async () => {
  const requestedUrls = [];
  const catalogContents = "column\nvalue\n";
  const csvPaths = [];
  const progressMessages = [];

  await syncMtgCatalogWithDependencies({
    fetchCatalog: async (url) => {
      requestedUrls.push(String(url));
      return new Response(gzipSync(catalogContents));
    },
    logProgress: (message) => progressMessages.push(message),
    runCatalogImporter: async (environment) => {
      for (const catalogFile of catalogFiles) {
        const csvPath = environment[catalogFile.environmentVariable];

        assert.equal(path.basename(csvPath), catalogFile.csvName);
        assert.equal(await fsp.readFile(csvPath, "utf8"), catalogContents);
        csvPaths.push(csvPath);
      }
    },
  });

  assert.deepEqual(
    requestedUrls,
    catalogFiles.map((catalogFile) => catalogFile.url)
  );
  const downloadTempDirectory = path.dirname(csvPaths[0]);
  assert.deepEqual(progressMessages, [
    "MTG catalog sync started.",
    `MTG catalog download temp folder: ${downloadTempDirectory}`,
    ...catalogFiles.flatMap((catalogFile) => [
      `Downloading and decompressing ${path.basename(catalogFile.url)}.`,
      `Downloaded and decompressed ${path.basename(catalogFile.url)}.`,
    ]),
    "Starting MTG catalog importer.",
    "MTG catalog importer completed.",
    "Cleaning up MTG catalog sync files.",
    "MTG catalog sync cleanup completed.",
    "MTG catalog sync completed.",
  ]);

  for (const csvPath of csvPaths) {
    assert.equal(fs.existsSync(csvPath), false);
  }
});

test("cleans up its temp directory after an HTTP failure", async () => {
  const tempDirectoriesBefore = await listTempDirectories(
    "tcgbinder-mtg-catalog-"
  );
  let tempDirectory;

  await assert.rejects(
    syncMtgCatalogWithDependencies({
      fetchCatalog: async () => {
        tempDirectory = await findNewTempDirectory(
          "tcgbinder-mtg-catalog-",
          tempDirectoriesBefore
        );
        return new Response(null, { status: 503, statusText: "Unavailable" });
      },
      logProgress: ignoreProgress,
      runCatalogImporter: async () => {
        assert.fail("Importer should not run after an HTTP failure");
      },
    }),
    /Failed to download sets\.csv\.gz: 503 Unavailable/
  );

  assert.ok(tempDirectory);
  assert.equal(fs.existsSync(tempDirectory), false);
});

test("cleans up its temp directory after a decompression failure", async () => {
  const tempDirectoriesBefore = await listTempDirectories(
    "tcgbinder-mtg-catalog-"
  );
  let tempDirectory;

  await assert.rejects(
    syncMtgCatalogWithDependencies({
      fetchCatalog: async () => {
        tempDirectory = await findNewTempDirectory(
          "tcgbinder-mtg-catalog-",
          tempDirectoriesBefore
        );
        return new Response("not a gzip archive");
      },
      logProgress: ignoreProgress,
      runCatalogImporter: async () => {
        assert.fail("Importer should not run after a decompression failure");
      },
    }),
    /Failed to download and decompress sets\.csv\.gz/
  );

  assert.ok(tempDirectory);
  assert.equal(fs.existsSync(tempDirectory), false);
});

test("cleans up its temp directory after an importer failure", async () => {
  let csvPath;
  const progressMessages = [];

  await assert.rejects(
    syncMtgCatalogWithDependencies({
      fetchCatalog: async () => new Response(gzipSync("column\nvalue\n")),
      logProgress: (message) => progressMessages.push(message),
      runCatalogImporter: async (environment) => {
        csvPath = environment.MTG_SETS_CSV;
        throw new Error("MTG catalog importer failed with exit code 7");
      },
    }),
    /MTG catalog importer failed with exit code 7/
  );

  assert.ok(csvPath);
  assert.equal(fs.existsSync(csvPath), false);
  assert.deepEqual(progressMessages.slice(-2), [
    "Cleaning up MTG catalog sync files.",
    "MTG catalog sync cleanup completed.",
  ]);
  assert.equal(progressMessages.includes("MTG catalog sync completed."), false);
});

test("preserves the operation failure when cleanup also fails", async () => {
  const progressMessages = [];

  await assert.rejects(
    syncMtgCatalogWithDependencies({
      fetchCatalog: async () => new Response(gzipSync("column\nvalue\n")),
      logProgress: (message) => progressMessages.push(message),
      removeTempDirectory: async (tempDirectory) => {
        await fsp.rm(tempDirectory, { recursive: true, force: true });
        throw new Error(`Could not remove ${tempDirectory}`);
      },
      runCatalogImporter: async (environment) => {
        throw new Error(`Import failed for ${environment.MTG_SETS_CSV}`);
      },
    }),
    (error) => {
      assert.equal(
        error.message,
        "Import failed for <temporary MTG catalog path>"
      );
      assert.doesNotMatch(error.stack, /tcgbinder-mtg-catalog-/);
      assert.doesNotMatch(error.message, /Could not remove/);
      return true;
    }
  );

  assert.deepEqual(progressMessages.slice(-2), [
    "Cleaning up MTG catalog sync files.",
    "MTG catalog sync cleanup failed.",
  ]);
  assert.equal(progressMessages.includes("MTG catalog sync completed."), false);
});

test("rejects with a sanitized cleanup-only failure", async () => {
  const progressMessages = [];

  await assert.rejects(
    syncMtgCatalogWithDependencies({
      fetchCatalog: async () => new Response(gzipSync("column\nvalue\n")),
      logProgress: (message) => progressMessages.push(message),
      removeTempDirectory: async (tempDirectory) => {
        await fsp.rm(tempDirectory, { recursive: true, force: true });
        throw new Error(`Could not remove ${tempDirectory}`);
      },
      runCatalogImporter: async () => {},
    }),
    (error) => {
      assert.equal(
        error.message,
        "Could not remove <temporary MTG catalog path>"
      );
      assert.doesNotMatch(error.stack, /tcgbinder-mtg-catalog-/);
      return true;
    }
  );

  assert.deepEqual(progressMessages.slice(-2), [
    "Cleaning up MTG catalog sync files.",
    "MTG catalog sync cleanup failed.",
  ]);
  assert.equal(progressMessages.includes("MTG catalog sync completed."), false);
});

test("sanitizes a temp-directory creation failure", async () => {
  const progressMessages = [];

  await assert.rejects(
    syncMtgCatalogWithDependencies({
      createTempDirectory: async (tempDirectoryPrefix) => {
        throw new Error(`Could not create ${tempDirectoryPrefix}XXXXXX`);
      },
      fetchCatalog: async () => {
        assert.fail("Download should not run after a temp-directory failure");
      },
      logProgress: (message) => progressMessages.push(message),
      runCatalogImporter: async () => {
        assert.fail("Importer should not run after a temp-directory failure");
      },
    }),
    (error) => {
      assert.equal(
        error.message,
        "Could not create <temporary MTG catalog path>"
      );
      assert.doesNotMatch(error.stack, /tcgbinder-mtg-catalog-/);
      return true;
    }
  );

  assert.deepEqual(progressMessages, ["MTG catalog sync started."]);
});

test("sanitizes known temp paths containing spaces", async (t) => {
  const tempDirectories = [
    "/tmp/MTG User/tcgbinder-mtg-catalog-Unix",
    String.raw`C:\Users\MTG User\AppData\Local\Temp\tcgbinder-mtg-catalog-Windows`,
  ];

  for (const tempDirectory of tempDirectories) {
    await t.test(tempDirectory, async () => {
      await assert.rejects(
        syncMtgCatalogWithDependencies({
          createTempDirectory: async () => tempDirectory,
          fetchCatalog: async () => {
            throw new Error(`Could not read ${tempDirectory}`);
          },
          logProgress: ignoreProgress,
          removeTempDirectory: async (observedTempDirectory) => {
            assert.equal(observedTempDirectory, tempDirectory);
          },
          runCatalogImporter: async () => {
            assert.fail("Importer should not run after a download failure");
          },
        }),
        (error) => {
          assert.equal(
            error.message,
            "Failed to download sets.csv.gz: Could not read " +
              "<temporary MTG catalog path>"
          );
          assert.doesNotMatch(error.stack, /MTG User/);
          assert.doesNotMatch(error.stack, /tcgbinder-mtg-catalog-/);
          return true;
        }
      );
    });
  }
});

test("rejects when the importer exits nonzero or is terminated by a signal", async (t) => {
  await t.test("nonzero exit", async () => {
    await assert.rejects(
      runImporter({}, createSpawnProcess(7, null)),
      /MTG catalog importer failed with exit code 7/
    );
  });

  await t.test("signal", async () => {
    await assert.rejects(
      runImporter({}, createSpawnProcess(null, "SIGTERM")),
      /MTG catalog importer failed with signal SIGTERM/
    );
  });
});

test("preserves the importer environment without reloading worker config", async () => {
  const environment = {
    DATABASE_URL: "postgresql://worker:test@127.0.0.1:5432/catalog",
    NODE_OPTIONS: "--trace-deprecation -r @app/config/env --enable-source-maps",
  };
  let observedEnvironment;

  await runImporter(environment, (command, args, options) => {
    observedEnvironment = options.env;
    return createSpawnProcess(0, null)(command, args, options);
  });

  assert.equal(observedEnvironment.DATABASE_URL, environment.DATABASE_URL);
  assert.equal(
    observedEnvironment.NODE_OPTIONS,
    "--trace-deprecation --enable-source-maps"
  );
  assert.equal(
    environment.NODE_OPTIONS,
    "--trace-deprecation -r @app/config/env --enable-source-maps"
  );
});

test("removes quoted worker config preloads from NODE_OPTIONS", async () => {
  let observedEnvironment;

  await runImporter(
    {
      DATABASE_URL: "postgresql://worker:test@127.0.0.1:5432/catalog",
      NODE_OPTIONS:
        `--trace-deprecation --require "@app/config/env" ` +
        `-r '@app/config/env' --enable-source-maps`,
    },
    (command, args, options) => {
      observedEnvironment = options.env;
      return createSpawnProcess(0, null)(command, args, options);
    }
  );

  assert.equal(
    observedEnvironment.NODE_OPTIONS,
    "--trace-deprecation --enable-source-maps"
  );
});

test("omits NODE_OPTIONS when only the worker config preload remains", async () => {
  let observedEnvironment;

  await runImporter(
    {
      DATABASE_URL: "postgresql://worker:test@127.0.0.1:5432/catalog",
      NODE_OPTIONS: "--require=@app/config/env",
    },
    (command, args, options) => {
      observedEnvironment = options.env;
      return createSpawnProcess(0, null)(command, args, options);
    }
  );

  assert.equal(
    observedEnvironment.DATABASE_URL,
    "postgresql://worker:test@127.0.0.1:5432/catalog"
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(observedEnvironment, "NODE_OPTIONS"),
    false
  );
});

test("logs the generated SQL temp folder immediately after creation", async () => {
  const fixtureDirectory = await fsp.mkdtemp(
    path.join(os.tmpdir(), "tcgbinder-mtg-catalog-test-")
  );
  const environmentVariables = catalogFiles.map(
    (catalogFile) => catalogFile.environmentVariable
  );
  environmentVariables.push("MTG_IMPORT_DATABASE_URL");
  const previousEnvironment = new Map(
    environmentVariables.map((name) => [name, process.env[name]])
  );
  const importerPath = path.resolve(
    __dirname,
    "../../../scripts/import-mtg-catalog.js"
  );
  const progressMessages = [];
  let tempSqlPath;

  try {
    process.env.MTG_IMPORT_DATABASE_URL =
      "postgresql://test:test@127.0.0.1:5432/test";

    for (const catalogFile of catalogFiles) {
      const csvPath = path.join(fixtureDirectory, catalogFile.csvName);
      await fsp.writeFile(csvPath, "column\nvalue\n");
      process.env[catalogFile.environmentVariable] = csvPath;
    }

    delete require.cache[require.resolve(importerPath)];
    const { main } = require(importerPath);

    assert.equal(
      await main(
        (command, args) => {
          tempSqlPath = args[args.indexOf("-f") + 1];
          return { status: 0, signal: null };
        },
        ignoreProgress,
        undefined,
        (message) => progressMessages.push(message)
      ),
      0
    );
    assert.deepEqual(progressMessages, [
      `MTG catalog import temp folder: ${path.dirname(tempSqlPath)}`,
    ]);
  } finally {
    delete require.cache[require.resolve(importerPath)];
    await fsp.rm(fixtureDirectory, { recursive: true, force: true });

    for (const [name, previousValue] of previousEnvironment) {
      if (previousValue === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = previousValue;
      }
    }
  }
});

test("the existing importer preserves exit failures and cleans its temp directory", async (t) => {
  const fixtureDirectory = await fsp.mkdtemp(
    path.join(os.tmpdir(), "tcgbinder-mtg-catalog-test-")
  );
  const environmentVariables = catalogFiles.map(
    (catalogFile) => catalogFile.environmentVariable
  );
  environmentVariables.push("MTG_IMPORT_DATABASE_URL");
  const previousEnvironment = new Map(
    environmentVariables.map((name) => [name, process.env[name]])
  );
  const importerPath = path.resolve(
    __dirname,
    "../../../scripts/import-mtg-catalog.js"
  );

  try {
    process.env.MTG_IMPORT_DATABASE_URL =
      "postgresql://test:test@127.0.0.1:5432/test";

    for (const catalogFile of catalogFiles) {
      const csvPath = path.join(fixtureDirectory, catalogFile.csvName);
      await fsp.writeFile(csvPath, "column\nvalue\n");
      process.env[catalogFile.environmentVariable] = csvPath;
    }

    delete require.cache[require.resolve(importerPath)];
    const { main, sanitizeGeneratedTempPaths } = require(importerPath);
    const tempDirectoriesBefore = await listTempDirectories(
      "tcgbinder-mtg-import-"
    );

    assert.equal(
      await main(
        () => ({ status: 0, signal: null }),
        undefined,
        undefined,
        ignoreProgress
      ),
      0
    );
    assert.deepEqual(
      await listTempDirectories("tcgbinder-mtg-import-"),
      tempDirectoriesBefore
    );

    const surfacedStderr = [];
    const generatedCatalogPath = process.env.MTG_SETS_CSV;

    assert.equal(
      await main(
        (command, args, options) => {
          const tempSqlPath = args[args.indexOf("-f") + 1];

          assert.equal(command, "psql");
          assert.equal(options.encoding, "utf8");
          assert.deepEqual(options.stdio, ["inherit", "inherit", "pipe"]);

          return {
            status: 7,
            signal: null,
            stderr:
              `psql:${tempSqlPath}:5: ERROR: could not read ` +
              `${generatedCatalogPath}; database ${process.env.MTG_IMPORT_DATABASE_URL}\n`,
          };
        },
        (message) => surfacedStderr.push(message),
        undefined,
        ignoreProgress
      ),
      7
    );
    assert.equal(
      surfacedStderr.join(""),
      "psql:<temporary MTG import path>:5: ERROR: could not read " +
        "<temporary MTG catalog path>; database <database URL>\n"
    );
    assert.deepEqual(
      await listTempDirectories("tcgbinder-mtg-import-"),
      tempDirectoriesBefore
    );

    await t.test(
      "forwards and redacts stderr larger than the default spawn buffer",
      async () => {
        const largeStderrPrefix = "x".repeat(1024 * 1024 + 1);
        const largeStderrMessages = [];

        assert.equal(
          await main(
            (command, args, options) => {
              const tempSqlPath = args[args.indexOf("-f") + 1];
              const stderr =
                `${largeStderrPrefix}\n${tempSqlPath}\n` +
                `${generatedCatalogPath}\n${process.env.MTG_IMPORT_DATABASE_URL}\n`;

              assert.ok(options.maxBuffer > Buffer.byteLength(stderr));

              return {
                status: 7,
                signal: null,
                stderr,
              };
            },
            (message) => largeStderrMessages.push(message),
            undefined,
            ignoreProgress
          ),
          7
        );

        const forwardedStderr = largeStderrMessages.join("");

        assert.equal(forwardedStderr.startsWith(largeStderrPrefix), true);
        assert.ok(Buffer.byteLength(forwardedStderr) > 1024 * 1024);
        assert.match(forwardedStderr, /<temporary MTG import path>/);
        assert.match(forwardedStderr, /<temporary MTG catalog path>/);
        assert.match(forwardedStderr, /<database URL>/);
        assert.doesNotMatch(forwardedStderr, /tcgbinder-mtg-import-/);
        assert.doesNotMatch(
          forwardedStderr,
          new RegExp(process.env.MTG_IMPORT_DATABASE_URL)
        );
      }
    );

    const cleanupFailureMessages = [];

    assert.equal(
      await main(
        () => ({ status: 7, signal: null }),
        (message) => cleanupFailureMessages.push(message),
        removeImportTempDirectoryThenFail,
        ignoreProgress
      ),
      7
    );
    assert.match(
      cleanupFailureMessages.join(""),
      /MTG catalog importer cleanup failed: Could not remove <temporary MTG import path>/
    );
    assert.doesNotMatch(
      cleanupFailureMessages.join(""),
      /tcgbinder-mtg-import-/
    );
    assert.deepEqual(
      await listTempDirectories("tcgbinder-mtg-import-"),
      tempDirectoriesBefore
    );

    await assert.rejects(
      main(
        () => ({ status: 0, signal: null }),
        ignoreProgress,
        removeImportTempDirectoryThenFail,
        ignoreProgress
      ),
      (error) => {
        assert.equal(
          error.message,
          "MTG catalog importer cleanup failed: Could not remove " +
            "<temporary MTG import path>"
        );
        assert.doesNotMatch(error.stack, /tcgbinder-mtg-import-/);
        return true;
      }
    );
    assert.deepEqual(
      await listTempDirectories("tcgbinder-mtg-import-"),
      tempDirectoriesBefore
    );

    const unixCatalogPath = "/tmp/MTG User/tcgbinder-mtg-catalog-Unix/sets.csv";
    const windowsImportPath = String.raw`C:\Users\MTG User\AppData\Local\Temp\tcgbinder-mtg-import-Windows\import-mtg-catalog.sql`;
    assert.equal(
      sanitizeGeneratedTempPaths(
        `catalog ${unixCatalogPath}; import ${windowsImportPath}`,
        [unixCatalogPath],
        [windowsImportPath]
      ),
      "catalog <temporary MTG catalog path>; " +
        "import <temporary MTG import path>"
    );

    assert.equal(
      await main(
        () => ({ status: null, signal: "SIGTERM" }),
        undefined,
        undefined,
        ignoreProgress
      ),
      1
    );
    assert.deepEqual(
      await listTempDirectories("tcgbinder-mtg-import-"),
      tempDirectoriesBefore
    );
  } finally {
    delete require.cache[require.resolve(importerPath)];
    await fsp.rm(fixtureDirectory, { recursive: true, force: true });

    for (const [name, previousValue] of previousEnvironment) {
      if (previousValue === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = previousValue;
      }
    }
  }
});

function removeImportTempDirectoryThenFail(tempDirectory) {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
  throw new Error(`Could not remove ${tempDirectory}`);
}

function runPsql(databaseUrl, sql) {
  return spawnSync(
    "psql",
    ["-X", "-A", "-t", "-d", databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", "-"],
    {
      encoding: "utf8",
      input: sql,
    }
  );
}

function assertPsqlSucceeded(result) {
  const failureMessage =
    result.stderr ||
    result.error?.message ||
    `psql exited with status ${result.status}.`;
  assert.equal(result.status, 0, failureMessage);
}

function createMtgImporterTestSchema() {
  return `
create type public.currency_code as enum ('USD');
create type public.market_price_source as enum (
  'cardmarket',
  'cardkingdom',
  'tcgplayer'
);
create type public.mtg_color as enum ('W', 'U', 'B', 'R', 'G', 'C');

create table public.tcg (
  id text primary key,
  name text not null
);

create table public.card_sets (
  id uuid default gen_random_uuid() primary key,
  tcg_id text not null,
  external_id text not null,
  code text,
  name text not null,
  release_at date,
  icon_url text,
  unique (tcg_id, external_id)
);

create table public.cards (
  id uuid default gen_random_uuid() primary key,
  tcg_id text not null,
  card_set_id uuid,
  external_id text not null,
  name text not null,
  collector_number text,
  rarity text,
  finishes text[] default '{}'::text[] not null,
  image_url text,
  released_at date,
  synced_at timestamp with time zone,
  unique (tcg_id, external_id)
);

create table public.mtg_card_details (
  card_id uuid primary key,
  oracle_id text,
  scryfall_id text,
  mana_cost text,
  mana_value numeric(6, 2),
  type_line text,
  oracle_text text,
  keywords text[] default '{}'::text[] not null,
  colors public.mtg_color[] default '{}'::public.mtg_color[] not null,
  color_identity public.mtg_color[] default '{}'::public.mtg_color[] not null,
  layout text
);

create table public.card_market_prices (
  id uuid default gen_random_uuid() primary key,
  tcg_id text not null,
  card_id uuid not null,
  source public.market_price_source not null,
  finish text not null,
  amount numeric(12, 2) not null,
  currency public.currency_code not null,
  buy_url text,
  price_date date not null,
  unique (tcg_id, card_id, source, finish)
);

create table public.binder_cards (
  tcg_id text not null,
  card_id uuid not null
);

insert into public.tcg (id, name)
values ('mtg', 'Magic: The Gathering');

insert into public.card_sets (
  tcg_id,
  external_id,
  code,
  name,
  release_at
)
values (
  'mtg',
  'TDF',
  'TDF',
  'TDD Multiface Fixture',
  '2026-07-29'
);
`;
}

async function writeMultifaceCatalogFixture(fixtureDirectory) {
  const cardName = "Tamiyo, Inquisitive Student // Tamiyo, Seasoned Scholar";
  const frontUuid = "00000000-0000-4000-8000-0000000000a1";
  const backUuid = "00000000-0000-4000-8000-0000000000b1";
  const scryfallId = "00000000-0000-4000-8000-0000000000c1";

  await Promise.all([
    writeCsv(
      path.join(fixtureDirectory, "sets.csv"),
      "code,mtgoCode,name,releaseDate,type,isOnlineOnly,isFoilOnly,isNonFoilOnly,parentCode,totalSetSize,baseSetSize,keyruneCode,isPartialPreview,isForeignOnly,isPaperOnly,languages,tcgplayerGroupId,tokenSetCode,mcmId,mcmName,mcmIdExtras,block",
      []
    ),
    writeCsv(
      path.join(fixtureDirectory, "cards.csv"),
      "artist,artistIds,asciiName,attractionLights,availability,boosterTypes,borderColor,cardParts,colorIdentity,colorIndicator,colors,defense,duelDeck,edhrecRank,edhrecSaltiness,faceConvertedManaCost,faceFlavorName,faceManaValue,faceName,facePrintedName,finishes,flavorName,flavorText,frameEffects,frameVersion,hand,hasAlternativeDeckLimit,hasContentWarning,isAlternative,isFullArt,isFunny,isGameChanger,isOnlineOnly,isOversized,isPromo,isRebalanced,isReprint,isReserved,isStorySpotlight,isTextless,isTimeshifted,keywords,language,layout,leadershipSkills,life,loyalty,manaCost,manaValue,name,number,originalPrintings,originalReleaseDate,originalText,otherFaceIds,power,printedName,printedText,printedType,printings,producedMana,promoTypes,rarity,rebalancedPrintings,relatedCards,securityStamp,setCode,side,signature,skuIds,sourceProducts,subsets,subtypes,supertypes,text,toughness,type,types,uuid,variations,watermark",
      [
        {
          availability: "paper",
          colorIdentity: "G, U",
          colors: "G, U",
          faceManaValue: "0.0",
          faceName: "Tamiyo, Seasoned Scholar",
          finishes: "nonfoil, foil",
          keywords: "Transform",
          language: "English",
          layout: "transform",
          loyalty: "2",
          manaValue: "1.0",
          name: cardName,
          number: "9001",
          rarity: "mythic",
          setCode: "TDF",
          side: "b",
          text: "+2: Draw a card.",
          type: "Legendary Planeswalker — Tamiyo",
          types: "Planeswalker",
          uuid: backUuid,
        },
        {
          availability: "paper",
          colorIdentity: "G, U",
          colors: "U",
          faceManaValue: "1.0",
          faceName: "Tamiyo, Inquisitive Student",
          finishes: "nonfoil, foil",
          keywords: "Flying, Investigate, Transform",
          language: "English",
          layout: "transform",
          manaCost: "{U}",
          manaValue: "1.0",
          name: cardName,
          number: "9001",
          rarity: "mythic",
          setCode: "TDF",
          side: "a",
          text: "Flying\nWhenever Tamiyo attacks, investigate.",
          type: "Legendary Creature — Moonfolk Wizard",
          types: "Creature",
          uuid: frontUuid,
        },
      ]
    ),
    writeCsv(
      path.join(fixtureDirectory, "cardPrices.csv"),
      "cardFinish,currency,date,gameAvailability,price,priceProvider,providerListing,uuid",
      [
        {
          cardFinish: "nonfoil",
          currency: "USD",
          date: "2026-07-28",
          gameAvailability: "paper",
          price: "1.11",
          priceProvider: "cardkingdom",
          providerListing: "retail",
          uuid: frontUuid,
        },
        {
          cardFinish: "foil",
          currency: "USD",
          date: "2026-07-29",
          gameAvailability: "paper",
          price: "2.22",
          priceProvider: "tcgplayer",
          providerListing: "retail",
          uuid: backUuid,
        },
      ]
    ),
    writeCsv(
      path.join(fixtureDirectory, "cardPurchaseUrls.csv"),
      "uuid,cardKingdom,cardKingdomFoil,cardKingdomEtched,cardmarket,cardmarketFoil,tcgplayer,tcgplayerEtched,tcgplayerAlternativeFoil",
      [
        {
          cardKingdom: "https://example.test/front-cardkingdom",
          uuid: frontUuid,
        },
        {
          tcgplayerAlternativeFoil: "https://example.test/back-tcgplayer",
          uuid: backUuid,
        },
      ]
    ),
    writeCsv(
      path.join(fixtureDirectory, "cardIdentifiers.csv"),
      "uuid,scryfallId,scryfallOracleId,scryfallIllustrationId,scryfallCardBackId,mcmId,mcmMetaId,mtgArenaId,mtgoId,mtgoFoilId,multiverseId,tcgplayerProductId,tcgplayerEtchedProductId,tcgplayerAlternativeFoilProductId,cardKingdomId,cardKingdomFoilId,cardKingdomEtchedId,cardsphereId,cardsphereAlternativeFoilId,cardsphereEtchedId,cardsphereFoilId,deckboxId,mtgjsonFoilVersionId,mtgjsonNonFoilVersionId,mtgjsonV4Id",
      [
        { scryfallId, uuid: frontUuid },
        { scryfallId, uuid: backUuid },
      ]
    ),
  ]);
}

async function writeCsv(filePath, header, rows) {
  const columns = header.split(",");
  const lines = [
    header,
    ...rows.map((row) =>
      columns.map((column) => escapeCsvValue(row[column] || "")).join(",")
    ),
  ];
  await fsp.writeFile(filePath, `${lines.join("\n")}\n`);
}

function escapeCsvValue(value) {
  const textValue = String(value);

  return /[",\n]/.test(textValue)
    ? `"${textValue.replaceAll('"', '""')}"`
    : textValue;
}

function runRealCatalogImporter(fixtureDirectory, databaseUrl) {
  const importerPath = path.resolve(
    __dirname,
    "../../../scripts/import-mtg-catalog.js"
  );
  const result = spawnSync(process.execPath, [importerPath], {
    cwd: path.resolve(__dirname, "../../.."),
    encoding: "utf8",
    env: {
      ...process.env,
      MTG_CARDS_CSV: path.join(fixtureDirectory, "cards.csv"),
      MTG_CARD_IDENTIFIERS_CSV: path.join(
        fixtureDirectory,
        "cardIdentifiers.csv"
      ),
      MTG_CARD_PRICES_CSV: path.join(fixtureDirectory, "cardPrices.csv"),
      MTG_CARD_PURCHASE_URLS_CSV: path.join(
        fixtureDirectory,
        "cardPurchaseUrls.csv"
      ),
      MTG_IMPORT_DATABASE_URL: databaseUrl,
      MTG_SETS_CSV: path.join(fixtureDirectory, "sets.csv"),
    },
  });

  assert.equal(result.status, 0, result.stderr);
}

function readMultifaceImportState(databaseUrl) {
  const cardsResult = runPsql(
    databaseUrl,
    `
select coalesce(json_agg(row_to_json(cards) order by cards.external_id), '[]')
from (
  select
    cards.external_id,
    cards.name,
    cards.collector_number,
    details.scryfall_id,
    details.mana_cost,
    details.mana_value::text,
    details.type_line,
    details.oracle_text,
    details.layout
  from public.cards cards
  left join public.mtg_card_details details
  on details.card_id = cards.id
  where cards.tcg_id = 'mtg'
) cards;
`
  );
  const pricesResult = runPsql(
    databaseUrl,
    `
select coalesce(json_agg(row_to_json(prices) order by prices.source), '[]')
from (
  select
    cards.external_id,
    market_prices.source::text,
    market_prices.finish,
    market_prices.amount::text,
    market_prices.buy_url
  from public.card_market_prices market_prices
  inner join public.cards cards
  on cards.tcg_id = market_prices.tcg_id
  and cards.id = market_prices.card_id
  where market_prices.tcg_id = 'mtg'
) prices;
`
  );

  assertPsqlSucceeded(cardsResult);
  assertPsqlSucceeded(pricesResult);

  return {
    cards: JSON.parse(cardsResult.stdout.trim()),
    prices: JSON.parse(pricesResult.stdout.trim()),
  };
}

function createSpawnProcess(exitCode, signal) {
  return (command, args, options) => {
    assert.equal(command, process.execPath);
    assert.ok(path.isAbsolute(args[0]));
    assert.deepEqual(options.stdio, ["ignore", "inherit", "inherit"]);

    const child = new EventEmitter();
    queueMicrotask(() => child.emit("close", exitCode, signal));
    return child;
  };
}

async function listTempDirectories(prefix) {
  const entries = await fsp.readdir(os.tmpdir(), { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .map((entry) => path.join(os.tmpdir(), entry.name))
    .sort();
}

async function findNewTempDirectory(prefix, directoriesBefore) {
  const directories = await listTempDirectories(prefix);
  return directories.find(
    (directory) => !directoriesBefore.includes(directory)
  );
}
