import { CircleUserRound, Menu, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { ButtonNewBinder } from "@/components/ButtonNewBinder";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { GlobalCardSearch } from "@/components/GlobalCardSearch";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NavbarCartButton } from "@/components/NavbarCartButton";
import { PriceSourceSwitcher } from "@/components/PriceSourceSwitcher";
import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/Sheet";
import { UserNavigation } from "@/components/UserNavigation";
import { useSession } from "@/providers/SessionContext";

interface MobileNavigationMenuProps {
  isLoggedIn: boolean;
  isSessionLoading: boolean;
}

const MobileNavigationMenu = ({
  isLoggedIn,
  isSessionLoading,
}: MobileNavigationMenuProps) => {
  const { t } = useTranslation(["common"]);
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("common:nav.open_menu")}
        >
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="sr-only">{t("common:nav.menu")}</SheetTitle>
          <Link
            to="/"
            aria-label={t("common:nav.home")}
            className="w-fit"
            onClick={handleNavigate}
          >
            <img
              src="/logo_megabinder.svg"
              alt={t("common:nav.brand")}
              className="h-auto w-[195px] max-w-full"
            />
          </Link>
          <SheetDescription className="sr-only">
            {t("common:nav.menu_description")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
          {!isSessionLoading && !isLoggedIn && (
            <div className="mb-4 grid gap-1 border-b pb-4">
              <Button variant="ghost" asChild className="w-full justify-start">
                <Link to="/login" onClick={handleNavigate}>
                  {t("common:nav.sign_in")}
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="w-full justify-start"
              >
                <Link to="/login?view=sign_up" onClick={handleNavigate}>
                  {t("common:nav.register")}
                </Link>
              </Button>
            </div>
          )}

          <nav className="grid gap-1" aria-label={t("common:nav.menu")}>
            {!isSessionLoading && (
              <>
                {isLoggedIn && (
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start"
                  >
                    <Link to="/my-binders" onClick={handleNavigate}>
                      {t("common:nav.your_binders")}
                    </Link>
                  </Button>
                )}

                {isLoggedIn ? (
                  <ButtonNewBinder
                    onCreated={handleNavigate}
                    trigger={
                      <Button className="w-full justify-start">
                        <Plus className="size-4" />
                        {t("common:new_binder.button")}
                      </Button>
                    }
                  />
                ) : (
                  <Button asChild className="w-full justify-start">
                    <Link to="/binder/draft" onClick={handleNavigate}>
                      <Plus className="size-4" />
                      {t("common:new_binder.button")}
                    </Link>
                  </Button>
                )}
              </>
            )}
          </nav>

          <div className="mt-4 border-t pt-4">
            <p className="px-1 pb-2 text-sm font-medium">
              {t("common:nav.settings")}
            </p>
            <div className="grid gap-1">
              <div className="flex min-h-9 items-center justify-between gap-2 px-1">
                <span className="text-sm text-muted-foreground">
                  {t("common:nav.language")}
                </span>
                <LanguageSwitcher />
              </div>
              <div className="flex min-h-9 items-center justify-between gap-2 px-1">
                <span className="text-sm text-muted-foreground">
                  {t("common:nav.currency")}
                </span>
                <CurrencySwitcher />
              </div>
              <div className="flex min-h-9 items-center justify-between gap-2 px-1">
                <span className="text-sm text-muted-foreground">
                  {t("common:nav.price_source")}
                </span>
                <PriceSourceSwitcher />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const Navbar = () => {
  const { t } = useTranslation(["common"]);
  const { isLoading: isSessionLoading, session } = useSession();
  const isLoggedIn = !!session;

  return (
    <header
      className="sticky top-2 z-40 mx-2 rounded-lg
     bg-[#E3DFDA]/50 text-foreground backdrop-blur-[30px] lg:fixed lg:top-4 lg:right-4 lg:left-4 lg:mx-0"
    >
      <nav className="relative flex h-14 w-full items-center gap-2 px-2 lg:px-4">
        <Link
          to="/"
          aria-label={t("common:nav.home")}
          className="order-1 hidden min-w-0 items-center lg:flex"
        >
          <img
            src="/logo_megabinder.svg"
            alt={t("common:nav.brand")}
            className="h-4"
          />
        </Link>

        <div className="order-2 hidden items-center gap-2 lg:flex">
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

        <div className="order-1 flex items-center lg:order-3 lg:min-w-0 lg:flex-1">
          <div className="lg:hidden">
            <MobileNavigationMenu
              isLoggedIn={isLoggedIn}
              isSessionLoading={isSessionLoading}
            />
          </div>
          <GlobalCardSearch />
        </div>

        <Link
          to="/"
          aria-label={t("common:nav.home")}
          className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center lg:hidden"
        >
          <img
            src="/logo_megabinder_small.svg"
            alt={t("common:nav.brand")}
            className="h-[19px] w-[45px]"
          />
        </Link>

        <div className="order-3 ml-auto flex min-w-0 items-center gap-4 lg:order-4 lg:ml-0 lg:gap-2">
          <div className="hidden min-w-0 items-center gap-1 sm:gap-2 lg:flex">
            <LanguageSwitcher />
            <CurrencySwitcher />
            <PriceSourceSwitcher />
          </div>
          <NavbarCartButton />
          {isSessionLoading ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              disabled
              aria-label={t("common:nav.account")}
            >
              <CircleUserRound className="size-6" />
            </Button>
          ) : isLoggedIn ? (
            <UserNavigation />
          ) : (
            <>
              <Button variant="ghost" size="icon" asChild className="lg:hidden">
                <Link to="/login" aria-label={t("common:nav.sign_in")}>
                  <CircleUserRound className="size-6" />
                </Link>
              </Button>
              <div className="hidden items-center gap-1 sm:gap-2 lg:flex">
                <Button variant="ghost" asChild className="h-9 px-2 sm:px-3">
                  <Link to="/login">{t("common:nav.sign_in")}</Link>
                </Button>
                <Button asChild className="h-9 px-2 sm:px-3">
                  <Link to="/login?view=sign_up">
                    {t("common:nav.register")}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
