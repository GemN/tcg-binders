#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const CURRENT_SQL_PATH = path.resolve(__dirname, "../schemas/current.sql");

if (process.argv.length < 3) {
  console.error("Error: Please provide a name for the migration.");
  console.error("Example: node commit.js add_users_table");
  process.exit(1);
}

const migrationName = process.argv[2];
let newMigrationPath = "";

function executeCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command} ${args.join(" ")}`);

    const childProcess = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

async function main() {
  try {
    const currentSqlContent = readFile(CURRENT_SQL_PATH);

    if (
      !currentSqlContent ||
      currentSqlContent.trim() === "-- Enter your migration here"
    ) {
      console.log("No changes to migrate in current.sql");
      process.exit(0);
    }

    console.log(`Creating new migration: ${migrationName}`);
    await executeCommand("supabase", ["migration", "new", migrationName]);

    const migrationsDir = path.resolve(__dirname, "../migrations");
    const files = fs.readdirSync(migrationsDir);

    const sortedFiles = files.sort((a, b) => {
      return (
        fs.statSync(path.join(migrationsDir, b)).mtime.getTime() -
        fs.statSync(path.join(migrationsDir, a)).mtime.getTime()
      );
    });

    if (sortedFiles.length === 0) {
      throw new Error("No migration file found");
    }

    newMigrationPath = path.join(migrationsDir, sortedFiles[0]);
    console.log(`New migration file: ${newMigrationPath}`);

    writeFile(newMigrationPath, currentSqlContent);
    console.log("Content from current.sql copied to migration file");

    console.log("Applying migration...");
    await executeCommand("supabase", ["migration", "up"]);

    console.log("Migration applied successfully");
    writeFile(CURRENT_SQL_PATH, "-- Enter your migration here");
    console.log("current.sql reset");

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration process:", error.message);

    if (newMigrationPath && fs.existsSync(newMigrationPath)) {
      console.log(`Deleting migration file: ${newMigrationPath}`);
      fs.unlinkSync(newMigrationPath);
    }

    process.exit(1);
  }
}

main();
