import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { CartEmptyState } from "@/components/Cart/CartEmptyState";
import { CartMobileSummaryBar } from "@/components/Cart/CartMobileSummaryBar";
import { CartSummaryPanel } from "@/components/Cart/CartSummaryPanel";
import { CartTableHeader } from "@/components/Cart/CartTableHeader";
import { SellerCartSection } from "@/components/Cart/SellerCartSection";
import {
  type SellerMessage,
  SellerMessagesSection,
} from "@/components/Cart/SellerMessagesSection";
import {
  type CartTranslate,
  formatAmount,
  formatTotals,
  getCartItemOptionLabel,
  getCartItemPrintLabel,
} from "@/components/Cart/cartFormat";
import { getCartSelectionState } from "@/components/Cart/cartSelection";
import {
  type CartCurrencyTotal,
  type CartEstimatedTotal,
  type CartItem,
  type CartSellerGroup,
  getCartCurrencyTotals,
  getCartUnpricedItemCount,
  getDominantCartCurrency,
  getEstimatedCartTotal,
  groupCartItems,
} from "@/lib/cart";
import { useCart } from "@/providers/CartContext";
import { usePricingSettings } from "@/providers/PricingSettingsContext";

interface GetSellerEstimatedTotalParams {
  convertAmountToTargetCurrency: ReturnType<
    typeof usePricingSettings
  >["convertAmountToTargetCurrency"];
  totals: CartCurrencyTotal[];
}

const getSellerEstimatedTotal = ({
  convertAmountToTargetCurrency,
  totals,
}: GetSellerEstimatedTotalParams): CartEstimatedTotal | null => {
  return getEstimatedCartTotal(
    totals,
    getDominantCartCurrency(totals),
    convertAmountToTargetCurrency
  );
};

interface GetCartItemDescriptionParams {
  item: CartItem;
  t: CartTranslate;
}

const getCartItemDescription = ({
  item,
  t,
}: GetCartItemDescriptionParams): string => {
  const printLabel = getCartItemPrintLabel({ item });
  const optionLabels = [
    getCartItemOptionLabel({
      group: "condition",
      t,
      value: item.condition,
    }),
    getCartItemOptionLabel({
      group: "language",
      t,
      value: item.language,
    }),
    getCartItemOptionLabel({
      group: "finish",
      t,
      value: item.finish,
    }),
  ].filter((label): label is string => !!label);
  const printSuffix = printLabel ? ` (${printLabel})` : "";
  const optionSuffix =
    optionLabels.length > 0 ? `, ${optionLabels.join(", ")}` : "";

  return `${item.quantity}x ${item.card.name}${printSuffix}${optionSuffix}`;
};

interface GetCartMessageLineParams {
  item: CartItem;
  locale: string;
  t: CartTranslate;
}

const getCartMessageLine = ({
  item,
  locale,
  t,
}: GetCartMessageLineParams): string => {
  const itemDescription = getCartItemDescription({ item, t });
  if (item.unitPriceAmount === null || !item.unitPriceCurrency) {
    return `- ${itemDescription}`;
  }

  const unitPrice = formatAmount({
    amount: item.unitPriceAmount,
    currency: item.unitPriceCurrency,
    locale,
  });
  const lineTotal = formatAmount({
    amount: item.unitPriceAmount * item.quantity,
    currency: item.unitPriceCurrency,
    locale,
  });

  return `- ${itemDescription} ${t("checkout:message.price_each", {
    lineTotal,
    unitPrice,
  })}`;
};

interface BuildSellerMessageParams {
  estimatedTotal: CartEstimatedTotal | null;
  group: CartSellerGroup;
  locale: string;
  t: CartTranslate;
  totals: CartCurrencyTotal[];
}

