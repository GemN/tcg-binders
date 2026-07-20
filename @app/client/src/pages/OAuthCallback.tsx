import { ArrowLeft, CircleAlert, LoaderCircle } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { OAUTH_NEXT_PATH_STORAGE_KEY } from "@/lib/oauth";
import supabaseClient from "@/lib/supabase";

interface OAuthErrorDetails {
  code: string | null;
  description: string | null;
}

const getSafeNextPath = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
};

const getOAuthError = (
  search: string,
  hash: string
): OAuthErrorDetails | null => {
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  const error = searchParams.get("error") || hashParams.get("error");

  if (!error) {
    return null;
  }

  return {
    code:
      searchParams.get("error_code") || hashParams.get("error_code") || error,
    description:
      searchParams.get("error_description") ||
      hashParams.get("error_description"),
  };
};

interface OAuthCallbackProps {}

export const OAuthCallback: FC<OAuthCallbackProps> = () => {
  const { t } = useTranslation(["login", "common"]);
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const oAuthError = getOAuthError(location.search, location.hash);
  const nextPath = getSafeNextPath(
    window.sessionStorage.getItem(OAUTH_NEXT_PATH_STORAGE_KEY)
  );
  const signInPath =
    nextPath === "/" ? "/login" : `/login?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    if (oAuthError) {
      return;
    }

    const finishSignIn = async () => {
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession();

      if (session) {
        window.sessionStorage.removeItem(OAUTH_NEXT_PATH_STORAGE_KEY);
        navigate(nextPath, { replace: true });
        return;
      }

      setSessionError(
        error?.message || t("login:oauth_callback.default_error")
      );
    };

    void finishSignIn();
  }, [navigate, nextPath, oAuthError, t]);

  const errorDescription =
    oAuthError?.description ||
    sessionError ||
    t("login:oauth_callback.default_error");
  const errorCode = oAuthError?.code;
  const hasError = !!oAuthError || !!sessionError;

  return (
    <div className="flex min-h-svh w-full flex-col bg-[#f5f7fb] px-5 pb-8 pt-16 sm:px-6">
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
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <div className="rounded-[8px] border border-[#dbe2ec] bg-white p-5 pb-8 shadow-[0_24px_80px_rgba(18,23,36,0.12)] sm:p-6 sm:pb-8">
          {hasError ? (
            <>
              <div className="flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                <CircleAlert className="size-6" aria-hidden="true" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-semibold leading-tight">
                {t("login:oauth_callback.error_title")}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {errorDescription}
              </p>
              {errorCode && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {t("login:oauth_callback.error_code", { code: errorCode })}
                </p>
              )}

              <Button asChild className="mt-8 h-10 w-full">
                <Link to={signInPath}>
                  <ArrowLeft className="size-4" />
                  {t("login:oauth_callback.back_to_sign_in")}
                </Link>
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <LoaderCircle
                className="size-8 animate-spin text-primary"
                aria-hidden="true"
              />
              <h1 className="mt-5 font-display text-2xl font-semibold leading-tight">
                {t("login:oauth_callback.loading_title")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("login:oauth_callback.loading_description")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
