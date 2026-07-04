import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "@/components/ui/Button";

export const CartEmptyState = () => {
  const { t } = useTranslation(["checkout"]);

  return (
    <div className="flex flex-1 flex-col items-center pt-16 text-center sm:pt-20">
      <div className="flex size-14 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Package className="size-7" />
      </div>
      <h2 className="mt-5 font-display text-3xl font-bold">
        {t("checkout:empty_title")}
      </h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        {t("checkout:empty_description")}
      </p>
      <Button asChild className="mt-6">
        <Link to="/">{t("checkout:continue_browsing")}</Link>
      </Button>
    </div>
  );
};
