import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Plus } from "lucide-react";

import { ButtonNewBinder } from "@/components/ButtonNewBinder";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PriceSourceSwitcher } from "@/components/PriceSourceSwitcher";
import { Button } from "@/components/ui/Button";
import { UserNavigation } from "@/components/UserNavigation";
import { useSession } from "@/providers/SessionContext";

export const Navbar = () => {
  const { t } = useTranslation(["common"]);
  const { isLoading: isSessionLoading, session } = useSession();
  const isLoggedIn = !!session;

  return (
    <header className="sticky top-0 z-40 border-b border-card text-foreground">
      <nav className="flex h-14 w-full items-center gap-2 px-4 sm:px-6 lg:px-20">
        <Link
          to="/"
          aria-label={t("common:nav.home")}
          className="flex min-w-0 items-center"
        >
          <img
            src="/logo_megabinder.svg"
            alt={t("common:nav.brand")}
            className="h-9"
          />
        </Link>

        <div className="flex items-center gap-2">
          {!isSessionLoading && (
            <>
              {isLoggedIn && (
                <Button variant="link" asChild className="h-9 px-2 sm:px-3">
                  <Link to="/my-binders">{t("common:nav.your_binders")}</Link>
                </Button>
              )}
              {isLoggedIn ? (
                <ButtonNewBinder />
              ) : (
                <Button asChild className="h-9 px-2 sm:px-3">
                  <Link to="/binder/draft">
                    <Plus className="size-4" />
                    {t("common:new_binder.button")}
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <CurrencySwitcher />
          <PriceSourceSwitcher />
          {!isSessionLoading && (
            <>
              {isLoggedIn ? (
                <UserNavigation />
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button variant="ghost" asChild className="h-9 px-2 sm:px-3">
                    <Link to="/login">{t("common:nav.sign_in")}</Link>
                  </Button>
                  <Button asChild className="h-9 px-2 sm:px-3">
                    <Link to="/login?view=sign_up">
                      {t("common:nav.register")}
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
