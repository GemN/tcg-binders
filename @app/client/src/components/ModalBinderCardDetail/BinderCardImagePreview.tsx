import { PreloadedCardImage } from "@/components/PreloadedCardImage";

interface BinderCardImagePreviewProps {
  finish: string | null | undefined;
  imageAlt: string;
  imageUrl: string | null | undefined;
  noImageLabel: string;
  scryfallId: string | null | undefined;
}

export const BinderCardImagePreview = ({
  finish,
  imageAlt,
  imageUrl,
  noImageLabel,
  scryfallId,
}: BinderCardImagePreviewProps) => (
  <PreloadedCardImage
    alt={imageAlt}
    className="mx-auto w-full max-w-[22rem] rounded-[4.75%_/_3.5%] border border-border shadow-xl"
    finish={finish}
    imageSize="detail"
    imageUrl={imageUrl}
    loading="eager"
    noImageLabel={noImageLabel}
    scryfallId={scryfallId}
  />
);