const buildSellerMessage = ({
  estimatedTotal,
  group,
  locale,
  t,
  totals,
}: BuildSellerMessageParams): string => {
  const lines = [
    t("checkout:message.greeting", { seller: group.seller.nickname }),
    "",
  ];
  let hasUnpricedItems = false;

  group.binders.forEach((binderGroup, binderIndex) => {
    if (binderIndex > 0) {
      lines.push("");
    }

    lines.push(
      t("checkout:message.binder", { binder: binderGroup.binder.name })
    );

    const binderNote = binderGroup.binder.note.trim();
    if (binderNote) {
      lines.push(t("checkout:message.binder_note"));
      lines.push(binderNote);
    }

    lines.push("");

    const pricedItems = binderGroup.items.filter(
      (item) => item.unitPriceAmount !== null && !!item.unitPriceCurrency
    );
    const unpricedItems = binderGroup.items.filter(
      (item) => item.unitPriceAmount === null || !item.unitPriceCurrency
    );

    pricedItems.forEach((item) => {
      lines.push(getCartMessageLine({ item, locale, t }));
    });

    if (unpricedItems.length > 0) {
      hasUnpricedItems = true;

      if (pricedItems.length > 0) {
        lines.push("");
      }

      lines.push(t("checkout:message.unpriced_title"));
      unpricedItems.forEach((item) => {
        lines.push(getCartMessageLine({ item, locale, t }));
      });
    }
  });

  if (totals.length > 0) {
    lines.push("");
    lines.push(
      t("checkout:message.total", {
        total: formatTotals({ locale, totals }),
      })
    );
  }

  if (estimatedTotal) {
    lines.push(
      t("checkout:message.estimated_total", {
        total: formatAmount({
          amount: estimatedTotal.amount,
          currency: estimatedTotal.currency,
          locale,
        }),
      })
    );
  }

  if (hasUnpricedItems) {
    lines.push("");
    lines.push(t("checkout:message.unpriced_notice"));
  }

  return lines.join("\n");
};

const areStringSetsEqual = (
  firstSet: ReadonlySet<string>,
  secondSet: ReadonlySet<string>
): boolean => {
  if (firstSet.size !== secondSet.size) return false;

  for (const value of firstSet) {
    if (!secondSet.has(value)) return false;
  }

  return true;
};

