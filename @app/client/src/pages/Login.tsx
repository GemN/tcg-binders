import { ArrowRight } from "lucide-react";
import { type FC, type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { InputPassword } from "@/components/ui/InputPassword";
import { Label } from "@/components/ui/Label";
import { Separator } from "@/components/ui/Separator";
import { handleError } from "@/lib/error";
import { OAUTH_NEXT_PATH_STORAGE_KEY } from "@/lib/oauth";
import { getOnboardingPath, getRegistrationCountry } from "@/lib/onboarding";
import supabaseClient, { isAuthenticated } from "@/lib/supabase";

type LoginAuthMode = "sign_in" | "sign_up";
type OAuthProvider = "google" | "facebook" | "line";

const supabaseOAuthProviderByProvider = {
  google: "google",
  facebook: "facebook",
  line: "custom:line",
} as const;

const getSafeNextPath = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
};

interface LoginProps {}

export const Login: FC<LoginProps> = () => {
  const { t } = useTranslation(["login", "common"]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const nextPath = getSafeNextPath(searchParams.get("next"));
  const onboardingPath = getOnboardingPath(nextPath);
  const emailCallbackUrl = `${window.location.origin}${onboardingPath}`;
  const oAuthCallbackUrl = `${window.location.origin}/auth/callback`;
  const forgotPasswordPath = `/forgot-password?returnTo=${encodeURIComponent(
    nextPath
  )}`;
  const requestedAuthMode: LoginAuthMode =
    searchParams.get("view") === "sign_up" ? "sign_up" : "sign_in";

  const [authMode, setAuthMode] = useState<LoginAuthMode>(requestedAuthMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [oAuthProvider, setOAuthProvider] = useState<OAuthProvider | null>(
    null
  );

  useEffect(() => {
    setAuthMode(requestedAuthMode);
  }, [requestedAuthMode]);

  useEffect(() => {
    const checkSession = async () => {
      if (await isAuthenticated()) {
        navigate(onboardingPath, { replace: true });
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate(onboardingPath, { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, onboardingPath]);

  const updateSearchParam = (key: string, value: string | null) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (value) {
      nextSearchParams.set(key, value);
    } else {
      nextSearchParams.delete(key);
    }
    setSearchParams(nextSearchParams, { replace: true });
  };

  const handleAuthModeChange = (mode: LoginAuthMode) => {
    setAuthMode(mode);
    updateSearchParam("view", mode === "sign_up" ? "sign_up" : null);
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setOAuthProvider(provider);
    try {
      window.sessionStorage.setItem(OAUTH_NEXT_PATH_STORAGE_KEY, nextPath);
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: supabaseOAuthProviderByProvider[provider],
        options: {
          redirectTo: oAuthCallbackUrl,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      handleError(error, t("login:messages.oauth_error"));
      setOAuthProvider(null);
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsEmailSubmitting(true);

    try {
      if (authMode === "sign_up") {
        const { data, error } = await supabaseClient.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: emailCallbackUrl,
            data: {
              country: getRegistrationCountry() || "",
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          navigate(onboardingPath, { replace: true });
          return;
        }

        toast.success(t("login:messages.check_email"));
        return;
      }

      const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      navigate(onboardingPath, { replace: true });
    } catch (error) {
      handleError(error, t("login:messages.email_error"));
    } finally {
      setIsEmailSubmitting(false);
    }
  };

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
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <AuthPanel
          authMode={authMode}
          email={email}
          forgotPasswordPath={forgotPasswordPath}
          isEmailSubmitting={isEmailSubmitting}
          oAuthProvider={oAuthProvider}
          password={password}
          onAuthModeChange={handleAuthModeChange}
          onEmailChange={setEmail}
          onEmailSubmit={handleEmailSubmit}
          onOAuthSignIn={handleOAuthSignIn}
          onPasswordChange={setPassword}
        />
      </div>
    </div>
  );
};

interface AuthPanelProps {
  authMode: LoginAuthMode;
  email: string;
  forgotPasswordPath: string;
  isEmailSubmitting: boolean;
  oAuthProvider: OAuthProvider | null;
  password: string;
  onAuthModeChange: (value: LoginAuthMode) => void;
  onEmailChange: (value: string) => void;
  onEmailSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onOAuthSignIn: (provider: OAuthProvider) => void;
  onPasswordChange: (value: string) => void;
}

const AuthPanel: FC<AuthPanelProps> = ({
  authMode,
  email,
  forgotPasswordPath,
  isEmailSubmitting,
  oAuthProvider,
  password,
  onAuthModeChange,
  onEmailChange,
  onEmailSubmit,
  onOAuthSignIn,
  onPasswordChange,
}) => {
  const { t } = useTranslation(["login"]);
  const isSignUp = authMode === "sign_up";

  return (
    <div className="rounded-[8px] border border-border bg-white p-5 pb-8 shadow-[0_24px_80px_rgba(18,23,36,0.12)] sm:p-6 sm:pb-8">
      <div>
        <h2 className="font-display text-2xl font-semibold leading-tight">
          {isSignUp
            ? t("login:page.sign_up_title")
            : t("login:page.sign_in_title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignUp
            ? t("login:page.sign_up_subtitle")
            : t("login:page.sign_in_subtitle")}
        </p>
      </div>

      <div className="mt-8 grid gap-3">
        <ButtonGoogleConnect
          isLoading={oAuthProvider === "google"}
          disabled={!!oAuthProvider}
          onClick={() => onOAuthSignIn("google")}
        />
        <ButtonFacebookConnect
          isLoading={oAuthProvider === "facebook"}
          disabled={!!oAuthProvider}
          onClick={() => onOAuthSignIn("facebook")}
        />
        <ButtonLineConnect
          isLoading={oAuthProvider === "line"}
          disabled={!!oAuthProvider}
          onClick={() => onOAuthSignIn("line")}
        />
      </div>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          {t("login:page.or")}
        </span>
        <Separator className="flex-1" />
      </div>

      <EmailLoginForm
        authMode={authMode}
        email={email}
        forgotPasswordPath={forgotPasswordPath}
        isSubmitting={isEmailSubmitting}
        password={password}
        onEmailChange={onEmailChange}
        onPasswordChange={onPasswordChange}
        onSubmit={onEmailSubmit}
      />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {isSignUp ? t("login:page.have_account") : t("login:page.no_account")}{" "}
        <button
          type="button"
          className="cursor-pointer font-semibold text-foreground underline-offset-4 hover:underline"
          onClick={() => onAuthModeChange(isSignUp ? "sign_in" : "sign_up")}
        >
          {isSignUp ? t("login:page.sign_in") : t("login:page.sign_up")}
        </button>
      </p>
    </div>
  );
};

interface ButtonGoogleConnectProps {
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

const ButtonGoogleConnect: FC<ButtonGoogleConnectProps> = ({
  disabled,
  isLoading,
  onClick,
}) => {
  const { t } = useTranslation(["login"]);

  return (
    <Button
      type="button"
      variant="outline"
      className="h-[42px] font-body justify-center rounded-xs border-[#d1d5db] bg-white px-3 text-[15px] font-medium leading-5 text-[#1f1f1f] shadow-none hover:border-[#c4c9d1] hover:bg-[#f7f8f8] hover:text-[#1f1f1f] active:bg-[#e8eaed]"
      disabled={disabled}
      isLoading={isLoading}
      onClick={onClick}
    >
      {!isLoading && (
        <span className="relative size-5 shrink-0 overflow-hidden">
          <img
            src="/google-signin-icon@2x.png"
            alt=""
            aria-hidden="true"
            className="absolute -left-2.5 -top-2.5 size-10 max-w-none"
          />
        </span>
      )}
      <span>{t("login:page.oauth_google")}</span>
    </Button>
  );
};

interface ButtonFacebookConnectProps {
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

const ButtonFacebookConnect: FC<ButtonFacebookConnectProps> = ({
  disabled,
  isLoading,
  onClick,
}) => {
  const { t } = useTranslation(["login"]);

  return (
    <Button
      type="button"
      className="h-[42px] font-body justify-center rounded-xs border-0 bg-[#1877f2] px-3 text-[15px] tracking-[0.25px] text-white shadow-none hover:bg-[#166fe5] active:bg-[#145cbd]"
      disabled={disabled}
      isLoading={isLoading}
      onClick={onClick}
    >
      {!isLoading && (
        <img
          src="/facebook-login-icon.svg"
          alt=""
          aria-hidden="true"
          className="size-6"
        />
      )}
      <span>{t("login:page.oauth_facebook")}</span>
    </Button>
  );
};

interface ButtonLineConnectProps {
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

const ButtonLineConnect: FC<ButtonLineConnectProps> = ({
  disabled,
  isLoading,
  onClick,
}) => {
  const { t } = useTranslation(["login"]);

  return (
    <Button
      type="button"
      className="h-[42px] font-body justify-center overflow-hidden rounded-xs border-0 bg-[#06c755] p-0 text-[15px] text-white shadow-none hover:bg-[#05b34d] active:bg-[#048b3c]"
      disabled={disabled}
      isLoading={isLoading}
      onClick={onClick}
    >
      {!isLoading && (
        <img src="/line-login-icon@2x.png" alt="LINE" className="size-[42px]" />
      )}
      <span>{t("login:page.oauth_line")}</span>
    </Button>
  );
};

interface EmailLoginFormProps {
  authMode: LoginAuthMode;
  email: string;
  forgotPasswordPath: string;
  isSubmitting: boolean;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const EmailLoginForm: FC<EmailLoginFormProps> = ({
  authMode,
  email,
  forgotPasswordPath,
  isSubmitting,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) => {
  const { t } = useTranslation(["login"]);

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="login-email">{t("login:page.email")}</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t("login:page.email_placeholder")}
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="login-password">{t("login:page.password")}</Label>
          {authMode === "sign_in" && (
            <Link
              to={forgotPasswordPath}
              className="text-sm text-foreground underline-offset-4 hover:underline"
            >
              {t("login:page.forgot_password")}
            </Link>
          )}
        </div>
        <InputPassword
          id="login-password"
          autoComplete={
            authMode === "sign_up" ? "new-password" : "current-password"
          }
          minLength={4}
          placeholder={t("login:page.password_placeholder")}
          required
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
        />
      </div>

      <Button type="submit" className="mt-1 h-10" isLoading={isSubmitting}>
        {authMode === "sign_up"
          ? t("login:page.submit_sign_up")
          : t("login:page.submit_sign_in")}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
};
