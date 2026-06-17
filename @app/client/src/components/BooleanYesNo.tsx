import { CircleCheckBig, CircleOff } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils.ts";

interface BooleanYesNoProps {
  className?: string;
  value?: boolean | null;
}

export const BooleanYesNo: FC<BooleanYesNoProps> = ({ className, value }) => {
  const { t } = useTranslation(["common"]);
  const isYes = value === true;
  const classNames = cn(className, "inline-flex flex-row items-center gap-1.5");
  return isYes ? (
    <span className={classNames}>
      <CircleCheckBig className="text-success size-4" />
      {t("common:yes")}
    </span>
  ) : (
    <span className={classNames}>
      <CircleOff className="text-destructive size-4" />
      {t("common:no")}
    </span>
  );
};
