import type {
  BinderByShortIdQueryResult,
  BinderCardSummaryFieldsFragment,
  UserProfileByIdQueryResult,
} from "@app/graphql";
import type { TFunction } from "i18next";

import type { SeoProductInput } from "../lib/jsonLd.ts";
import {
  isSeoQueryResolved,
  type SeoMetadata,
} from "../lib/seoMetadata.ts";
import { createBinderPageJsonLd } from "./BinderPage.jsonLd.ts";

type BinderQueryState = Pick<
  BinderByShortIdQueryResult,
  "data" | "error" | "loading"
>;

type OwnerProfileQueryState = Pick<
  UserProfileByIdQueryResult,
  "data" | "error" | "loading"
>;

export interface BinderPageSeoMetadataInput {
  binderQuery: BinderQueryState;
  isPublicPreview: boolean;
  ownerProfileQuery: OwnerProfileQueryState;
  shortId: string;
  t: TFunction<["binder", "checkout", "common"]>;
  visibleBinderCards: BinderCardSummaryFieldsFragment[];
}

export const createBinderPageSeoMetadata = ({
  binderQuery,
  isPublicPreview,
  ownerProfileQuery,
  shortId,
  t,
  visibleBinderCards,
}: BinderPageSeoMetadataInput): SeoMetadata => {
  const binder = binderQuery.data?.binderByShortId;
  const ownerProfile =
    ownerProfileQuery.data?.userProfilesCollection?.edges[0]?.node;
  const isBinderResolved = isSeoQueryResolved({
    hasError: !!binderQuery.error,
    hasResponse: !!binderQuery.data,
    isLoading: binderQuery.loading,
  });
  const isOwnerResolved = isSeoQueryResolved({
    hasError: !!ownerProfileQuery.error,
    hasResponse: !!ownerProfileQuery.data,
    isLoading: ownerProfileQuery.loading,
  });

  if (isBinderResolved && !binder) {
    return {
      robots: "noindex,follow",
      title: t("common:seo.not_found.title"),
    };
  }

  const canonicalPath = `/binder/${encodeURIComponent(shortId)}`;
  const ownerNickname = ownerProfile?.nickname || "";
  const hasBinderDetails = !!binder?.name && !!ownerNickname;
  const fallbackTitle = t("binder:seo.public.fallback_title");
  const fullTitle = hasBinderDetails
    ? t("binder:seo.public.title", {
        name: binder.name,
        seller: ownerNickname,
      })
    : fallbackTitle;
  const shortTitle = binder?.name
    ? t("binder:seo.public.short_title", { name: binder.name })
    : fallbackTitle;
  const description = hasBinderDetails
    ? t("binder:seo.public.description", {
        count: binder.binderCardCount ?? 0,
        name: binder.name,
        seller: ownerNickname,
      })
    : undefined;
  const isResolved = isBinderResolved && isOwnerResolved;
  const isIndexable =
    isResolved &&
    binder?.visibility === "listed" &&
    !isPublicPreview &&
    hasBinderDetails;
  const products: SeoProductInput[] = visibleBinderCards.flatMap(
    (binderCard) => {
      if (!binderCard.card) return [];

      return [
        {
          collectorNumber: binderCard.card.collectorNumber,
          id: binderCard.card.id,
          imageUrl: binderCard.card.imageUrl,
          name: binderCard.card.name,
          offer: {
            currency: binderCard.priceCurrency,
            price: binderCard.priceAmount,
            quantity: binderCard.quantity,
          },
          setCode: binderCard.card.cardSet?.code,
        },
      ];
    }
  );
  const jsonLd = isIndexable
    ? createBinderPageJsonLd({
        cardCount: binder?.binderCardCount,
        description: description || "",
        products,
      })
    : undefined;

  return {
    canonicalPath,
    description,
    jsonLd,
    robots: isResolved
      ? isIndexable
        ? "index,follow"
        : "noindex,follow"
      : undefined,
    shortTitle,
    title: fullTitle,
  };
};
