import {
  defaultCardCondition,
  defaultCardFinish,
  defaultCardLanguage,
} from "@/config/card";

import type {
  BinderImportItem,
  BinderImportParseResult,
  BinderImportRejectedLine,
} from "./types";
import { parseQuantity } from "./utils";

export interface BinderTextExportItem {
  collectorNumber: string;
  finish?: string | null;
  name: string;
  quantity: number;
  setCode: string;
}

const textImportRowPattern =
  /^(\d+)\s+(.+)\s+\(([A-Za-z0-9]+)\)\s+(\S+)(?:\s+\*F\*)?$/;
const textImportNameOnlyRowPattern = /^(\d+)\s+(.+?)(?:\s+\*F\*)?$/;
const textImportFoilPattern = /\s+\*F\*$/;

export const parseBinderImportText = (
  text: string
): BinderImportParseResult => {
  const items: BinderImportItem[] = [];
  const rejectedLines: BinderImportRejectedLine[] = [];

  text.split(/\r?\n/).forEach((line, index) => {
    const value = line.trim();
    if (!value) return;
    if (value.toLowerCase() === "sideboard") return;

    const printMatch = value.match(textImportRowPattern);
    const nameOnlyMatch = printMatch
      ? null
      : value.match(textImportNameOnlyRowPattern);
    if (!printMatch && !nameOnlyMatch) {
      rejectedLines.push({
        line: index + 1,
        reason: "Unsupported line format",
        value,
      });
      return;
    }

    const quantityValue = printMatch?.[1] || nameOnlyMatch?.[1];
    const name = printMatch?.[2] || nameOnlyMatch?.[2] || "";
    const quantity = parseQuantity(quantityValue);
    if (!quantity) {
      rejectedLines.push({
        line: index + 1,
        reason: "Invalid quantity",
        value,
      });
      return;
    }

    const item: BinderImportItem = {
      condition: defaultCardCondition,
      finish: textImportFoilPattern.test(value) ? "foil" : defaultCardFinish,
      language: defaultCardLanguage,
      name: name.trim(),
      quantity,
      sourceLine: index + 1,
    };

    if (printMatch) {
      item.collectorNumber = printMatch[4].trim();
      item.setCode = printMatch[3].toUpperCase();
    }

    items.push(item);
  });

  return { items, rejectedLines };
};

export const exportBinderImportText = (
  items: BinderTextExportItem[]
): string => {
  return items
    .map((item) => {
      const finishSuffix = item.finish === "foil" ? " *F*" : "";
      return `${item.quantity} ${item.name.trim()} (${item.setCode.trim().toUpperCase()}) ${item.collectorNumber.trim()}${finishSuffix}`;
    })
    .join("\n");
};
