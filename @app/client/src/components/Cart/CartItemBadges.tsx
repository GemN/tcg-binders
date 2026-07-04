import { useTranslation } from "react-i18next";

import { CardConditionBadge } from "@/components/CardConditionBadge";
import { CardFinishBadge } from "@/components/CardFinishBadge";
import {
  type CartTranslate,
  getCartItemOptionLabel,
} from "@/components/Cart/cartFormat";
import { CountryFlag } from "@/components/CountryFlag";
import { cardLanguageFlagCodes } from "@/config/card";
import type { CartItem } from "@/lib/cart";

interface CartItemBadgesProps {
  item: CartItem;
}

export const CartItemBadges = ({ item }: CartItemBadgesProps) => {
  const { t } = useTranslation(["common"]);
  const translate = t as unknown as CartTranslate;
  const languageLabel = getCartItemOptionLabel({
    group: "language",
    t: translate,
    value: item.language,
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {item.condition && (
        <CardConditionBadge
          condition={item.condition}
          className="h-5 rounded-sm"
          showTooltip
        />
      )}
      {item.language && languageLabel && (
        <CountryFlag
          code={cardLanguageFlagCodes[item.language]}
          className="h-[18px] w-6"
          label={languageLabel}
          showTooltip
        />
      )}
      <CardFinishBadge
        finish={item.finish}
        display="icon-label"
        className="h-5"
      />
    </div>
  );
};
