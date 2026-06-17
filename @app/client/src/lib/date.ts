import { addMonths, differenceInDays, differenceInMonths } from "date-fns";
import type { TFunction } from "i18next";

export function getDifferenceBetweenDatesInMonthsAndDays(
  startDate: Date,
  endDate: Date
) {
  const months = differenceInMonths(endDate, startDate);
  const dateWithMonthsAdded = addMonths(startDate, months);
  const days = differenceInDays(endDate, dateWithMonthsAdded);

  return { months, days };
}

export function getDurationInMonthsAndDaysLabel(
  t: TFunction<any>,
  months: number,
  days: number
) {
  const monthsLabel = months
    ? `${months} ${t("common:months", { count: months })}`
    : null;
  const daysLabel = days
    ? `${days} ${t("common:days", { count: days })}`
    : null;
  return (
    [monthsLabel, daysLabel].filter(Boolean).join(" ") ||
    t("common:days", { count: 0 })
  );
}
