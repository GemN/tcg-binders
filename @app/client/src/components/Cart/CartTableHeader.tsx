import { useTranslation } from "react-i18next";

import type { CartCheckboxState } from "@/components/Cart/cartSelection";
import { Checkbox } from "@/components/ui/Checkbox";

interface CartTableHeaderProps {
  selectionState: CartCheckboxState;
  onSelectionChange: (isSelected: boolean) => void;
}

export const CartTableHeader = ({
  selectionState,
  onSelectionChange,
}: CartTableHeaderProps) => {
  const { t } = useTranslation(["checkout"]);

  return (
    <div className="flex h-12 items-center gap-3 rounded-md border border-border bg-card px-3 text-xs font-semibold uppercase text-muted-foreground lg:grid lg:grid-cols-[2rem_minmax(0,1fr)_8rem_9rem_8rem_5rem] lg:gap-x-3 lg:px-8">
      <Checkbox
        aria-label={t("checkout:select_all")}
        checked={selectionState}
        className="lg:-translate-x-4"
        onCheckedChange={(checked) => onSelectionChange(checked === true)}
      />
      <span className="lg:hidden">{t("checkout:select_all")}</span>
      <span className="hidden lg:block">{t("checkout:product")}</span>
      <span className="hidden lg:block">{t("checkout:unit_price")}</span>
      <span className="hidden lg:block">{t("checkout:quantity")}</span>
      <span className="hidden text-right lg:block">
        {t("checkout:total_price")}
      </span>
      <span className="hidden text-right lg:block">
        {t("checkout:actions")}
      </span>
    </div>
  );
};
