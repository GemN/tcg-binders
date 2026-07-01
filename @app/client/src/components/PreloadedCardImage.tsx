import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { CardImage, type CardImageProps } from "@/components/CardImage";

export const PreloadedCardImage = ({
  children,
  imageUrl,
  ...cardImageProps
}: CardImageProps) => {
  const [displayedImageUrl, setDisplayedImageUrl] = useState(imageUrl || "");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const nextImageUrl = imageUrl || "";

    if (!nextImageUrl) {
      setDisplayedImageUrl("");
      setPendingImageUrl(null);
      return;
    }

    if (nextImageUrl === displayedImageUrl) {
      setPendingImageUrl(null);
      return;
    }

    setPendingImageUrl(nextImageUrl);
  }, [displayedImageUrl, imageUrl]);

  const isLoadingNextImage =
    !!pendingImageUrl && pendingImageUrl !== displayedImageUrl;

  return (
    <CardImage {...cardImageProps} imageUrl={displayedImageUrl}>
      {isLoadingNextImage && (
        <>
          <img
            src={pendingImageUrl || ""}
            alt=""
            className="sr-only"
            onLoad={() => {
              if (pendingImageUrl) {
                setDisplayedImageUrl(pendingImageUrl);
              }
              setPendingImageUrl(null);
            }}
            onError={() => setPendingImageUrl(null)}
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
