import { ArrowLeft, ArrowRight } from "lucide-react";
import { type FC, type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { handleError } from "@/lib/error";
import supabaseClient from "@/lib/supabase";

const getSafeReturnPath = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
};

interface ForgotPasswordProps {}

export const ForgotPassword: FC<ForgotPasswordProps> = () => {
  const { t } = useTranslation(["login", "common"]);
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const returnTo = getSafeReturnPath(searchParams.get("returnTo"));
  const signInPath =
    returnTo === "/" ? "/login" : `/login?next=${encodeURIComponent(returnTo)}`;
  const setPasswordPath =
    returnTo === "/"
      ? "/set-password"
      : `/set-password?next=${encodeURIComponent(returnTo)}`;
  const passwordResetCallbackUrl = `${window.location.origin}${setPasswordPath}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: passwordResetCallbackUrl }
      );

      if (error) {
        throw error;
      }

      toast.success(t("login:messages.reset_email_sent"));
    } catch (error) {
      handleError(error, t("login:messages.reset_email_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="font-display text-2xl font-semibold leading-tight">
            {t("login:forgot_password.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("login:forgot_password.description")}
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="forgot-password-email">
                {t("login:page.email")}
              </Label>
              <Input
                id="forgot-password-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder={t("login:page.email_placeholder")}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <Button type="submit" className="h-10" isLoading={isSubmitting}>
              {t("login:forgot_password.submit")}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <Link
            to={signInPath}
            className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4" />
            {t("login:forgot_password.back_to_sign_in")}
          </Link>
        </div>
      </div>
    </div>
  );
};
