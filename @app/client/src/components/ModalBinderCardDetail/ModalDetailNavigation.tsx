import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface ModalDetailNavigationProps {
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextLabel: string;
  previousLabel: string;
  onGoNext: () => void;
  onGoPrevious: () => void;
}

export const ModalDetailNavigation = ({
  canGoNext,
  canGoPrevious,
  nextLabel,
  previousLabel,
  onGoNext,
  onGoPrevious,
}: ModalDetailNavigationProps) => (
  <>
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={!canGoPrevious}
      aria-label={previousLabel}
      className="absolute top-1/2 -left-4 z-10 size-9 -translate-y-1/2 rounded-full border-border bg-card text-foreground shadow-lg hover:bg-accent sm:-left-5 sm:size-10"
      onClick={onGoPrevious}
    >
      <ChevronLeft className="size-5" />
    </Button>
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={!canGoNext}
      aria-label={nextLabel}
      className="absolute top-1/2 -right-4 z-10 size-9 -translate-y-1/2 rounded-full border-border bg-card text-foreground shadow-lg hover:bg-accent sm:-right-5 sm:size-10"
      onClick={onGoNext}
    >
      <ChevronRight className="size-5" />
    </Button>
  </>
);
