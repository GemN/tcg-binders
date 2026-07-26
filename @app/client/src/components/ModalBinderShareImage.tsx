import {
  type BinderCardsFilter,
  type BinderCardsOrderBy,
  BinderVisibility,
  useBinderShareImageCardsQuery,
} from "@app/graphql";
import { toBlob } from "html-to-image";
import { ChevronLeft, ChevronRight, Share2, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  BINDER_SHARE_IMAGE_CARD_COUNT,
  BINDER_SHARE_IMAGE_PIXEL_RATIO,
  BINDER_SHARE_IMAGE_WIDTH,
  BinderShareImagePreview,
} from "@/components/BinderShareImage";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { handleError } from "@/lib/error";

interface ShareImageOptionProps {
  checked: boolean;
  disabled?: boolean;
  id: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}

const ShareImageOption = ({
  checked,
  disabled,
  id,
  label,
  onCheckedChange,
}: ShareImageOptionProps) => {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
};

const waitForAnimationFrame = (): Promise<void> => {
  return new Promise((resolve) =>
    window.requestAnimationFrame(() => resolve())
  );
};

const waitForImageAssets = async (node: HTMLElement): Promise<void> => {
  const images = Array.from(node.querySelectorAll("img"));

  await Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    })
  );

  await waitForAnimationFrame();
  await waitForAnimationFrame();
};

