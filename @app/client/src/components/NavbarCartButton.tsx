import { ShoppingBasket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { NavbarCartNotice } from "@/components/NavbarCartNotice";
import { Button } from "@/components/ui/Button";
import { useNavbarCartNotice } from "@/hooks/useNavbarCartNotice";
import { useCart } from "@/providers/CartContext";

export const NavbarCartButton = () => {
  const { t } = useTranslation(["checkout"]);
  const {
    dismissLastAddedCartItem,
    itemCount,
    lastAddedCartItem,
    undoLastCartAddition,
  } = useCart();
  const {
    cartNoticeProgress,
    closeCartNotice,
    displayedCartItem,
    isCartNoticeVisible,
    pauseCartNotice,
    resumeCartNotice,
  } = useNavbarCartNotice({
    lastAddedCartItem,
    onDismissLastAddedCartItem: dismissLastAddedCartItem,
  });

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" asChild className="relative h-9 w-9">
        <Link to="/cart" aria-label={t("checkout:title")}>
          <ShoppingBasket className="size-6" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-5 text-white tabular-nums">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Link>
      </Button>
      {displayedCartItem && (
        <NavbarCartNotice
          isVisible={isCartNoticeVisible}
          item={displayedCartItem}
          itemCount={itemCount}
          progress={cartNoticeProgress}
          onDismiss={closeCartNotice}
          onMouseEnter={pauseCartNotice}
          onMouseLeave={resumeCartNotice}
          onUndo={undoLastCartAddition}
        />
      )}
    </div>
  );
};
