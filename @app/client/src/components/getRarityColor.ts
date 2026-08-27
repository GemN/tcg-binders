export const getRarityColor = (rarity: string): string => {
  switch (rarity.toLowerCase()) {
    case "uncommon":
      return "#8B8F97";
    case "rare":
      return "#C49A32";
    case "mythic":
      return "#D25A2C";
    default:
      return "#1E1E1E";
  }
};
