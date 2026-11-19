import { describe, expect, it } from "vitest";
import dateUtils from "./dateUtils";

describe("BC timestamp display", () => {
  it.each([
    ["2026-11-19T06:30:00", "2026-11-18 23:30"],
    ["2026-11-19T06:30:00Z", "2026-11-18 23:30"],
    ["2026-11-19T06:30:00+00:00", "2026-11-18 23:30"],
    ["2026-11-19T11:30:00+05:00", "2026-11-18 23:30"],
    ["2026-11-19T07:00:00Z", "2026-11-19 00:00"],
    ["2027-01-01T06:59:59Z", "2026-12-31 23:59"],
    ["2027-07-15T14:38:00Z", "2027-07-15 07:38"],
  ])("formats %s in BC time", (input, expected) => {
    expect(dateUtils.formatDate(input, "YYYY-MM-DD HH:mm")).toBe(expected);
  });

  it("preserves date-only values instead of treating them as midnight UTC", () => {
    expect(dateUtils.formatDate("2026-11-19")).toBe("2026-11-19");
    expect(dateUtils.formatDate("2026-11-19", "DD-MMM-YYYY")).toBe("19-Nov-2026");
    expect(dateUtils.formatDate("2024-02-29")).toBe("2024-02-29");
  });

  it("keeps missing and invalid date behavior", () => {
    expect(dateUtils.formatDate()).toBe("");
    expect(dateUtils.formatDate("")).toBe("");
    expect(dateUtils.formatDate("invalid")).toBe("Invalid Date");
  });

  it("supports numeric timestamps without changing the instant", () => {
    const instant = Date.parse("2026-11-19T06:30:00Z");
    expect(dateUtils.formatDate(instant)).toBe("2026-11-18");
  });
});
