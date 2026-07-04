import type { CartItem } from "@/lib/cart";

export type CartCheckboxState = boolean | "indeterminate";

export const getCartSelectionState = (
  items: CartItem[],
  selectedItemIds: ReadonlySet<string>
): CartCheckboxState => {
  if (items.length === 0) return false;

  const selectedCount = items.reduce((count, item) => {
    return selectedItemIds.has(item.binderCardId) ? count + 1 : count;
  }, 0);

  if (selectedCount === 0) return false;
  if (selectedCount === items.length) return true;

  return "indeterminate";
};
