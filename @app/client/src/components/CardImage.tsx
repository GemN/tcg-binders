import type { CSSProperties, ReactNode } from "react";

import { CardFinishOverlay } from "@/components/CardFinishOverlay";
import { cn } from "@/lib/utils";

export interface CardImageProps {
  alt: string;
  children?: ReactNode;
  className?: string;
  fallbackClassName?: string;
  finish: string | null | undefined;
  imageUrl: string | null | undefined;
  noImageLabel: string;
  style?: CSSProperties;
}

export const CardImage = ({
  alt,
  children,
  className,
  fallbackClassName,
  finish,
  imageUrl,
  noImageLabel,
  style,
}: CardImageProps) => (
  <div
    className={cn(
      "relative flex aspect-[63/88] items-center justify-center overflow-hidden",
      className
    )}
    style={style}
  >
    {imageUrl ? (
      <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
    ) : (
      <span className={cn("text-sm", fallbackClassName)}>{noImageLabel}</span>
    )}
    {imageUrl && <CardFinishOverlay finish={finish} />}
    {children}
  </div>
);
