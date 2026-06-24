import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface BinderCardImagePreviewProps {
  imageAlt: string;
  imageUrl: string | null | undefined;
  noImageLabel: string;
}

export const BinderCardImagePreview = ({
  imageAlt,
  imageUrl,
  noImageLabel,
}: BinderCardImagePreviewProps) => {
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
    <div className="relative mx-auto flex aspect-[63/88] w-full max-w-[22rem] items-center justify-center rounded-[4.75%_/_3.5%] overflow-hidden border border-[#d8d1c3] bg-[#343434] shadow-xl">
      {displayedImageUrl ? (
        <img
          src={displayedImageUrl}
          alt={imageAlt}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-sm text-[#fde9c9]">{noImageLabel}</span>
      )}

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
          <div className="absolute inset-0 flex items-center justify-center bg-[#343434]/55 overflow-hidden">
            <Loader2 className="size-8 animate-spin text-[#fde9c9]" />
          </div>
        </>
      )}
    </div>
  );
};
