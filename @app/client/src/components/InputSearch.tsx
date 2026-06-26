import { Search } from "lucide-react";
import { type FC } from "react";

import { Input, type InputProps } from "@/components/ui/Input.tsx";
import { cn } from "@/lib/utils";

export interface InputSearchProps extends InputProps {
  containerClassName?: string;
  iconClassName?: string;
}

export const InputSearch: FC<InputSearchProps> = ({
  containerClassName,
  iconClassName,
  className,
  ...props
}) => {
  return (
    <div className={cn("relative", containerClassName)}>
      <Search
        className={cn(
          "pointer-events-none absolute left-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground",
          iconClassName
        )}
      />
      <Input
        {...props}
        type="search"
        className={cn("w-full pl-8", className)}
      />
    </div>
  );
};
