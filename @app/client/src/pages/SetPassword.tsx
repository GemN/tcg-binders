import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Seo } from "@/components/Seo";
import { InputPassword } from "@/components/ui/InputPassword";
import supabase from "@/lib/supabase";
import { useSession } from "@/providers/SessionContext";

import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/Form";
import { handleError } from "../lib/error";

const getSafeNextPath = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
};

interface FormData {
  password: string;
  confirmPassword: string;
}

export default function SetPassword() {
  const { t } = useTranslation(["login"]);
  const { session } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const isInvitation = searchParams.get("flow") === "invitation";
  const email = session?.user.email;
  const resetDescription = email
    ? t("login:set_password.description_with_email", { email })
    : t("login:set_password.description");
  const invitationDescription = email
    ? t("login:set_password.invitation_description_with_email", { email })
    : t("login:set_password.invitation_description");

  const form = useForm<FormData>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSetPassword = async ({ password }: FormData) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }
      toast.success(t("login:set_password.success"));
      navigate(nextPath);
    } catch (error) {
      handleError(error, t("login:set_password.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Seo
        metadata={{
          canonicalPath: "/set-password",
          robots: "noindex,follow",
          title: isInvitation
            ? t("login:seo.invitation_set_password.title")
            : t("login:seo.set_password.title"),
        }}
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isInvitation
              ? t("login:set_password.invitation_title")
              : t("login:set_password.title")}
          </CardTitle>
          <CardDescription>
            {isInvitation ? invitationDescription : resetDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSetPassword)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="password"
                rules={{
                  required: t("login:validation.password_required"),
                  minLength: {
                    value: 8,
                    message: t("login:validation.password_min_length"),
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("login:set_password.create_password")}
                    </FormLabel>
                    <FormControl>
                      <InputPassword {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                rules={{
                  required: t("login:validation.confirm_password_required"),
                  minLength: {
                    value: 8,
                    message: t("login:validation.confirm_password_min_length"),
                  },
                  validate: (value) =>
                    value === form.getValues("password") ||
                    t("login:validation.passwords_must_match"),
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("login:set_password.confirm_password")}
                    </FormLabel>
                    <FormControl>
                      <InputPassword {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" isLoading={isLoading} className="w-full">
                {t("login:set_password.submit")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
