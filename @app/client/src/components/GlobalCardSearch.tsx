import { Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { CardSearchPicker } from "@/components/CardSearchPicker";
import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/Sheet";
import type { BinderEditingCardSnapshot } from "@/lib/binderEditing";

export const GlobalCardSearch = () => {
  const { t } = useTranslation(["common"]);
  const navigate = useNavigate();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const openCardPage = (card: BinderEditingCardSnapshot) => {
    setIsMobileSearchOpen(false);
    navigate(`/card/${card.id}`);
  };

  return (
    <div className="flex min-w-9 shrink-0 justify-end px-1 lg:min-w-0 lg:flex-1 lg:shrink lg:justify-center lg:px-4">
      <CardSearchPicker
        containerClassName="hidden w-full max-w-xl lg:block"
        placeholder={t("common:nav.search_marketplace_placeholder")}
        onSelect={openCardPage}
      />

      <Sheet open={isMobileSearchOpen} onOpenChange={setIsMobileSearchOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={t("common:nav.search_cards")}
          >
            <Search className="size-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="top" className="p-4">
          <SheetHeader className="p-0">
            <SheetTitle>{t("common:nav.mobile_search_title")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("common:nav.search_cards_description")}
            </SheetDescription>
          </SheetHeader>
          <CardSearchPicker
            containerClassName="w-full"
            placeholder={t("common:nav.search_marketplace_placeholder")}
            onSelect={openCardPage}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};
