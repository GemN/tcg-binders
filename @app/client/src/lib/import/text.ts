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
const textImportFoilPattern = /\s+\*F\*$/;

export const parseBinderImportText = (
  text: string
): BinderImportParseResult => {
  const items: BinderImportItem[] = [];
  const rejectedLines: BinderImportRejectedLine[] = [];

  text.split(/\r?\n/).forEach((line, index) => {
    const value = line.trim();
    if (!value) return;

    const match = value.match(textImportRowPattern);
    if (!match) {
      rejectedLines.push({
        line: index + 1,
        reason: "Unsupported line format",
        value,
      });
      return;
    }

    const [, quantityValue, name, setCode, collectorNumber] = match;
    const quantity = parseQuantity(quantityValue);
    if (!quantity) {
      rejectedLines.push({
        line: index + 1,
        reason: "Invalid quantity",
        value,
      });
      return;
    }

    items.push({
      collectorNumber: collectorNumber.trim(),
      condition: defaultCardCondition,
      finish: textImportFoilPattern.test(value) ? "foil" : defaultCardFinish,
      language: defaultCardLanguage,
      name: name.trim(),
      quantity,
      setCode: setCode.toUpperCase(),
      sourceLine: index + 1,
    });
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
