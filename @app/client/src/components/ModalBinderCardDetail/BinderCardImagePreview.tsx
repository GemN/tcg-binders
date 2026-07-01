import { PreloadedCardImage } from "@/components/PreloadedCardImage";

interface BinderCardImagePreviewProps {
  finish: string | null | undefined;
  imageAlt: string;
  imageUrl: string | null | undefined;
  noImageLabel: string;
}

export const BinderCardImagePreview = ({
  finish,
  imageAlt,
  imageUrl,
  noImageLabel,
}: BinderCardImagePreviewProps) => (
  <PreloadedCardImage
    alt={imageAlt}
    className="mx-auto w-full max-w-[22rem] rounded-[4.75%_/_3.5%] border border-[#d8d1c3] bg-[#343434] shadow-xl"
    fallbackClassName="text-[#fde9c9]"
    finish={finish}
    imageUrl={imageUrl}
    noImageLabel={noImageLabel}
  />
);
