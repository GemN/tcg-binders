import { PreloadedCardImage } from "@/components/PreloadedCardImage";

interface CardDetailImagePreviewProps {
  finish: string | null | undefined;
  imageAlt: string;
  imageUrl: string | null | undefined;
  noImageLabel: string;
  scryfallId: string | null | undefined;
}

export const CardDetailImagePreview = ({
  finish,
  imageAlt,
  imageUrl,
  noImageLabel,
  scryfallId,
}: CardDetailImagePreviewProps) => (
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
