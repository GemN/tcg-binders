import {
  type CardImageSize,
  getPreferredCardImageUrl,
} from "@/lib/cardImageUrl";

const preloadedImageUrls = new Set<string>();

export const preloadImage = (
  imageUrl: string | null | undefined,
  size: CardImageSize = "grid",
  scryfallId?: string | null
) => {
  const preferredImageUrl = getPreferredCardImageUrl(
    imageUrl,
    size,
    scryfallId
  );

  if (!preferredImageUrl || preloadedImageUrls.has(preferredImageUrl)) return;
  if (typeof Image === "undefined") return;

  preloadedImageUrls.add(preferredImageUrl);

  const image = new Image();
  image.decoding = "async";
  image.src = preferredImageUrl;

  void image.decode?.().catch(() => {
    preloadedImageUrls.delete(preferredImageUrl);
  });
};
