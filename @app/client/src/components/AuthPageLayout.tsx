import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const AuthPageLayout = () => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="flex min-h-svh w-full flex-col bg-background px-5 pb-8 pt-16 sm:px-6">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-start">
        <div className="relative mb-4 flex min-h-9 items-center justify-center">
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <LanguageSwitcher />
          </div>

          <Link
            to="/"
            aria-label={t("common:nav.home")}
            className="block w-fit"
          >
            <img
              src="/logo_megabinder.svg"
              alt={t("common:nav.brand")}
              className="h-3 w-auto sm:h-4"
            />
          </Link>
        </div>

        <Outlet />
      </div>
    </div>
  );
};
