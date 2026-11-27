import { describe, expect, it } from "vitest";
import { buildWorkPhaseOptions } from "./workPhaseOptions";
import { AccountProjectWork } from "@/models/Project";
import { NonWorkPackageMap } from "@/models/NonWorkPackageMap";

const work = (
  id: number,
  title: string,
  phase: { name: string; display_name?: string },
): AccountProjectWork => ({
  id: id + 1000,
  work_id: id,
  work: {
    id,
    project_id: 1,
    title,
    current_phase: { id: 1, work_type_id: 1, legislated: false, ...phase },
  },
});

const managementPlan: NonWorkPackageMap = {
  id: 1,
  code: "MANAGEMENT_PLAN",
  work_label: "Management Plan & Related Documents",
  phase_label: "Post Decision",
  sort_order: 1,
};

const report: NonWorkPackageMap = {
  id: 2,
  code: "REPORT",
  work_label: "Reports & Recurring Submissions",
  phase_label: "Post Decision",
  sort_order: 2,
};

describe("buildWorkPhaseOptions", () => {
  it("keys works by id and labels them with the phase display name", () => {
    const options = buildWorkPhaseOptions([
      work(7, "EA Work", { name: "Effects", display_name: "Effects Assessment" }),
    ]);

    expect(options).toEqual([
      { value: "work:7", label: "EA Work - Effects Assessment" },
    ]);
  });

  it("falls back to the phase name when there is no display name", () => {
    const options = buildWorkPhaseOptions([
      work(7, "EA Work", { name: "Effects" }),
    ]);

    expect(options[0].label).toBe("EA Work - Effects");
  });

  it("adds one option per eligible non-work item type, after the works", () => {
    const options = buildWorkPhaseOptions(
      [work(7, "EA Work", { name: "Effects" })],
      [managementPlan, report],
    );

    expect(options.map((o) => o.value)).toEqual([
      "work:7",
      "non_work:MANAGEMENT_PLAN",
      "non_work:REPORT",
    ]);
    expect(options[2].label).toBe("Reports & Recurring Submissions - Post Decision");
    expect(options[1].label).toBe(
      "Management Plan & Related Documents - Post Decision",
    );
  });

  it("dedupes works and handles missing inputs", () => {
    const duplicated = work(7, "EA Work", { name: "Effects" });

    expect(buildWorkPhaseOptions([duplicated, duplicated])).toHaveLength(1);
    expect(buildWorkPhaseOptions(undefined, undefined)).toEqual([]);
  });

  it("keeps work titles containing ' - ' intact as labels", () => {
    const options = buildWorkPhaseOptions([
      work(9, "Title - with dash", { name: "Effects" }),
    ]);

    expect(options[0]).toEqual({
      value: "work:9",
      label: "Title - with dash - Effects",
    });
  });
});