const getShareImageFilename = (
  binderName: string,
  pageNumber: number
): string => {
  const safeBinderName = binderName
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeBinderName || "binder"}-page-${pageNumber}.png`;
};

const downloadShareImage = (file: File): void => {
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
};

interface ModalBinderShareImageProps {
  binderName: string;
  binderVisibility: BinderVisibility;
  cardFilter: BinderCardsFilter | null;
  cardOrderBy: BinderCardsOrderBy[];
  initialCardIndex: number;
  isSellerLoading: boolean;
  open: boolean;
  sellerName: string;
  shareUrl: string;
  shortId: string;
  totalBinderCards: number;
  onOpenChange: (open: boolean) => void;
}

export const ModalBinderShareImage = ({
  binderName,
  binderVisibility,
  cardFilter,
  cardOrderBy,
  initialCardIndex,
  isSellerLoading,
  open,
  sellerName,
  shareUrl,
  shortId,
  totalBinderCards,
  onOpenChange,
}: ModalBinderShareImageProps) => {
  const { i18n, t } = useTranslation(["binder", "common"]);
  const quantityOptionId = useId();
  const priceOptionId = useId();
  const priceFontSizeId = useId();
  const conditionOptionId = useId();
  const qrCodeOptionId = useId();
  const imageRef = useRef<HTMLDivElement>(null);
  const [showQuantity, setShowQuantity] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [priceFontSize, setPriceFontSize] = useState(16);
  const [showCondition, setShowCondition] = useState(false);
  const [showQrCode, setShowQrCode] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageLoadController, setImageLoadController] = useState(
    () => new AbortController()
  );
  const [pendingImageLoadCount, setPendingImageLoadCount] = useState(0);
  const imagePageCount = Math.max(
    Math.ceil(totalBinderCards / BINDER_SHARE_IMAGE_CARD_COUNT),
    1
  );
  const initialImagePageIndex = Math.min(
    Math.floor(initialCardIndex / BINDER_SHARE_IMAGE_CARD_COUNT),
    imagePageCount - 1
  );
  const [imagePageIndex, setImagePageIndex] = useState(initialImagePageIndex);
  const canShowQrCode = binderVisibility !== BinderVisibility.Private;
  const shouldShowQrCode = canShowQrCode && showQrCode;
  const { data, error, loading } = useBinderShareImageCardsQuery({
    variables: {
      shortId,
      cardOffset: imagePageIndex * BINDER_SHARE_IMAGE_CARD_COUNT,
      cardFilter,
      cardOrderBy,
    },
    skip: !open,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
  const binderCards =
    data?.binderCardsByShortId?.edges
      .map(({ node }) => node)
      .filter((binderCard) => !!binderCard.card) || [];
  const isPreviewLoading = isSellerLoading || loading;

  useEffect(() => {
    if (!open) return;

    setShowQuantity(true);
    setShowPrice(true);
    setPriceFontSize(16);
    setShowCondition(false);
    setShowQrCode(true);
    setImagePageIndex(initialImagePageIndex);
    setIsGeneratingImage(false);
    setImageLoadController((currentController) => {
      return currentController.signal.aborted
        ? new AbortController()
        : currentController;
    });
  }, [initialImagePageIndex, open]);

  useEffect(() => {
    return () => imageLoadController.abort();
  }, [imageLoadController]);

  const handleImageLoadStateChange = useCallback((isLoading: boolean) => {
    setPendingImageLoadCount((currentCount) =>
      Math.max(currentCount + (isLoading ? 1 : -1), 0)
    );
  }, []);

  const restartImageLoads = () => {
    setImageLoadController((currentController) => {
      currentController.abort();
      return new AbortController();
    });
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) imageLoadController.abort();
    onOpenChange(nextOpen);
  };

  const handlePreviousImagePage = () => {
    restartImageLoads();
    setImagePageIndex((currentPage) => Math.max(currentPage - 1, 0));
  };

  const handleNextImagePage = () => {
    restartImageLoads();
    setImagePageIndex((currentPage) =>
      Math.min(currentPage + 1, imagePageCount - 1)
    );
  };

  const handleShareImage = async () => {
    const imageNode = imageRef.current;
    if (!imageNode || isGeneratingImage || pendingImageLoadCount > 0) return;

    setIsGeneratingImage(true);

    try {
      await document.fonts.ready;
      await waitForImageAssets(imageNode);

      const imageBlob = await toBlob(imageNode, {
        backgroundColor: "#f5f3ee",
        height: imageNode.offsetHeight,
        pixelRatio: BINDER_SHARE_IMAGE_PIXEL_RATIO,
        width: BINDER_SHARE_IMAGE_WIDTH,
      });

      if (!imageBlob) {
        throw new Error("Share image generation returned no image data.");
      }

      const imageFile = new File(
        [imageBlob],
        getShareImageFilename(binderName, imagePageIndex + 1),
        { type: "image/png" }
      );

      downloadShareImage(imageFile);
    } catch (imageError) {
      handleError(imageError, t("binder:share.image_error"));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-5xl"
      >
        <DialogHeader className="gap-1">
          <div className="flex min-w-0 pr-8">
            <DialogTitle>{t("binder:share.image_action")}</DialogTitle>
          </div>
          <DialogDescription>
            {t("binder:share.image_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 gap-4 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-start">
          <div className="min-w-0">
            {error ? (
              <div className="flex min-h-48 items-center justify-center rounded-lg border bg-muted/20 p-6 text-center text-sm text-destructive">
                {t("binder:share.image_load_error")}
              </div>
            ) : isPreviewLoading ? (
              <div className="flex aspect-[1200/1042] items-center justify-center rounded-lg border bg-[#f5f3ee]">
                <Loading />
              </div>
            ) : (
              <BinderShareImagePreview
                ref={imageRef}
                binderCards={binderCards}
                imageLoadSignal={imageLoadController.signal}
                locale={i18n.language}
                noImageLabel={t("binder:no_image")}
                onImageLoadStateChange={handleImageLoadStateChange}
                options={{
                  priceFontSize,
                  showCondition,
                  showPrice,
                  showQrCode: shouldShowQrCode,
                  showQuantity,
                }}
                qrCodeLabel={t("binder:share.qr_code_label")}
                sellerName={sellerName}
                shareUrl={shareUrl}
              />
            )}
          </div>

          <div className="grid content-start gap-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-1">
              <ShareImageOption
                checked={showQuantity}
                id={quantityOptionId}
                label={t("binder:share.show_quantity")}
                onCheckedChange={setShowQuantity}
              />
              <div className="col-span-full grid gap-1.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={priceOptionId}
                    checked={showPrice}
                    onCheckedChange={(value) => setShowPrice(value === true)}
                  />
                  <Label htmlFor={priceOptionId}>
                    {t("binder:share.show_price")}
                  </Label>
                  {showPrice && (
                    <output
                      htmlFor={priceFontSizeId}
                      className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium tabular-nums shadow-xs ring-1 ring-border"
                    >
                      {t("binder:share.price_font_size_value", {
                        size: priceFontSize,
                      })}
                    </output>
                  )}
                </div>
                {showPrice && (
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 pl-6">
                    <span
                      aria-hidden="true"
                      className="text-xs text-muted-foreground"
                    >
                      A
                    </span>
                    <input
                      id={priceFontSizeId}
                      className="h-8 w-full cursor-pointer appearance-none bg-transparent
                        [&::-webkit-slider-runnable-track]:h-1.5
                        [&::-webkit-slider-runnable-track]:rounded-full
                        [&::-webkit-slider-runnable-track]:bg-border
                        [&::-webkit-slider-thumb]:mt-[-7px]
                        [&::-webkit-slider-thumb]:size-5
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-primary
                        [&::-webkit-slider-thumb]:bg-background
                        [&::-webkit-slider-thumb]:shadow-sm
                        [&::-moz-range-track]:h-1.5
                        [&::-moz-range-track]:rounded-full
                        [&::-moz-range-track]:bg-border
                        [&::-moz-range-thumb]:size-5
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-primary
                        [&::-moz-range-thumb]:bg-background
                        [&::-moz-range-thumb]:shadow-sm"
                      type="range"
                      min="12"
                      max="36"
                      step="1"
                      value={priceFontSize}
                      aria-label={t("binder:share.price_font_size")}
                      aria-valuetext={t("binder:share.price_font_size_value", {
                        size: priceFontSize,
                      })}
                      onChange={(event) =>
                        setPriceFontSize(Number(event.target.value))
                      }
                    />
                    <span
                      aria-hidden="true"
                      className="text-lg font-medium text-muted-foreground"
                    >
                      A
                    </span>
                  </div>
                )}
              </div>
              <ShareImageOption
                checked={showCondition}
                id={conditionOptionId}
                label={t("binder:share.show_condition")}
                onCheckedChange={setShowCondition}
              />
              <ShareImageOption
                checked={shouldShowQrCode}
                disabled={!canShowQrCode}
                id={qrCodeOptionId}
                label={t("binder:share.show_qr_code")}
                onCheckedChange={setShowQrCode}
              />
              {!canShowQrCode && (
                <span className="col-span-full text-xs text-muted-foreground">
                  {t("binder:share.private_qr_unavailable")}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("binder:share.previous_image_page")}
                disabled={imagePageIndex === 0 || isGeneratingImage}
                onClick={handlePreviousImagePage}
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <span className="text-center text-sm font-medium tabular-nums">
                {t("binder:share.image_page", {
                  page: imagePageIndex + 1,
                  pageCount: imagePageCount,
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("binder:share.next_image_page")}
                disabled={
                  imagePageIndex >= imagePageCount - 1 || isGeneratingImage
                }
                onClick={handleNextImagePage}
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>

            <div className="grid gap-2">
              <Button
                type="button"
                disabled={
                  isPreviewLoading ||
                  pendingImageLoadCount > 0 ||
                  !!error ||
                  isGeneratingImage
                }
                onClick={() => void handleShareImage()}
              >
                {isGeneratingImage ? (
                  <Loading />
                ) : (
                  <Share2 aria-hidden="true" />
                )}
                {isGeneratingImage
                  ? t("binder:share.generating_image")
                  : t("binder:share.image_action")}
              </Button>
            </div>
          </div>
        </div>
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("common:close")}
            className="absolute right-4 top-4"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
