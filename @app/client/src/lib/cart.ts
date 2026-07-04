import type { CardCondition, CurrencyCode, LanguageCode } from "@app/graphql";

import type { ConvertAmountToTargetCurrency } from "@/providers/PricingSettingsContext";

export interface CartSellerSnapshot {
  country: string | null;
  id: string;
  nickname: string;
}

export interface CartBinderSnapshot {
  id: string;
  name: string;
  note: string;
  shortId: string;
}

export interface CartCardSnapshot {
  collectorNumber: string | null;
  imageUrl: string | null;
  name: string;
  scryfallId: string | null;
  setCode: string | null;
  setName: string | null;
}

export interface CartItem {
  addedAt: string;
  availableQuantity: number;
  binder: CartBinderSnapshot;
  binderCardId: string;
  card: CartCardSnapshot;
  condition: CardCondition | null;
  finish: string | null;
  isPreview: boolean;
  language: LanguageCode | null;
  quantity: number;
  seller: CartSellerSnapshot;
  unitPriceAmount: number | null;
  unitPriceCurrency: CurrencyCode | null;
  updatedAt: string;
}

export interface CartItemInput {
  availableQuantity: number;
  binder: CartBinderSnapshot;
  binderCardId: string;
  card: CartCardSnapshot;
  condition: CardCondition | null;
  finish: string | null;
  isPreview: boolean;
  language: LanguageCode | null;
  seller: CartSellerSnapshot;
  unitPriceAmount: number | null;
  unitPriceCurrency: CurrencyCode | null;
}

export interface CartAddResult {
  item: CartItem;
  wasCapped: boolean;
}

export interface CartCurrencyTotal {
  amount: number;
  currency: CurrencyCode;
  quantity: number;
}

export interface CartEstimatedTotal {
  amount: number;
  currency: CurrencyCode;
}

export interface CartBinderGroup {
  binder: CartBinderSnapshot;
  items: CartItem[];
}

export interface CartSellerGroup {
  binders: CartBinderGroup[];
  items: CartItem[];
  seller: CartSellerSnapshot;
}

interface StoredCart {
  items?: unknown;
  version?: unknown;
}

const cartStorageKey = "tcgbinder.cart.v1";
const cartStorageVersion = 1;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readString = (value: unknown): string | null => {
  return typeof value === "string" ? value : null;
};

const readOptionalString = (value: unknown): string | null => {
  return typeof value === "string" && value.trim() ? value : null;
};

const readBoolean = (value: unknown): boolean => {
  return typeof value === "boolean" ? value : false;
};

const readQuantity = (value: unknown): number => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 1;

  return Math.max(1, Math.floor(numericValue));
};

const readAvailableQuantity = (value: unknown): number => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;

  return Math.max(0, Math.floor(numericValue));
};

const readPriceAmount = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) return null;

  return numericValue;
};

const readCurrency = (value: unknown): CurrencyCode | null => {
  return typeof value === "string" && value.trim()
    ? (value as CurrencyCode)
    : null;
};

const readCondition = (value: unknown): CardCondition | null => {
  return typeof value === "string" && value.trim()
    ? (value as CardCondition)
    : null;
};

const readLanguage = (value: unknown): LanguageCode | null => {
  return typeof value === "string" && value.trim()
    ? (value as LanguageCode)
    : null;
};

const readIsoDate = (value: unknown, fallback: string): string => {
  const dateValue = readString(value);
  if (!dateValue) return fallback;

  const parsedTime = Date.parse(dateValue);
  return Number.isFinite(parsedTime) ? dateValue : fallback;
};

const readCartSeller = (
  value: unknown,
  fallbackSeller?: CartSellerSnapshot
): CartSellerSnapshot | null => {
  if (!isRecord(value)) return fallbackSeller ?? null;

  const id = readString(value.id);
  const nickname = readString(value.nickname);
  if (!id || !nickname) return fallbackSeller ?? null;

  return {
    country: readOptionalString(value.country),
    id,
    nickname,
  };
};

const readCartBinder = (
  value: unknown,
  fallbackBinder?: CartBinderSnapshot
): CartBinderSnapshot | null => {
  if (!isRecord(value)) return fallbackBinder ?? null;

  const id = readString(value.id);
  const name = readString(value.name);
  const shortId = readString(value.shortId);
  if (!id || !name || !shortId) return fallbackBinder ?? null;

  return {
    id,
    name,
    note: readString(value.note) ?? "",
    shortId,
  };
};

