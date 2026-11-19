import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";

type UnitOfTime = "second" | "minute" | "hour" | "day" | "month" | "year";

export const DATE_FORMAT = "YYYY-MM-DD";
export const DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm";
const BC_OFFSET_MINUTES = -7 * 60;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

dayjs.extend(utc);
/**
 * @param date Input date string
 * @param format Valid date format
 * @returns Formatted date string
 */
const formatDate = (date?: string | number, format?: string) => {
  if (!date) return ""; // Handle null or undefined values

  // API timestamps are UTC. Calendar dates (e.g. Date Received) must not shift.
  const parsed = dayjs.utc(date);
  const displayDate = DATE_ONLY.test(String(date))
    ? parsed
    : parsed.utcOffset(BC_OFFSET_MINUTES);
  return displayDate.format(format ?? DATE_FORMAT);
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
