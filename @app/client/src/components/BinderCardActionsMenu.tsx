import { EllipsisVertical, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/utils";

interface BinderCardActionsMenuProps {
  cardName: string;
  className?: string;
  disabled?: boolean;
  onDelete: () => void;
  triggerVariant?: "overlay" | "inline";
}

export const BinderCardActionsMenu = ({
  cardName,
  className,
  disabled,
  onDelete,
  triggerVariant = "overlay",
}: BinderCardActionsMenuProps) => {
  const { t } = useTranslation(["binder", "common"]);

  return (
    <div
      className={cn("relative z-20", className)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "size-8",
              triggerVariant === "inline"
                ? "bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground focus-visible:ring-ring/30 data-[state=open]:bg-transparent data-[state=open]:text-foreground"
                : "border border-black/10 bg-black/65 text-white shadow-md hover:bg-black/80 hover:text-white focus-visible:ring-white/70 data-[state=open]:bg-black/80"
            )}
            aria-label={t("binder:actions.open", { name: cardName })}
          >
            <EllipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuItem
            variant="destructive"
            disabled={disabled}
            className="cursor-pointer"
            onSelect={onDelete}
          >
            <Trash2 className="size-4" />
            {t("binder:actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
