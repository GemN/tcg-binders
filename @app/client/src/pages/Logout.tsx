import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Seo } from "@/components/Seo";
import { useLogOut } from "@/hooks/useLogOut.ts";

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
      <div>
        {t("login:logout")}...
      </div>
    </>
  );
};

export default Logout;
