import { format, subDays, subMonths, subQuarters, subYears } from "date-fns";
import { TimePeriodType } from "./shared-types";

export function getDateForTimePeriod(timePeriod: TimePeriodType): string {
  const today = new Date();
  let resultDate: Date;

  switch (timePeriod) {
    case "day":
      resultDate = today;
      break;
    case "week":
      resultDate = subDays(today, 7);
      break;
    case "month":
      resultDate = subMonths(today, 1);
      break;
    case "quarter":
      resultDate = subQuarters(today, 1);
      break;
    case "year":
      resultDate = subYears(today, 1);
      break;
    default:
      throw new Error("Invalid time period");
  }

  return format(resultDate, "yyyy-MM-dd");
}

export function timestampToDate(timestamp: number | string | undefined): string {
  if (!timestamp) {
    return "";
  }
  const date = new Date(timestamp);
  return format(date, "yyyy-MM-dd");
}
