import { CardCondition } from "@app/graphql";

const conditionAbbreviations: Record<CardCondition, string> = {
  [CardCondition.Excellent]: "EX",
  [CardCondition.Good]: "GD",
  [CardCondition.LightPlayed]: "LP",
  [CardCondition.Mint]: "M",
  [CardCondition.NearMint]: "NM",
  [CardCondition.Played]: "PL",
  [CardCondition.Poor]: "PO",
};

export const getCardConditionAbbreviation = (
  condition: CardCondition | null | undefined
): string => {
  if (!condition) return "-";
  return conditionAbbreviations[condition] || condition.toUpperCase();
};
