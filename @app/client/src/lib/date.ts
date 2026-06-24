import { addMonths, differenceInDays, differenceInMonths } from "date-fns";
import type { TFunction } from "i18next";

interface MonthsAndDays {
  months: number;
  days: number;
}

export function getDifferenceBetweenDatesInMonthsAndDays(
  startDate: Date,
  endDate: Date
): MonthsAndDays {
  const months = differenceInMonths(endDate, startDate);
  const dateWithMonthsAdded = addMonths(startDate, months);
  const days = differenceInDays(endDate, dateWithMonthsAdded);

  return { months, days };
}

export function getDurationInMonthsAndDaysLabel(
  t: TFunction<"common">,
  months: number,
  days: number
): string {
  const monthsLabel = months
    ? `${months} ${t("months", { count: months })}`
    : null;
  const daysLabel = days
    ? `${days} ${t("days", { count: days })}`
    : null;
  return (
    [monthsLabel, daysLabel].filter(Boolean).join(" ") ||
    t("days", { count: 0 })
  );
}
