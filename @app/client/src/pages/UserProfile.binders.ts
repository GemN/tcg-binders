import { BinderVisibility, type PublicBindersByOwnerQuery } from "@app/graphql";

import type { BinderGalleryBinder } from "../components/BinderGallery.tsx";
import { getCardImageBaseUrl, getCardScryfallId } from "../lib/cardImageUrl.ts";

export const getPublicProfileBinders = (
  data: PublicBindersByOwnerQuery | undefined
): BinderGalleryBinder[] =>
  data?.bindersCollection?.edges
    .filter(({ node }) => node.visibility === BinderVisibility.Listed)
    .map(({ node }) => ({
      cardCount: node.binderCardCount ?? 0,
      coverImageUrl: getCardImageBaseUrl(node.binderCards?.edges[0]?.node.card),
      coverScryfallId: getCardScryfallId(node.binderCards?.edges[0]?.node.card),
      id: node.id,
      name: node.name,
      shortId: node.shortId,
      visibility: node.visibility,
    })) || [];
