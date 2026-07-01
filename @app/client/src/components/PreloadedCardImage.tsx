import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { CardImage, type CardImageProps } from "@/components/CardImage";
import { getPreferredCardImageUrl } from "@/lib/cardImageUrl";

interface CardImageSource {
  imageUrl: string;
  scryfallId: string | null;
}

const getCardImageSource = (
  imageUrl: string | null | undefined,
  scryfallId: string | null | undefined
): CardImageSource => ({
  imageUrl: imageUrl || "",
  scryfallId: scryfallId || null,
});

export const PreloadedCardImage = ({
  children,
  imageSize = "grid",
  imageUrl,
  scryfallId,
  ...cardImageProps
}: CardImageProps) => {
  const [displayedImageSource, setDisplayedImageSource] =
    useState<CardImageSource>(() => getCardImageSource(imageUrl, scryfallId));
  const [pendingImageSource, setPendingImageSource] =
    useState<CardImageSource | null>(null);

  useEffect(() => {
    const nextImageSource = getCardImageSource(imageUrl, scryfallId);

    if (!nextImageSource.imageUrl) {
      setDisplayedImageSource(nextImageSource);
      setPendingImageSource(null);
      return;
    }

    if (
      nextImageSource.imageUrl === displayedImageSource.imageUrl &&
      nextImageSource.scryfallId === displayedImageSource.scryfallId
    ) {
      setPendingImageSource(null);
      return;
    }

    setPendingImageSource(nextImageSource);
  }, [
    displayedImageSource.imageUrl,
    displayedImageSource.scryfallId,
    imageUrl,
    scryfallId,
  ]);

  const isLoadingNextImage =
    !!pendingImageSource &&
    (pendingImageSource.imageUrl !== displayedImageSource.imageUrl ||
      pendingImageSource.scryfallId !== displayedImageSource.scryfallId);
  const pendingPreferredImageUrl = getPreferredCardImageUrl(
    pendingImageSource?.imageUrl,
    imageSize,
    pendingImageSource?.scryfallId
  );

  return (
    <CardImage
      {...cardImageProps}
      imageSize={imageSize}
      imageUrl={displayedImageSource.imageUrl}
      scryfallId={displayedImageSource.scryfallId}
    >
      {isLoadingNextImage && pendingPreferredImageUrl && (
        <>
          <img
            src={pendingPreferredImageUrl}
            alt=""
            className="sr-only"
            onLoad={() => {
              if (pendingImageSource) {
                setDisplayedImageSource(pendingImageSource);
              }
              setPendingImageSource(null);
            }}
            onError={() => setPendingImageSource(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#343434]/55">
            <Loader2 className="size-8 animate-spin text-[#fde9c9]" />
          </div>
        </>
      )}
      {children}
    </CardImage>
  );
};
