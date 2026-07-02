import type { CSSProperties, ReactNode } from "react";

import { CardFinishOverlay } from "@/components/CardFinishOverlay";
import { type CardImageSize, getCardImageUrls } from "@/lib/cardImageUrl";
import { cn } from "@/lib/utils";

export interface CardImageProps {
  alt: string;
  children?: ReactNode;
  className?: string;
  fallbackClassName?: string;
  finish: string | null | undefined;
  imageSize?: CardImageSize;
  imageUrl: string | null | undefined;
  loading?: "eager" | "lazy";
  noImageLabel: string;
  scryfallId?: string | null;
  style?: CSSProperties;
}

const cardImagePlaceholderClassName =
  "bg-[#f5f7f8] bg-[linear-gradient(90deg,rgba(29,33,37,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(29,33,37,0.04)_1px,transparent_1px),linear-gradient(145deg,#ffffff,#edf1f3)] bg-[size:18px_18px,18px_18px,auto]";

export const CardImage = ({
  alt,
  children,
  className,
  fallbackClassName,
  finish,
  imageSize = "grid",
  imageUrl,
  loading = "lazy",
  noImageLabel,
  scryfallId,
  style,
}: CardImageProps) => {
  const imageUrls = getCardImageUrls(imageUrl, imageSize, scryfallId);

  return (
    <div
      className={cn(
        "relative flex aspect-[63/88] items-center justify-center overflow-hidden rounded-[4.75%_/_3.5%]",
        className,
        cardImagePlaceholderClassName
      )}
      style={style}
    >
      {imageUrls.fallbackUrl ? (
        <picture className="block h-full w-full">
          {imageUrls.webpUrl && (
            <source srcSet={imageUrls.webpUrl} type="image/webp" />
          )}
          <img
            src={imageUrls.fallbackUrl}
            alt={alt}
            className="h-full w-full object-cover"
            decoding="async"
            loading={loading}
          />
        </picture>
      ) : (
        <span
          className={cn(
            "px-3 text-center text-sm text-muted-foreground",
            fallbackClassName
          )}
        >
          {noImageLabel}
        </span>
      )}
      {imageUrls.fallbackUrl && <CardFinishOverlay finish={finish} />}
      {children}
    </div>
  );
};
