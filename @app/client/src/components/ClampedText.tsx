import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface ClampedTextProps {
  children: string;
  clampClassName?: string;
  className?: string;
  indicator?: string;
  indicatorClassName?: string;
  onClampChange?: (isClamped: boolean) => void;
  shouldMeasure?: boolean;
}

export const ClampedText = ({
  children,
  clampClassName = "line-clamp-2",
  className,
  indicator,
  indicatorClassName,
  onClampChange,
  shouldMeasure = true,
}: ClampedTextProps) => {
  const textRef = useRef<HTMLParagraphElement | null>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const textElement = textRef.current;
    if (!shouldMeasure || !textElement || !children) {
      setIsClamped(false);
      onClampChange?.(false);
      return;
    }

    const updateClampState = () => {
      const nextIsClamped =
        textElement.scrollHeight > textElement.clientHeight + 1;
      setIsClamped(nextIsClamped);
      onClampChange?.(nextIsClamped);
    };

    updateClampState();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateClampState);
      return () => window.removeEventListener("resize", updateClampState);
    }

    const resizeObserver = new ResizeObserver(updateClampState);
    resizeObserver.observe(textElement);

    return () => resizeObserver.disconnect();
  }, [children, onClampChange, shouldMeasure]);

  return (
    <>
      <p
        ref={textRef}
        className={cn(clampClassName, "whitespace-pre-wrap", className)}
      >
        {children}
      </p>
      {isClamped && indicator && (
        <span
          className={cn(
            "absolute right-0 bottom-0 text-xs font-medium text-primary underline-offset-2",
            indicatorClassName
          )}
        >
          {indicator}
        </span>
      )}
    </>
  );
};
