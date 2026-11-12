import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import {
  formatDateReceived,
  getDateReceivedError,
} from "./dateReceived";
import {
  DATE_RECEIVED_FUTURE_ERROR,
  DATE_RECEIVED_REQUIRED_ERROR,
} from "../reportUpload";

describe("getDateReceivedError", () => {
  it("requires a date", () => {
    expect(getDateReceivedError(null)).toBe(DATE_RECEIVED_REQUIRED_ERROR);
    expect(getDateReceivedError(undefined)).toBe(DATE_RECEIVED_REQUIRED_ERROR);
  });

  it("treats a half-typed (invalid) date as missing", () => {
    expect(getDateReceivedError(dayjs("not a date"))).toBe(
      DATE_RECEIVED_REQUIRED_ERROR,
    );
  });

  it("rejects a date in the future", () => {
    expect(getDateReceivedError(dayjs().add(1, "day"))).toBe(
      DATE_RECEIVED_FUTURE_ERROR,
    );
  });

  it("accepts today", () => {
    expect(getDateReceivedError(dayjs())).toBeNull();
  });

  it("accepts a past date", () => {
    expect(getDateReceivedError(dayjs().subtract(30, "day"))).toBeNull();
  });
});

describe("formatDateReceived", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(formatDateReceived(dayjs("2026-10-09T15:30:00"))).toBe("2026-10-09");
  });
});
