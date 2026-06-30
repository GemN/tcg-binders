import { Check, Clipboard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, type ButtonProps } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

interface CopyToClipboardButtonProps
  extends Omit<ButtonProps, "asChild" | "children" | "onClick"> {
  copiedLabel?: string;
  label?: string;
  value: string;
}

const copyWithFallback = (value: string): boolean => {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";

  try {
    document.body.appendChild(textArea);
    textArea.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textArea.remove();
  }
};

export const CopyToClipboardButton = ({
  copiedLabel,
  disabled,
  label,
  value,
  variant = "outline",
  size = "icon",
  ...props
}: CopyToClipboardButtonProps) => {
  const { t } = useTranslation(["common"]);
  const [hasCopied, setHasCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const copyLabel = label || t("common:copy");
  const copiedText = copiedLabel || t("common:copied");

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!value) return;

    let didCopy = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        didCopy = true;
      } else {
        didCopy = copyWithFallback(value);
      }
    } catch {
      didCopy = copyWithFallback(value);
    }

    if (!didCopy) return;

    setHasCopied(true);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => setHasCopied(false), 1600);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          {...props}
          type="button"
          variant={variant}
          size={size}
          aria-label={hasCopied ? copiedText : copyLabel}
          disabled={disabled || !value}
          onClick={() => void handleCopy()}
        >
          {hasCopied ? (
            <Check className="size-4" />
          ) : (
            <Clipboard className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{hasCopied ? copiedText : copyLabel}</TooltipContent>
    </Tooltip>
  );
};
