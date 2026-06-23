import { useEffect, type FC } from "react";
import { Auth } from "@supabase/auth-ui-react";
import supabaseClient, { isAuthenticated } from "@/lib/supabase.ts";
import { type I18nVariables, ThemeSupa } from "@supabase/auth-ui-shared";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card.tsx";
import { useNavigate, useSearchParams } from "react-router";

interface LoginProps {}
export const Login: FC<LoginProps> = () => {
  const { t } = useTranslation(["login"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const nextPath = searchParams.get("next") || "/";
  const authView =
    searchParams.get("view") === "sign_up" ? "sign_up" : "sign_in";

  useEffect(() => {
    const checkSession = async () => {
      if (await isAuthenticated()) {
        navigate(nextPath, { replace: true });
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate(nextPath, { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, nextPath]);

  const localization: I18nVariables = {
    sign_in: {
      email_label: t("login:auth_ui.email_label"),
      password_label: t("login:auth_ui.password_label"),
    },
    sign_up: {
      email_label: t("login:auth_ui.email_label"),
      password_label: t("login:auth_ui.password_label"),
    },
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="p-6 w-full max-w-md">
        <Auth
          supabaseClient={supabaseClient}
          view={authView}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          localization={{ variables: localization }}
          redirectTo={window.location.origin + nextPath}
        />
      </Card>
    </div>
  );
};