const readCartCard = (
  value: unknown,
  fallbackCard?: CartCardSnapshot
): CartCardSnapshot | null => {
  if (!isRecord(value)) return fallbackCard ?? null;

  const name = readString(value.name);
  if (!name) return fallbackCard ?? null;

  return {
    collectorNumber: readOptionalString(value.collectorNumber),
    imageUrl: readOptionalString(value.imageUrl),
    name,
    scryfallId: readOptionalString(value.scryfallId),
    setCode: readOptionalString(value.setCode),
    setName: readOptionalString(value.setName),
  };
};

const normalizeCartItem = (
  value: unknown,
  fallback?: Partial<CartItem>
): CartItem | null => {
  if (!isRecord(value)) return null;

  const fallbackDate = new Date().toISOString();
  const binderCardId =
    readString(value.binderCardId) ?? fallback?.binderCardId ?? null;
  const seller = readCartSeller(value.seller, fallback?.seller);
  const binder = readCartBinder(value.binder, fallback?.binder);
  const card = readCartCard(value.card, fallback?.card);
  const availableQuantity = readAvailableQuantity(
    value.availableQuantity ?? fallback?.availableQuantity
  );

  if (!binderCardId || !seller || !binder || !card || availableQuantity < 1) {
    return null;
  }

  const unitPriceAmount = readPriceAmount(
    value.unitPriceAmount ?? fallback?.unitPriceAmount
  );
  const unitPriceCurrency = readCurrency(
    value.unitPriceCurrency ?? fallback?.unitPriceCurrency
  );
  const hasListedPrice = unitPriceAmount !== null && !!unitPriceCurrency;
  const quantity = Math.min(
    readQuantity(value.quantity ?? fallback?.quantity),
    availableQuantity
  );

  return {
    addedAt: readIsoDate(value.addedAt ?? fallback?.addedAt, fallbackDate),
    availableQuantity,
    binder,
    binderCardId,
    card,
    condition: readCondition(value.condition ?? fallback?.condition),
    finish: readOptionalString(value.finish ?? fallback?.finish),
    isPreview: readBoolean(value.isPreview ?? fallback?.isPreview),
    language: readLanguage(value.language ?? fallback?.language),
    quantity,
    seller,
    unitPriceAmount: hasListedPrice ? unitPriceAmount : null,
    unitPriceCurrency: hasListedPrice ? unitPriceCurrency : null,
    updatedAt: readIsoDate(
      value.updatedAt ?? fallback?.updatedAt,
      fallbackDate
    ),
  };
};

export const readStoredCartItems = (): CartItem[] => {
  if (typeof window === "undefined") return [];

  const storedValue = window.localStorage.getItem(cartStorageKey);
  if (!storedValue) return [];

  try {
    const parsedValue = JSON.parse(storedValue) as StoredCart;
    if (!isRecord(parsedValue) || !Array.isArray(parsedValue.items)) return [];

    return parsedValue.items
      .map((item) => normalizeCartItem(item))
      .filter((item): item is CartItem => !!item);
  } catch {
    return [];
  }
};

export const writeStoredCartItems = (items: CartItem[]) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    cartStorageKey,
    JSON.stringify({
      items,
      version: cartStorageVersion,
    })
  );
};

export const addCartItemToList = (
  items: CartItem[],
  input: CartItemInput
): { items: CartItem[]; result: CartAddResult | null } => {
  const now = new Date().toISOString();
  const incomingItem = normalizeCartItem({
    ...input,
    addedAt: now,
    quantity: 1,
    updatedAt: now,
  });

  if (!incomingItem) {
    return { items, result: null };
  }

  const existingItem = items.find(
    (item) => item.binderCardId === incomingItem.binderCardId
  );

  if (!existingItem) {
    return {
      items: [...items, incomingItem],
      result: {
        item: incomingItem,
        wasCapped: false,
      },
    };
  }

  const nextQuantity = Math.min(
    existingItem.quantity + 1,
    incomingItem.availableQuantity
  );
  const wasCapped = nextQuantity === existingItem.quantity;
  const nextItem: CartItem = {
    ...incomingItem,
    addedAt: existingItem.addedAt,
    quantity: nextQuantity,
    updatedAt: now,
  };

  return {
    items: items.map((item) =>
      item.binderCardId === nextItem.binderCardId ? nextItem : item
    ),
    result: { item: nextItem, wasCapped },
  };
};

