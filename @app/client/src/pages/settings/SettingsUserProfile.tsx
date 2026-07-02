import {
  type CurrentUserProfileQuery,
  useCurrentUserProfileQuery,
  useUpdateUserProfileMutation,
} from "@app/graphql";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Loading } from "@/components/Loading";
import { SelectCountry } from "@/components/SelectCountry";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
import { countriesByISOCode } from "@/lib/countries";
import { handleError } from "@/lib/error";

interface SettingsUserProfileFormData {
  nickname: string;
  country: string;
}

interface SettingsUserProfileFormProps {
  profile: NonNullable<CurrentUserProfileQuery["currentUserProfile"]>;
  onSaved: () => Promise<unknown> | unknown;
}

const SettingsUserProfileForm = ({
  profile,
  onSaved,
}: SettingsUserProfileFormProps) => {
  const { t } = useTranslation(["settings", "common"]);
  const [updateUserProfile, { loading: isUpdating }] =
    useUpdateUserProfileMutation();
  const form = useForm<SettingsUserProfileFormData>({
    defaultValues: {
      nickname: profile.nickname,
      country: profile.country,
    },
  });

  const handleSubmit = async (formData: SettingsUserProfileFormData) => {
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
        throw new Error(t("settings:profile.save_error"));
      }

      await onSaved();
      form.reset({
        nickname,
        country: formData.country,
      });
      toast.success(t("settings:profile.save_success"));
    } catch (error) {
      handleError(error, t("settings:profile.save_error"));
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="nickname"
          rules={{
            required: t("settings:profile.nickname_required"),
            validate: (value) =>
              value.trim().length > 0 ||
              t("settings:profile.nickname_required"),
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings:profile.nickname")}</FormLabel>
              <FormControl>
                <Input {...field} disabled={isUpdating} />
              </FormControl>
              <FormDescription>
                {t("settings:profile.nickname_description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          rules={{
            required: t("settings:profile.country_required"),
            validate: (value) =>
              !!countriesByISOCode[value] || t("common:form.invalid_country"),
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings:profile.country")}</FormLabel>
              <SelectCountry
                disabled={isUpdating}
                placeholder={t("settings:profile.country_placeholder")}
                value={field.value || undefined}
                onChange={field.onChange}
              />
              <FormDescription>
                {t("settings:profile.country_description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" isLoading={isUpdating}>
          {t("settings:profile.save")}
        </Button>
      </form>
    </Form>
  );
};

export const SettingsUserProfile = () => {
  const { t } = useTranslation(["settings"]);
  const { data, loading, refetch } = useCurrentUserProfileQuery({
    fetchPolicy: "cache-and-network",
  });
  const profile = data?.currentUserProfile;

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="h1">{t("settings:profile.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("settings:profile.subtitle")}
        </p>
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t("settings:profile.details")}</CardTitle>
        </CardHeader>
        <CardContent>
          {profile && (
            <SettingsUserProfileForm
              key={profile.id}
              profile={profile}
              onSaved={refetch}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
