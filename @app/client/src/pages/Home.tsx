import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { CardSearchPicker } from "@/components/CardSearchPicker";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/Button";
import { useDraftBinder } from "@/hooks/useDraftBinder";
import { SEO_BRAND, type SeoMetadata } from "@/lib/seoMetadata";

import { createHomeJsonLd } from "./Home.jsonLd";

export const Home = () => {
  const { t } = useTranslation(["common"]);
  const navigate = useNavigate();
  const { addCard } = useDraftBinder();
  const description = t("common:seo.home.description");
  const seoMetadata: SeoMetadata = {
    canonicalPath: "/",
    description,
    jsonLd: createHomeJsonLd({
      description,
      name: SEO_BRAND,
    }),
    robots: "index,follow",
    title: t("common:seo.home.title"),
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <Seo metadata={seoMetadata} />
      <div className="flex flex-1 justify-center px-4 pt-16 pb-12 sm:pt-24 lg:pt-32">
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
              containerClassName="min-w-0 flex-1"
              onSelect={(card) => {
                addCard(card);
                navigate("/binder/draft");
              }}
            />

            <div className="flex items-center justify-center text-sm text-muted-foreground sm:h-9">
              {t("common:home.or")}
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0"
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
