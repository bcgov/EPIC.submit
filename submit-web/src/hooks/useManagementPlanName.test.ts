import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useManagementPlanName } from "./useManagementPlanName";
import { SubmissionPackage } from "@/models/Package";

const build = (
  typeName: string,
  conditionNumber?: number | string,
  title = "Additional Info",
) =>
  ({
    name: "My Plan",
    type: { name: typeName, title },
    meta: conditionNumber
      ? { main_condition: { condition_number: conditionNumber } }
      : undefined,
  }) as unknown as SubmissionPackage;

const run = (pkg: SubmissionPackage | null | undefined) =>
  renderHook(() => useManagementPlanName(pkg)).result.current;

describe("useManagementPlanName", () => {
  it("returns an empty string for null", () => {
    expect(run(null)).toBe("");
  });

  it("returns an empty string for undefined", () => {
    expect(run(undefined)).toBe("");
  });

  it("prepends the condition number for IEM packages", () => {
    expect(run(build("IEM", 12))).toBe("12 - My Plan");
  });

  it("returns only the name for Management Plan packages", () => {
    expect(run(build("Management Plan", 12))).toBe("My Plan");
  });

  it("returns only the name for IEM packages without a condition number", () => {
    expect(run(build("IEM"))).toBe("My Plan");
  });

  it("prefixes the type title for Additional Information packages", () => {
    expect(run(build("Additional Information", undefined, "Add Info"))).toBe(
      "Add Info - My Plan",
    );
  });

  it("returns only the name for other package types", () => {
    expect(run(build("Report", 3))).toBe("My Plan");
  });
});
