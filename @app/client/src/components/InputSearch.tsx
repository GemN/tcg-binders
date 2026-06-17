import { Search } from "lucide-react";
import { type FC } from "react";

import { Input, type InputProps } from "@/components/ui/Input.tsx";

export interface InputSearchProps extends InputProps {
  className?: string;
}

export const InputSearch: FC<InputSearchProps> = ({ className, ...props }) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input {...props} type="search" className="w-full pl-8" />
    </div>
  );
};
