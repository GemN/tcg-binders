import { CardDetailImagePreview } from "@/components/CardDetailImagePreview";
import { CardMarketPriceButtons } from "@/components/CardMarketPriceButtons";
import { type BinderCardPriceInput } from "@/lib/binderCardPricing";

import type { ModalBinderCardRecord } from "./types";

interface BinderCardMediaPanelProps {
  binderCard: ModalBinderCardRecord | null;
  imageAlt: string;
  imageUrl: string | null | undefined;
  noImageLabel: string;
  scryfallId: string | null | undefined;
  showConvertedMarketPrices: boolean;
  formatPrice: (input: BinderCardPriceInput) => string;
}

export const BinderCardMediaPanel = ({
  binderCard,
  imageAlt,
  imageUrl,
  noImageLabel,
  scryfallId,
  showConvertedMarketPrices,
  formatPrice,
}: BinderCardMediaPanelProps) => (
  <div className="flex flex-col gap-3">
    <CardDetailImagePreview
      finish={binderCard?.finish}
      imageAlt={imageAlt}
      imageUrl={imageUrl}
      noImageLabel={noImageLabel}
      scryfallId={scryfallId}
    />

    <CardMarketPriceButtons
      formatPrice={formatPrice}
      marketPrices={binderCard?.card?.marketPrices?.edges.map(
        ({ node }) => node
      )}
      preferredFinishes={[binderCard?.finish || "normal", "normal"]}
      showConvertedMarketPrices={showConvertedMarketPrices}
    />
  </div>
);
