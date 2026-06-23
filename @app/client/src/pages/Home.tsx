import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { CardSearchPicker } from "@/components/CardSearchPicker";
import { Button } from "@/components/ui/Button";
import { useDraftBinder } from "@/hooks/useDraftBinder";

export const Home = () => {
  const { t } = useTranslation(["common"]);
  const navigate = useNavigate();
  const { addCard } = useDraftBinder();

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              {t("common:home.title")}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("common:home.subtitle")}
            </p>
          </div>

          <div className="mx-auto flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-start">
            <CardSearchPicker
              className="min-w-0 flex-1"
              inputClassName="[&_input]:h-12 [&_input]:text-base"
              onSelect={(card) => {
                addCard(card);
                navigate("/binder/draft");
              }}
            />

            <div className="flex items-center justify-center text-sm text-muted-foreground sm:h-12">
              {t("common:home.or")}
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-12 shrink-0"
              onClick={() => toast.info(t("common:home.import_not_ready"))}
            >
              <Upload className="size-4" />
              {t("common:home.import_from_file")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
