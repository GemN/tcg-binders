import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useLogOut } from "@/hooks/useLogOut.ts";

const Logout = () => {
  const logoutFromApp = useLogOut();
  const { t } = useTranslation(["login"]);
  useEffect(() => {
    logoutFromApp();
  }, [logoutFromApp]);
  return <div>{t("login:logout")}...</div>;
};

export default Logout;
