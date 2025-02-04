import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";

type UnitOfTime = "second" | "minute" | "hour" | "day" | "month" | "year";

export const DATE_FORMAT = "YYYY-MM-DD";
export const DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm";

dayjs.extend(utc);
/**
 * @param date Input date string
 * @param format Valid date format
 * @returns Formatted date string
 */
const formatDate = (date?: string | number, format?: string) => {
  if (!date) return ""; // Handle null or undefined values

  // server date is in UTC, convert to local timezone
  return dayjs
    .utc(String(date))
    .local()
    .format(format ?? DATE_FORMAT);
};

const diff = (fromDate: string, toDate: string, unitOfTime: UnitOfTime) => {
  return dayjs(fromDate).diff(dayjs(toDate), unitOfTime);
};

const add = (date: Date, unit: number, unitOfTime: UnitOfTime) => {
  return dayjs(date).add(unit, unitOfTime);
};

const dateToISO = (date: Date | Dayjs) => {
  return dayjs(date).toISOString();
};

export default {
  formatDate,
  diff,
  add,
  dateToISO,
};
