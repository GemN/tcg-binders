import { type CSSProperties, type ReactNode, useEffect, useState } from "react";

import { CardFinishOverlay } from "@/components/CardFinishOverlay";
import { fetchCardImageBlob } from "@/lib/cardImageFetch";
import { type CardImageSize, getCardImageUrls } from "@/lib/cardImageUrl";
import { cn } from "@/lib/utils";

export interface CardImageProps {
  alt: string;
  children?: ReactNode;
  className?: string;
  fallbackClassName?: string;
  finish: string | null | undefined;
  imageLoadSignal?: AbortSignal;
  imageSize?: CardImageSize;
  imageUrl: string | null | undefined;
  loading?: "eager" | "lazy";
  noImageLabel: string;
  onImageLoadStateChange?: (isLoading: boolean) => void;
  showBadgeFinish?: boolean;
  scryfallId?: string | null;
  style?: CSSProperties;
  useWebpSource?: boolean;
}

const cardImagePlaceholderClassName =
  "bg-[#f5f7f8] bg-[linear-gradient(90deg,rgba(29,33,37,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(29,33,37,0.04)_1px,transparent_1px),linear-gradient(145deg,#ffffff,#edf1f3)] bg-[size:18px_18px,18px_18px,auto]";

interface LoadedCardImage {
  objectUrl: string;
  sourceUrl: string;
}

export const CardImage = ({
  alt,
  children,
  className,
  fallbackClassName,
  finish,
  imageLoadSignal,
  imageSize = "grid",
  imageUrl,
  loading = "lazy",
  noImageLabel,
  onImageLoadStateChange,
  showBadgeFinish = true,
  scryfallId,
  style,
  useWebpSource = true,
}: CardImageProps) => {
  const imageUrls = getCardImageUrls(imageUrl, imageSize, scryfallId);
  const fallbackUrl = imageUrls.fallbackUrl;
  const webpUrl = imageUrls.webpUrl;
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<LoadedCardImage | null>(null);
  const hasImageError = failedImageUrl === fallbackUrl;
  const loadedImageUrl =
    loadedImage?.sourceUrl === fallbackUrl ? loadedImage.objectUrl : null;
  const displayedImageUrl = imageLoadSignal ? loadedImageUrl : fallbackUrl;
  const hasImageSource = !!fallbackUrl && !hasImageError;
  const canDisplayImage = !!displayedImageUrl && hasImageSource;

  useEffect(() => {
    if (!imageLoadSignal || !fallbackUrl) return;

    let objectUrl: string | null = null;
    let isLoading = true;
    onImageLoadStateChange?.(true);

    const finishLoading = () => {
      if (!isLoading) return;

      isLoading = false;
      onImageLoadStateChange?.(false);
    };

    const loadImage = async () => {
      try {
        const imageBlob = await fetchCardImageBlob(
          fallbackUrl,
          imageLoadSignal
        );
        if (imageLoadSignal.aborted) return;

        objectUrl = URL.createObjectURL(imageBlob);
        setLoadedImage({ objectUrl, sourceUrl: fallbackUrl });
        finishLoading();
      } catch (error) {
        if (
          imageLoadSignal.aborted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          finishLoading();
          return;
        }

        setFailedImageUrl(fallbackUrl);
        finishLoading();
      }
    };

    void loadImage();

    return () => {
      finishLoading();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fallbackUrl, imageLoadSignal, onImageLoadStateChange]);

  return (
    <div
      className={cn(
        "relative flex aspect-[63/88] items-center justify-center overflow-hidden rounded-[4.75%_/_3.5%]",
        className,
        cardImagePlaceholderClassName
      )}
      style={style}
    >
      {canDisplayImage ? (
        <picture className="block h-full w-full">
          {!imageLoadSignal && useWebpSource && webpUrl && (
            <source srcSet={webpUrl} type="image/webp" />
          )}
          <img
            src={displayedImageUrl || undefined}
            alt={alt}
            className="h-full w-full object-cover"
            decoding="async"
            loading={loading}
            onError={() => setFailedImageUrl(fallbackUrl)}
          />
        </picture>
      ) : !hasImageSource ? (
        <span
          className={cn(
            "px-3 text-center text-sm text-muted-foreground",
            fallbackClassName
          )}
        >
          {noImageLabel}
        </span>
      ) : null}
      {canDisplayImage && (
        <CardFinishOverlay finish={finish} showBadge={showBadgeFinish} />
      )}
      {children}
    </div>
  );
};
