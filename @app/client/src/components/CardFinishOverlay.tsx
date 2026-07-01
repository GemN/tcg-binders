import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

interface CardFinishOverlayProps {
  className?: string;
  finish: string | null | undefined;
}

const nonFoilFinishes = new Set(["normal", "nonfoil"]);

const getNormalizedFinish = (finish: string | null | undefined) => {
  const normalizedFinish = finish?.trim().toLowerCase();
  return normalizedFinish || null;
};

const formatFinishFallbackLabel = (finish: string): string => {
  return finish
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const CardFinishOverlay = ({
  className,
  finish,
}: CardFinishOverlayProps) => {
  const { t } = useTranslation("common");
  const normalizedFinish = getNormalizedFinish(finish);

  if (!normalizedFinish || nonFoilFinishes.has(normalizedFinish)) return null;

  const shouldShowBadge = normalizedFinish !== "foil";
  const finishLabel = shouldShowBadge
    ? t(`card.finish.${normalizedFinish}`, {
        defaultValue: formatFinishFallbackLabel(normalizedFinish),
      })
    : null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        className
      )}
    >
      <span className="card-foil-mask" aria-hidden="true" />
      {finishLabel && (
        <span className="absolute top-1/2 left-1/2 z-10 max-w-[calc(100%-1rem)] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white/60 bg-destructive px-2 py-0.5 text-[0.625rem] font-semibold leading-4 text-white uppercase shadow-lg">
          {finishLabel}
        </span>
      )}
    </div>
  );
};
