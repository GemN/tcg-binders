import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { InputPassword } from "@/components/ui/InputPassword";
import supabase from "@/lib/supabase";

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

interface FormData {
  password: string;
  confirmPassword: string;
}

export default function SetPassword() {
  const { t } = useTranslation(["login", "common"]);

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
      navigate("/");
    } catch (error) {
      handleError(error, t("login:set_password.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("login:set_password.title")}</CardTitle>
            <CardDescription>
              {t("login:set_password.description")}
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
                      message: t(
                        "login:validation.confirm_password_min_length"
                      ),
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
      </div>
    </div>
  );
}