export const updateCartItemQuantityInList = (
  items: CartItem[],
  binderCardId: string,
  quantity: number
): CartItem[] => {
  return items.map((item) => {
    if (item.binderCardId !== binderCardId) return item;

    return {
      ...item,
      quantity: Math.min(
        Math.max(1, Math.floor(quantity)),
        item.availableQuantity
      ),
      updatedAt: new Date().toISOString(),
    };
  });
};

export const removeCartItemFromList = (
  items: CartItem[],
  binderCardId: string
): CartItem[] => {
  return items.filter((item) => item.binderCardId !== binderCardId);
};

export const removeSellerCartItemsFromList = (
  items: CartItem[],
  sellerId: string
): CartItem[] => {
  return items.filter((item) => item.seller.id !== sellerId);
};

export const removeBinderCartItemsFromList = (
  items: CartItem[],
  binderId: string
): CartItem[] => {
  return items.filter((item) => item.binder.id !== binderId);
};

export const getCartItemCount = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

export const getCartUnpricedItemCount = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    return item.unitPriceAmount === null || !item.unitPriceCurrency
      ? total + item.quantity
      : total;
  }, 0);
};

export const getCartCurrencyTotals = (
  items: CartItem[]
): CartCurrencyTotal[] => {
  const totalsByCurrency = new Map<CurrencyCode, CartCurrencyTotal>();

  items.forEach((item) => {
    if (item.unitPriceAmount === null || !item.unitPriceCurrency) return;

    const currentTotal = totalsByCurrency.get(item.unitPriceCurrency) ?? {
      amount: 0,
      currency: item.unitPriceCurrency,
      quantity: 0,
    };

    totalsByCurrency.set(item.unitPriceCurrency, {
      ...currentTotal,
      amount: currentTotal.amount + item.unitPriceAmount * item.quantity,
      quantity: currentTotal.quantity + item.quantity,
    });
  });

  return [...totalsByCurrency.values()].sort((a, b) =>
    a.currency.localeCompare(b.currency)
  );
};

export const getDominantCartCurrency = (
  totals: CartCurrencyTotal[]
): CurrencyCode | null => {
  if (totals.length === 0) return null;

  return [...totals].sort((a, b) => {
    if (b.quantity !== a.quantity) return b.quantity - a.quantity;
    return a.currency.localeCompare(b.currency);
  })[0].currency;
};

export const getEstimatedCartTotal = (
  totals: CartCurrencyTotal[],
  targetCurrency: CurrencyCode | null,
  convertAmountToTargetCurrency: ConvertAmountToTargetCurrency
): CartEstimatedTotal | null => {
  if (totals.length < 2 || !targetCurrency) return null;

  let amount = 0;

  for (const total of totals) {
    if (total.currency === targetCurrency) {
      amount += total.amount;
      continue;
    }

    const convertedAmount = convertAmountToTargetCurrency(
      total.amount,
      total.currency,
      targetCurrency
    );

    if (convertedAmount === null) return null;

    amount += convertedAmount;
  }

  return { amount, currency: targetCurrency };
};

export const groupCartItems = (items: CartItem[]): CartSellerGroup[] => {
  const sellerGroups: CartSellerGroup[] = [];

  items.forEach((item) => {
    let sellerGroup = sellerGroups.find(
      (group) => group.seller.id === item.seller.id
    );

    if (!sellerGroup) {
      sellerGroup = {
        binders: [],
        items: [],
        seller: item.seller,
      };
      sellerGroups.push(sellerGroup);
    }

    sellerGroup.items.push(item);

    let binderGroup = sellerGroup.binders.find(
      (group) => group.binder.id === item.binder.id
    );

    if (!binderGroup) {
      binderGroup = {
        binder: item.binder,
        items: [],
      };
      sellerGroup.binders.push(binderGroup);
    }

    binderGroup.items.push(item);
  });

  return sellerGroups;
};
