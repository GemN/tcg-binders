import {
  type CurrentUserProfileQuery,
  useCurrentUserProfileQuery,
  useUpdateUserProfileMutation,
} from "@app/graphql";
import { ArrowRight } from "lucide-react";
import { type FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

import { Loading } from "@/components/Loading";
import { SelectCountry } from "@/components/SelectCountry";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { countriesByISOCode, type ISOCode } from "@/lib/countries";
import { handleError } from "@/lib/error";
import { getRegistrationCountry } from "@/lib/onboarding";

const getSafeNextPath = (value: string | null) => {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/onboarding")
  ) {
    return "/";
  }

  return value;
};

interface OnboardingFormData {
  nickname: string;
  country: string;
}

interface OnboardingFormProps {
  nextPath: string;
  profile: NonNullable<CurrentUserProfileQuery["currentUserProfile"]>;
}

const OnboardingForm: FC<OnboardingFormProps> = ({ nextPath, profile }) => {
  const { t } = useTranslation(["onboarding", "common"]);
  const navigate = useNavigate();
  const [updateUserProfile, { loading: isUpdating }] =
    useUpdateUserProfileMutation();
  const savedCountry = countriesByISOCode[profile.country as ISOCode]
    ? profile.country
    : "";
  const form = useForm<OnboardingFormData>({
    defaultValues: {
      nickname: profile.nickname,
      country: savedCountry || getRegistrationCountry() || "",
    },
  });

  const handleSubmit = async (formData: OnboardingFormData) => {
    const nickname = formData.nickname.trim();

    try {
      const result = await updateUserProfile({
        variables: {
          id: profile.id,
          set: {
            nickname,
            country: formData.country,
          },
        },
      });

      if (!result.data?.updateUserProfilesCollection.affectedCount) {
        throw new Error(t("onboarding:save_error"));
      }

      navigate(nextPath, { replace: true });
    } catch (error) {
      handleError(error, t("onboarding:save_error"));
    }
  };

  return (
    <Form {...form}>
      <form
        className="mt-8 space-y-6"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name="nickname"
          rules={{
            required: t("onboarding:nickname_required"),
            validate: (value) =>
              value.trim().length > 0 || t("onboarding:nickname_required"),
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("onboarding:nickname")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="nickname"
                  autoFocus
                  disabled={isUpdating}
                />
              </FormControl>
              <FormDescription>
                {t("onboarding:nickname_description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          rules={{
            required: t("onboarding:country_required"),
            validate: (value) =>
              !!countriesByISOCode[value as ISOCode] ||
              t("common:form.invalid_country"),
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("onboarding:country")}</FormLabel>
              <SelectCountry
                disabled={isUpdating}
                placeholder={t("onboarding:country_placeholder")}
                value={field.value || undefined}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="h-10 w-full" isLoading={isUpdating}>
          {t("onboarding:continue")}
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </Form>
  );
};

interface OnboardingProps {}

export const Onboarding: FC<OnboardingProps> = () => {
  const { t } = useTranslation(["onboarding", "common"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const { data, loading } = useCurrentUserProfileQuery({
    fetchPolicy: "cache-and-network",
  });
  const profile = data?.currentUserProfile;
  const isProfileComplete =
    !!profile?.nickname.trim() &&
    !!countriesByISOCode[profile.country as ISOCode];

  useEffect(() => {
    if (isProfileComplete) {
      navigate(nextPath, { replace: true });
    }
  }, [isProfileComplete, navigate, nextPath]);

  return (
    <>
      <Seo
        metadata={{
          canonicalPath: "/onboarding",
          robots: "noindex,follow",
          title: t("onboarding:seo.title"),
        }}
      />
      <div className="rounded-[8px] border border-[#dbe2ec] bg-white p-5 pb-8 shadow-[0_24px_80px_rgba(18,23,36,0.12)] sm:p-6 sm:pb-8">
        {loading || !profile || isProfileComplete ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loading />
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold leading-tight">
              {t("onboarding:title")}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("onboarding:subtitle")}
            </p>
            <OnboardingForm nextPath={nextPath} profile={profile} />
          </>
        )}
      </div>
    </>
  );
};
