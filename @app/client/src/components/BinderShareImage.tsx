import { QRCodeSVG } from "qrcode.react";
import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { CardConditionBadge } from "@/components/CardConditionBadge";
import { CardImage } from "@/components/CardImage";
import type { BinderCardRecord } from "@/lib/binderCardPricing";
import { getCardImageBaseUrl, getCardScryfallId } from "@/lib/cardImageUrl";
import { formatCurrency } from "@/lib/currency";

export const BINDER_SHARE_IMAGE_CARD_COUNT = 18;
export const BINDER_SHARE_IMAGE_WIDTH = 1200;
export const BINDER_SHARE_IMAGE_PIXEL_RATIO = 2;

interface BinderShareImageOptions {
  priceFontSize: number;
  showCondition: boolean;
  showPrice: boolean;
  showQrCode: boolean;
  showQuantity: boolean;
}

interface BinderShareImageCardProps {
  binderCard: BinderCardRecord;
  imageLoadSignal: AbortSignal;
  locale: string;
  noImageLabel: string;
  onImageLoadStateChange: (isLoading: boolean) => void;
  options: BinderShareImageOptions;
}

const BinderShareImageCard = ({
  binderCard,
  imageLoadSignal,
  locale,
  noImageLabel,
  onImageLoadStateChange,
  options,
}: BinderShareImageCardProps) => {
  const priceAmount = Number(binderCard.priceAmount);
  const priceLabel =
    options.showPrice &&
    binderCard.priceAmount !== null &&
    binderCard.priceAmount !== undefined &&
    binderCard.priceCurrency &&
    Number.isFinite(priceAmount)
      ? formatCurrency(priceAmount, binderCard.priceCurrency, locale)
      : null;

  return (
    <CardImage
      alt={binderCard.card?.name || ""}
      className="shadow-md shadow-black/15"
      fallbackClassName="text-[#68645d]"
      finish={binderCard.finish}
      imageLoadSignal={imageLoadSignal}
      imageSize="grid"
      imageUrl={getCardImageBaseUrl(binderCard.card)}
      loading="eager"
      noImageLabel={noImageLabel}
      onImageLoadStateChange={onImageLoadStateChange}
      scryfallId={getCardScryfallId(binderCard.card)}
      useWebpSource={false}
    >
      {(options.showCondition ||
        (options.showQuantity && binderCard.quantity > 1)) && (
        <span className="absolute top-[18%] left-0 z-10 flex w-10 flex-col items-stretch gap-1 shadow-lg shadow-black/25">
          {options.showCondition && (
            <CardConditionBadge
              condition={binderCard.condition}
              className="h-6 w-full min-w-0 rounded-l-none rounded-r px-0 py-0 text-sm"
            />
          )}
          {options.showQuantity && binderCard.quantity > 1 && (
            <span className="flex h-6 w-full items-center justify-center rounded-r bg-[#22262A]/70 text-sm leading-none tabular-nums text-white">
              x{binderCard.quantity}
            </span>
          )}
        </span>
      )}
      {priceLabel && (
        <span
          className="absolute right-0 bottom-5 z-10 max-w-[80%] truncate rounded-l bg-[#22262A]/80 px-2 py-1 font-bold leading-none tabular-nums text-white shadow-lg shadow-black/25"
          style={{ fontSize: options.priceFontSize }}
        >
          {priceLabel}
        </span>
      )}
    </CardImage>
  );
};

interface BinderShareImageCompositionProps {
  binderCards: BinderCardRecord[];
  imageLoadSignal: AbortSignal;
  locale: string;
  noImageLabel: string;
  onImageLoadStateChange: (isLoading: boolean) => void;
  options: BinderShareImageOptions;
  qrCodeLabel: string;
  shareUrl: string;
  sellerName: string;
}

const BinderShareImageComposition = forwardRef<
  HTMLDivElement,
  BinderShareImageCompositionProps
>(function BinderShareImageComposition(
  {
    binderCards,
    imageLoadSignal,
    locale,
    noImageLabel,
    onImageLoadStateChange,
    options,
    qrCodeLabel,
    shareUrl,
    sellerName,
  },
  ref
) {
  return (
    <div
      ref={ref}
      className="box-border grid shrink-0 gap-6 bg-[#f5f3ee] p-10 font-sans text-[#1d2125]"
      style={{ width: BINDER_SHARE_IMAGE_WIDTH }}
    >
      <div className="grid h-[88px] grid-cols-[1fr_76px] items-center gap-6">
        <span className="min-w-0 truncate font-display text-[32px] font-bold tracking-tight">
          {sellerName}
        </span>
        {options.showQrCode && (
          <QRCodeSVG
            bgColor="#ffffff"
            fgColor="#1d2125"
            level="M"
            marginSize={2}
            size={76}
            title={qrCodeLabel}
            value={shareUrl}
          />
        )}
      </div>

      <div className="grid aspect-[1120/764] grid-cols-6 grid-rows-3 gap-3">
        {binderCards.map((binderCard) => (
          <BinderShareImageCard
            key={binderCard.id}
            binderCard={binderCard}
            imageLoadSignal={imageLoadSignal}
            locale={locale}
            noImageLabel={noImageLabel}
            onImageLoadStateChange={onImageLoadStateChange}
            options={options}
          />
        ))}
      </div>

      <div className="flex h-[52px] items-center justify-center">
        <img
          src="/logo_megabinder.svg"
          alt="TCGBinder"
          className="h-5 w-auto"
          decoding="sync"
          loading="eager"
        />
      </div>
    </div>
  );
});

interface BinderShareImagePreviewSize {
  height: number;
  scale: number;
}

interface BinderShareImagePreviewProps
  extends BinderShareImageCompositionProps {}

export const BinderShareImagePreview = forwardRef<
  HTMLDivElement,
  BinderShareImagePreviewProps
>(function BinderShareImagePreview(props, forwardedRef) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const compositionRef = useRef<HTMLDivElement | null>(null);
  const [previewSize, setPreviewSize] = useState<BinderShareImagePreviewSize>({
    height: 0,
    scale: 1,
  });

  const setCompositionRef = useCallback(
    (node: HTMLDivElement | null) => {
      compositionRef.current = node;

      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef]
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const composition = compositionRef.current;
    if (!viewport || !composition) return;

    const updatePreviewSize = () => {
      const scale = Math.min(
        viewport.clientWidth / BINDER_SHARE_IMAGE_WIDTH,
        1
      );

      setPreviewSize({
        height: composition.offsetHeight * scale,
        scale,
      });
    };

    updatePreviewSize();

    const resizeObserver = new ResizeObserver(updatePreviewSize);
    resizeObserver.observe(viewport);
    resizeObserver.observe(composition);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={viewportRef}
      className="w-full overflow-hidden rounded-lg border bg-[#f5f3ee]"
      style={{ height: previewSize.height }}
    >
      <div
        className="origin-top-left"
        style={{ transform: `scale(${previewSize.scale})` }}
      >
        <BinderShareImageComposition ref={setCompositionRef} {...props} />
      </div>
    </div>
  );
});
