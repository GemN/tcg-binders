import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  addCartItemToList,
  getCartItemCount,
  readStoredCartItems,
  removeBinderCartItemsFromList,
  removeCartItemFromList,
  removeSellerCartItemsFromList,
  updateCartItemQuantityInList,
  writeStoredCartItems,
  type CartAddResult,
  type CartItem,
  type CartItemInput,
} from "@/lib/cart";
import { CartContext } from "@/providers/CartContext";

interface CartProviderProps {
  children: ReactNode;
}

interface LastCartAddition {
  item: CartItem;
  previousItem: CartItem | null;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>(readStoredCartItems);
  const [lastAddedCartItem, setLastAddedCartItem] = useState<CartItem | null>(
    null
  );
  const itemsRef = useRef(items);
  const lastCartAdditionRef = useRef<LastCartAddition | null>(null);

  useEffect(() => {
    itemsRef.current = items;
    writeStoredCartItems(items);
  }, [items]);

  const dismissLastAddedCartItem = useCallback(() => {
    lastCartAdditionRef.current = null;
    setLastAddedCartItem(null);
  }, []);

  const addCartItem = useCallback(
    (item: CartItemInput): CartAddResult | null => {
      const previousItem =
        itemsRef.current.find(
          (cartItem) => cartItem.binderCardId === item.binderCardId
        ) ?? null;
      const nextCart = addCartItemToList(itemsRef.current, item);
      if (!nextCart.result) return null;

      itemsRef.current = nextCart.items;
      setItems(nextCart.items);

      if (!nextCart.result.wasCapped) {
        lastCartAdditionRef.current = {
          item: nextCart.result.item,
          previousItem,
        };
        setLastAddedCartItem(nextCart.result.item);
      }

      return nextCart.result;
    },
    []
  );

  const undoLastCartAddition = useCallback(() => {
    const lastCartAddition = lastCartAdditionRef.current;
    if (!lastCartAddition) return;

    const { item, previousItem } = lastCartAddition;
    const nextItems = previousItem
      ? itemsRef.current.map((cartItem) =>
          cartItem.binderCardId === item.binderCardId ? previousItem : cartItem
        )
      : removeCartItemFromList(itemsRef.current, item.binderCardId);

    itemsRef.current = nextItems;
    setItems(nextItems);
    dismissLastAddedCartItem();
  }, [dismissLastAddedCartItem]);

  const updateCartItemQuantity = useCallback(
    (binderCardId: string, quantity: number) => {
      const nextItems = updateCartItemQuantityInList(
        itemsRef.current,
        binderCardId,
        quantity
      );
      itemsRef.current = nextItems;
      setItems(nextItems);
    },
    []
  );

  const removeCartItem = useCallback((binderCardId: string) => {
    const nextItems = removeCartItemFromList(itemsRef.current, binderCardId);
    itemsRef.current = nextItems;
    setItems(nextItems);
    if (lastCartAdditionRef.current?.item.binderCardId === binderCardId) {
      dismissLastAddedCartItem();
    }
  }, [dismissLastAddedCartItem]);

  const clearSellerCartItems = useCallback((sellerId: string) => {
    const nextItems = removeSellerCartItemsFromList(itemsRef.current, sellerId);
    itemsRef.current = nextItems;
    setItems(nextItems);
    if (lastCartAdditionRef.current?.item.seller.id === sellerId) {
      dismissLastAddedCartItem();
    }
  }, [dismissLastAddedCartItem]);

  const clearBinderCartItems = useCallback((binderId: string) => {
    const nextItems = removeBinderCartItemsFromList(itemsRef.current, binderId);
    itemsRef.current = nextItems;
    setItems(nextItems);
    if (lastCartAdditionRef.current?.item.binder.id === binderId) {
      dismissLastAddedCartItem();
    }
  }, [dismissLastAddedCartItem]);

  const clearCart = useCallback(() => {
    itemsRef.current = [];
    setItems([]);
    dismissLastAddedCartItem();
  }, [dismissLastAddedCartItem]);
  const itemCount = useMemo(() => getCartItemCount(items), [items]);
  const value = useMemo(
    () => ({
      addCartItem,
      clearBinderCartItems,
      clearCart,
      clearSellerCartItems,
      dismissLastAddedCartItem,
      itemCount,
      items,
      lastAddedCartItem,
      removeCartItem,
      undoLastCartAddition,
      updateCartItemQuantity,
    }),
    [
      addCartItem,
      clearBinderCartItems,
      clearCart,
      clearSellerCartItems,
      dismissLastAddedCartItem,
      itemCount,
      items,
      lastAddedCartItem,
      removeCartItem,
      undoLastCartAddition,
      updateCartItemQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
