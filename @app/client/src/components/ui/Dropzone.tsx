import { UploadCloud } from "lucide-react";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface DropzoneProps {
  accept?: string;
  description?: string;
  disabled?: boolean;
  label: string;
  onFileSelect: (file: File) => void;
}

export const Dropzone = ({
  accept,
  description,
  disabled,
  label,
  onFileSelect,
}: DropzoneProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    onFileSelect(file);
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    onFileSelect(file);
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={handlePickFile}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-60 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm transition-colors outline-none hover:border-primary hover:bg-primary/5 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
          isDragging && "border-primary bg-primary/5"
        )}
      >
        <UploadCloud className="size-9 text-muted-foreground" />
        <span className="max-w-full break-all font-medium text-foreground">
          {label}
        </span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileInputChange}
      />
    </>
  );
};
