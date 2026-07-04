import { createContext, useContext } from "react";

import type { CartAddResult, CartItem, CartItemInput } from "@/lib/cart";

export interface CartContextValue {
  addCartItem: (item: CartItemInput) => CartAddResult | null;
  clearBinderCartItems: (binderId: string) => void;
  clearCart: () => void;
  clearSellerCartItems: (sellerId: string) => void;
  dismissLastAddedCartItem: () => void;
  itemCount: number;
  items: CartItem[];
  lastAddedCartItem: CartItem | null;
  removeCartItem: (binderCardId: string) => void;
  undoLastCartAddition: () => void;
  updateCartItemQuantity: (binderCardId: string, quantity: number) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
};
