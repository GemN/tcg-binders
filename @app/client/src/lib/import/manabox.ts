import { defaultCardFinish } from "@/config/card";

import type {
  BinderImportItem,
  BinderImportParseResult,
  BinderImportRejectedLine,
} from "./types";
import {
  parseCondition,
  parseLanguage,
  parseQuantity,
} from "./utils";

export const parseManaBoxCsvImport = (
  text: string
): BinderImportParseResult => {
  const rows = parseCsvRows(text);
  const [header, ...body] = rows;
  const items: BinderImportItem[] = [];
  const rejectedLines: BinderImportRejectedLine[] = [];

  if (!header) {
    return {
      items,
      rejectedLines: [
        { line: 1, reason: "Missing CSV header", value: text.trim() },
      ],
    };
  }

  const columns = new Map(
    header.map((column, index) => [column.trim().toLowerCase(), index])
  );

  body.forEach((row, index) => {
    const sourceLine = index + 2;
    const name = getCsvValue(row, columns, "name");
    if (!name) {
      rejectedLines.push({
        line: sourceLine,
        reason: "Missing card name",
        value: row.join(","),
      });
      return;
    }

    const quantity = parseQuantity(getCsvValue(row, columns, "quantity"));
    if (!quantity) {
      rejectedLines.push({
        line: sourceLine,
        reason: "Invalid quantity",
        value: row.join(","),
      });
      return;
    }

    items.push({
      collectorNumber:
        getCsvValue(row, columns, "collector number") || undefined,
      condition: parseCondition(getCsvValue(row, columns, "condition")),
      finish: parseManaBoxFinish(getCsvValue(row, columns, "foil")),
      language: parseLanguage(getCsvValue(row, columns, "language")),
      name,
      quantity,
      setCode: getCsvValue(row, columns, "set code")?.toUpperCase(),
      sourceLine,
    });
  });

  return { items, rejectedLines };
};

const parseCsvRows = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows;
};

const getCsvValue = (
  row: string[],
  columns: Map<string, number>,
  column: string
): string => {
  const index = columns.get(column);
  if (index === undefined) return "";
  return (row[index] || "").trim();
};

const parseManaBoxFinish = (value: string): string => {
  if (value.toLowerCase() === "foil") return "foil";
  return defaultCardFinish;
};