export const Cart = () => {
  const { i18n, t } = useTranslation(["checkout", "common"]);
  const {
    clearBinderCartItems,
    clearCart,
    clearSellerCartItems,
    itemCount,
    items,
    removeCartItem,
    updateCartItemQuantity,
  } = useCart();
  const { convertAmountToTargetCurrency } = usePricingSettings();
  const translate = t as unknown as CartTranslate;
  const [hasGeneratedMessages, setHasGeneratedMessages] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    () => new Set()
  );
  const previousItemIdsRef = useRef<Set<string>>(new Set());
  const sellerGroups = useMemo(() => groupCartItems(items), [items]);
  const cartItemIds = useMemo(
    () => items.map((item) => item.binderCardId),
    [items]
  );
  const selectedItems = useMemo(
    () => items.filter((item) => selectedItemIds.has(item.binderCardId)),
    [items, selectedItemIds]
  );
  const selectedSellerGroups = useMemo(
    () => groupCartItems(selectedItems),
    [selectedItems]
  );
  const selectedTotals = useMemo(
    () => getCartCurrencyTotals(selectedItems),
    [selectedItems]
  );
  const selectedEstimatedTotal = useMemo(() => {
    return getEstimatedCartTotal(
      selectedTotals,
      getDominantCartCurrency(selectedTotals),
      convertAmountToTargetCurrency
    );
  }, [convertAmountToTargetCurrency, selectedTotals]);
  const selectedItemCount = useMemo(
    () => selectedItems.reduce((total, item) => total + item.quantity, 0),
    [selectedItems]
  );
  const selectedBinderCount = useMemo(() => {
    return selectedSellerGroups.reduce(
      (total, group) => total + group.binders.length,
      0
    );
  }, [selectedSellerGroups]);
  const unpricedItemCount = useMemo(
    () => getCartUnpricedItemCount(items),
    [items]
  );
  const selectedUnpricedItemCount = useMemo(
    () => getCartUnpricedItemCount(selectedItems),
    [selectedItems]
  );
  const allSelectionState = useMemo(
    () => getCartSelectionState(items, selectedItemIds),
    [items, selectedItemIds]
  );
  const sellerMessages = useMemo<SellerMessage[]>(() => {
    return selectedSellerGroups.map((group) => {
      const sellerTotals = getCartCurrencyTotals(group.items);
      const sellerEstimatedTotal = getSellerEstimatedTotal({
        convertAmountToTargetCurrency,
        totals: sellerTotals,
      });

      return {
        message: buildSellerMessage({
          estimatedTotal: sellerEstimatedTotal,
          group,
          locale: i18n.language,
          t: translate,
          totals: sellerTotals,
        }),
        sellerId: group.seller.id,
        sellerName: group.seller.nickname,
      };
    });
  }, [
    convertAmountToTargetCurrency,
    i18n.language,
    selectedSellerGroups,
    translate,
  ]);

  const handleGroupSelectionChange = useCallback(
    (binderCardIds: string[], isSelected: boolean) => {
      setSelectedItemIds((currentItemIds) => {
        const nextItemIds = new Set(currentItemIds);
        let didChange = false;

        binderCardIds.forEach((binderCardId) => {
          if (isSelected) {
            if (!nextItemIds.has(binderCardId)) {
              nextItemIds.add(binderCardId);
              didChange = true;
            }

            return;
          }

          if (nextItemIds.delete(binderCardId)) {
            didChange = true;
          }
        });

        return didChange ? nextItemIds : currentItemIds;
      });
    },
    []
  );

  const handleItemSelectionChange = useCallback(
    (binderCardId: string, isSelected: boolean) => {
      handleGroupSelectionChange([binderCardId], isSelected);
    },
    [handleGroupSelectionChange]
  );

  useEffect(() => {
    setHasGeneratedMessages(false);
  }, [items, selectedItemIds]);

  useEffect(() => {
    const itemIds = new Set(cartItemIds);

    setSelectedItemIds((currentItemIds) => {
      const nextItemIds = new Set<string>();

      currentItemIds.forEach((binderCardId) => {
        if (itemIds.has(binderCardId)) {
          nextItemIds.add(binderCardId);
        }
      });

      itemIds.forEach((binderCardId) => {
        if (!previousItemIdsRef.current.has(binderCardId)) {
          nextItemIds.add(binderCardId);
        }
      });

      return areStringSetsEqual(currentItemIds, nextItemIds)
        ? currentItemIds
        : nextItemIds;
    });

    previousItemIdsRef.current = itemIds;
  }, [cartItemIds]);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-[92rem] flex-1 flex-col px-4 pb-28 sm:px-6 lg:px-8 lg:pb-8">
        {items.length === 0 ? (
          <CartEmptyState />
        ) : (
          <div className="grid flex-1 gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="grid min-w-0 content-start gap-5">
              <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="font-display text-3xl font-bold">
                    {t("checkout:title")}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("checkout:item_count", { count: itemCount })}
                  </p>
                </div>
                {unpricedItemCount > 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-yellow-100 px-3 py-2 text-sm text-yellow-900">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      {t("checkout:unpriced_count", {
                        count: unpricedItemCount,
                      })}
                    </span>
                  </div>
                )}
              </header>
              <CartTableHeader
                selectionState={allSelectionState}
                onSelectionChange={(isSelected) =>
                  handleGroupSelectionChange(cartItemIds, isSelected)
                }
              />

              <div className="grid gap-5">
                {sellerGroups.map((group) => (
                  <SellerCartSection
                    key={group.seller.id}
                    group={group}
                    locale={i18n.language}
                    selectedItemIds={selectedItemIds}
                    selectionState={getCartSelectionState(
                      group.items,
                      selectedItemIds
                    )}
                    onClearBinder={clearBinderCartItems}
                    onClearSeller={clearSellerCartItems}
                    onGroupSelectionChange={handleGroupSelectionChange}
                    onItemSelectionChange={handleItemSelectionChange}
                    onQuantityChange={updateCartItemQuantity}
                    onRemove={removeCartItem}
                  />
                ))}
              </div>

              {hasGeneratedMessages && (
                <SellerMessagesSection messages={sellerMessages} />
              )}
            </div>

            <div className="hidden lg:block">
              <CartSummaryPanel
                binderCount={selectedBinderCount}
                estimatedTotal={selectedEstimatedTotal}
                itemCount={selectedItemCount}
                locale={i18n.language}
                sellerCount={selectedSellerGroups.length}
                totals={selectedTotals}
                unpricedItemCount={selectedUnpricedItemCount}
                isGenerateDisabled={selectedItems.length === 0}
                onClearCart={clearCart}
                onGenerateMessages={() => setHasGeneratedMessages(true)}
              />
            </div>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <CartMobileSummaryBar
          isGenerateDisabled={selectedItems.length === 0}
          itemCount={selectedItemCount}
          locale={i18n.language}
          totals={selectedTotals}
          onGenerateMessages={() => setHasGeneratedMessages(true)}
        />
      )}
    </div>
  );
};
