import { useBinderCardVariantsQuery } from "@app/graphql";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CardImage } from "@/components/CardImage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/Select";
import { getCardImageBaseUrl, getCardScryfallId } from "@/lib/cardImageUrl";

import type { BinderCardVariant, ModalBinderCardRecord } from "./types";
import { getVariantLabel } from "./utils";

export type BinderCardVariantSelectCard = Pick<
  NonNullable<ModalBinderCardRecord["card"]>,
  "cardSet" | "collectorNumber" | "id" | "name"
>;

interface BinderCardVariantSelectProps {
  card: BinderCardVariantSelectCard | null | undefined;
  label: string;
  onVariantChange: (variant: BinderCardVariant) => void;
}

const getCurrentVariantLabel = (
  card: BinderCardVariantSelectCard | null | undefined
): string =>
  [
    card?.cardSet?.code || "MTG",
    card?.collectorNumber ? `#${card.collectorNumber}` : null,
  ]
    .filter(Boolean)
    .join(" ");

export const BinderCardVariantSelect = ({
  card,
  label,
  onVariantChange,
}: BinderCardVariantSelectProps) => {
  const { t } = useTranslation(["common"]);
  const [variantQueryCardId, setVariantQueryCardId] = useState<string | null>(
    null
  );
  const shouldLoadVariants = !!card?.id && variantQueryCardId === card.id;
  const { data: variantsData, loading: areVariantsLoading } =
    useBinderCardVariantsQuery({
      variables: { name: card?.name || "", first: 500 },
      skip: !card?.name || !shouldLoadVariants,
    });
  const variants = useMemo(() => {
    if (!shouldLoadVariants) return [];
    return variantsData?.cardsCollection?.edges.map(({ node }) => node) || [];
  }, [shouldLoadVariants, variantsData?.cardsCollection?.edges]);
  const selectedVariant = variants.find((variant) => variant.id === card?.id);
  const selectedVariantLabel = selectedVariant
    ? getVariantLabel(selectedVariant)
    : getCurrentVariantLabel(card);

  useEffect(() => {
    setVariantQueryCardId(null);
  }, [card?.id]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && card?.id) {
      setVariantQueryCardId(card.id);
    }
  };

  const handleVariantChange = (cardId: string) => {
    if (cardId === card?.id) return;

    const variant = variants.find((candidate) => candidate.id === cardId);
    if (!variant) return;

    onVariantChange(variant);
  };

  return (
    <label className="grid gap-1 text-xs font-medium text-[#6f6570] sm:col-span-2">
      {label}
      <Select
        disabled={!card?.id}
        value={card?.id || ""}
        onOpenChange={handleOpenChange}
        onValueChange={handleVariantChange}
      >
        <SelectTrigger className="w-full bg-[#E8E8E8] text-[#343434]">
          <span className="truncate">{selectedVariantLabel}</span>
        </SelectTrigger>
        <SelectContent>
          {areVariantsLoading ? (
            <SelectItem value="__loading" disabled>
              {t("common:loading")}
            </SelectItem>
          ) : (
            variants.map((variant) => {
              const variantImageUrl = getCardImageBaseUrl(variant);
              const variantScryfallId = getCardScryfallId(variant);
              const variantLabel = getVariantLabel(variant);
              const variantFinishes = variant.finishes.filter(
                (finish): finish is string => !!finish
              );
              const variantFinish =
                variantFinishes.length === 1 ? variantFinishes[0] : null;

              return (
                <SelectItem
                  key={variant.id}
                  value={variant.id}
                  textValue={variantLabel}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <CardImage
                      alt=""
                      className="h-12 shrink-0 rounded-sm border border-[#d8dce0]"
                      finish={variantFinish}
                      imageSize="thumbnail"
                      imageUrl={variantImageUrl}
                      noImageLabel=""
                      scryfallId={variantScryfallId}
                    />
                    <span className="truncate">{variantLabel}</span>
                  </span>
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
    </label>
  );
};
