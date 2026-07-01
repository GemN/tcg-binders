import { CardCondition } from "@app/graphql";

interface CardConditionStyle {
  abbreviation: string;
  color: string;
  textColor: string;
}

const conditionAbbreviations: Record<CardCondition, string> = {
  [CardCondition.Excellent]: "EX",
  [CardCondition.Good]: "GD",
  [CardCondition.LightPlayed]: "LP",
  [CardCondition.Mint]: "MT",
  [CardCondition.NearMint]: "NM",
  [CardCondition.Played]: "PL",
  [CardCondition.Poor]: "PO",
};

const conditionStyles: Record<CardCondition, CardConditionStyle> = {
  [CardCondition.Excellent]: {
    abbreviation: conditionAbbreviations[CardCondition.Excellent],
    color: "#82891e",
    textColor: "#ffffff",
  },
  [CardCondition.Good]: {
    abbreviation: conditionAbbreviations[CardCondition.Good],
    color: "#ffc107",
    textColor: "#333333",
  },
  [CardCondition.LightPlayed]: {
    abbreviation: conditionAbbreviations[CardCondition.LightPlayed],
    color: "#fd8b2b",
    textColor: "#ffffff",
  },
  [CardCondition.Mint]: {
    abbreviation: conditionAbbreviations[CardCondition.Mint],
    color: "#17a2b8",
    textColor: "#ffffff",
  },
  [CardCondition.NearMint]: {
    abbreviation: conditionAbbreviations[CardCondition.NearMint],
    color: "#3caf56",
    textColor: "#ffffff",
  },
  [CardCondition.Played]: {
    abbreviation: conditionAbbreviations[CardCondition.Played],
    color: "#e56874",
    textColor: "#ffffff",
  },
  [CardCondition.Poor]: {
    abbreviation: conditionAbbreviations[CardCondition.Poor],
    color: "#dc3545",
    textColor: "#ffffff",
  },
};

export const getCardConditionStyle = (
  condition: CardCondition | null | undefined
): CardConditionStyle => {
  if (!condition) {
    return {
      abbreviation: "-",
      color: "#6b7280",
      textColor: "#ffffff",
    };
  }

  return (
    conditionStyles[condition] || {
      abbreviation: condition.toUpperCase(),
      color: "#6b7280",
      textColor: "#ffffff",
    }
  );
};
