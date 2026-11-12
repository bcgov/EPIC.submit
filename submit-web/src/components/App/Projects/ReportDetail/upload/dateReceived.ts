import * as yup from "yup";
import dayjs, { Dayjs } from "dayjs";
import { DATE_FORMAT } from "@/utils/dateUtils";
import {
  DATE_RECEIVED_FUTURE_ERROR,
  DATE_RECEIVED_REQUIRED_ERROR,
} from "../reportUpload";

export type DateReceivedForm = {
  receivedDate: Dayjs | null;
};

const toDate = (_value: unknown, original: unknown) => {
  if (dayjs.isDayjs(original)) {
    return original.isValid() ? original.toDate() : undefined;
  }
  return original === null || original === "" ? undefined : original;
};

/**
 * Date Received must be a real date that is not after today. An empty or
 * half-typed date counts as missing.
 */
export const dateReceivedSchema = yup.object({
  receivedDate: yup
    .date()
    .transform(toDate)
    .typeError(DATE_RECEIVED_REQUIRED_ERROR)
    .required(DATE_RECEIVED_REQUIRED_ERROR)
    .test("not-in-future", DATE_RECEIVED_FUTURE_ERROR, (value) =>
      value ? !dayjs(value).isAfter(dayjs(), "day") : true,
    ),
});

/**
 * Returns the validation message for a Date Received value, or null when it is
 * valid.
 */
export const getDateReceivedError = (
  value: Dayjs | null | undefined,
): string | null => {
  try {
    dateReceivedSchema.validateSync({ receivedDate: value ?? null });
    return null;
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return error.message;
    }
    throw error;
  }
};

/** Formats a valid Date Received as the YYYY-MM-DD string the API expects. */
export const formatDateReceived = (value: Dayjs): string =>
  dayjs(value).format(DATE_FORMAT);
