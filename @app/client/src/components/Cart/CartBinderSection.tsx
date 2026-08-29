import { Package, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { BinderNotePreview } from "@/components/Cart/BinderNotePreview";
import { CartItemRow } from "@/components/Cart/CartItemRow";
import type { CartCheckboxState } from "@/components/Cart/cartSelection";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import type { CartBinderGroup } from "@/lib/cart";
import { getCartItemCount } from "@/lib/cart";

interface CartBinderSectionProps {
  binderGroup: CartBinderGroup;
  locale: string;
  selectedItemIds: ReadonlySet<string>;
  selectionState: CartCheckboxState;
  onGroupSelectionChange: (
    binderCardIds: string[],
    isSelected: boolean
  ) => void;
  onItemSelectionChange: (binderCardId: string, isSelected: boolean) => void;
  onClearBinder: (binderId: string) => void;
  onQuantityChange: (binderCardId: string, quantity: number) => void;
  onRemove: (binderCardId: string) => void;
}

export const CartBinderSection = ({
  binderGroup,
  locale,
  selectedItemIds,
  selectionState,
  onGroupSelectionChange,
  onItemSelectionChange,
  onClearBinder,
  onQuantityChange,
  onRemove,
}: CartBinderSectionProps) => {
  const { t } = useTranslation(["checkout"]);
  const binderCardIds = binderGroup.items.map((item) => item.binderCardId);

  return (
    <section className="m-3 overflow-hidden rounded-md border border-border first:mt-3 lg:m-4 lg:first:mt-4">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/20 px-3 py-3 lg:px-4">
        <div className="flex min-w-0 flex-1 items-start gap-3 lg:gap-4">
          <Checkbox
            aria-label={t("checkout:select_binder", {
              binder: binderGroup.binder.name,
            })}
            checked={selectionState}
            className="mt-1"
            onCheckedChange={(checked) =>
              onGroupSelectionChange(binderCardIds, checked === true)
            }
          />
          <Link
            to={`/binder/${binderGroup.binder.shortId}`}
            className="inline-flex max-w-full items-center gap-2 font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Package className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{binderGroup.binder.name}</span>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-3 lg:justify-end">
          <p className="hidden text-sm text-muted-foreground lg:block">
            {t("checkout:item_count", {
              count: getCartItemCount(binderGroup.items),
            })}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-8 p-0 text-destructive hover:text-destructive lg:w-auto lg:px-3"
            aria-label={t("checkout:empty_binder_cart")}
            onClick={() => onClearBinder(binderGroup.binder.id)}
          >
            <Trash2 className="size-4" />
            <span className="hidden lg:inline">
              {t("checkout:empty_binder_cart")}
            </span>
          </Button>
        </div>
      </div>

      <BinderNotePreview note={binderGroup.binder.note} />

      <div>
        {binderGroup.items.map((item) => (
          <CartItemRow
            key={item.binderCardId}
            isSelected={selectedItemIds.has(item.binderCardId)}
            item={item}
            locale={locale}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
            onSelectionChange={onItemSelectionChange}
          />
        ))}
      </div>
    </section>
  );
};
