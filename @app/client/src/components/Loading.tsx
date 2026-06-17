import { LoaderCircle } from "lucide-react";
import type { FC } from "react";

interface LoadingProps {}

export const Loading: FC<LoadingProps> = () => {
  return (
    <div className="inline-block animate-spin">
      <LoaderCircle />
    </div>
  );
};
