import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Seo } from "@/components/Seo";
import { NAVBAR_CONTENT_OFFSET_CLASS_NAME } from "@/config/layout";
import { useLogOut } from "@/hooks/useLogOut.ts";
import { cn } from "@/lib/utils";

const Logout = () => {
  const logoutFromApp = useLogOut();
  const { t } = useTranslation(["login"]);
  useEffect(() => {
    logoutFromApp();
  }, [logoutFromApp]);
  return (
    <>
      <Seo
        metadata={{
          canonicalPath: "/logout",
          robots: "noindex,follow",
          title: t("login:seo.logout.title"),
        }}
      />
      <div className={cn(NAVBAR_CONTENT_OFFSET_CLASS_NAME)}>
        {t("login:logout")}...
      </div>
    </>
  );
};

export default Logout;
