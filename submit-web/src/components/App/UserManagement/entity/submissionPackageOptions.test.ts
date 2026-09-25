import { describe, it, expect } from "vitest";
import {
  AccountPackageGroup,
  buildSubmissionPackageOptions,
} from "./submissionPackageOptions";
import { AccountProject } from "@/models/Project";

const makeProject = (
  id: number,
  projectId: number,
  name: string,
): AccountProject => ({
  id,
  project_id: projectId,
  account_id: 1,
  project: { id: projectId, name, proponent_id: 1, epic_guid: `g${projectId}` },
  packages: [],
});

describe("buildSubmissionPackageOptions", () => {
  it("formats a package as 'Project: Submission Name'", () => {
    const packages: AccountPackageGroup[] = [
      {
        project_id: 101,
        packages: [{ id: 1, name: "Wildlife Management Plan", original_package_id: 11 }],
      },
    ];
    const projects = [makeProject(1, 101, "Site C Clean Energy")];

    const options = buildSubmissionPackageOptions(packages, projects);

    expect(options).toEqual([
      { value: "11", label: "Site C Clean Energy: Wildlife Management Plan" },
    ]);
  });

  it("disambiguates identically named submissions across projects", () => {
    const packages: AccountPackageGroup[] = [
      {
        project_id: 101,
        packages: [{ id: 1, name: "Wildlife Plan", original_package_id: 11 }],
      },
      {
        project_id: 102,
        packages: [{ id: 2, name: "Wildlife Plan", original_package_id: 22 }],
      },
    ];
    const projects = [
      makeProject(1, 101, "Project Alpha"),
      makeProject(2, 102, "Project Beta"),
    ];

    const options = buildSubmissionPackageOptions(packages, projects);

    expect(options).toContainEqual({
      value: "11",
      label: "Project Alpha: Wildlife Plan",
    });
    expect(options).toContainEqual({
      value: "22",
      label: "Project Beta: Wildlife Plan",
    });
    // Distinct, independently selectable values.
    expect(options.map((o) => o.value)).toEqual(["11", "22"]);
  });

  it("sorts by project name, then submission name", () => {
    const packages: AccountPackageGroup[] = [
      {
        project_id: 102,
        packages: [{ id: 3, name: "Zebra Plan", original_package_id: 33 }],
      },
      {
        project_id: 101,
        packages: [
          { id: 2, name: "Beta Plan", original_package_id: 22 },
          { id: 1, name: "Alpha Plan", original_package_id: 11 },
        ],
      },
    ];
    const projects = [
      makeProject(1, 101, "Alpha Project"),
      makeProject(2, 102, "Beta Project"),
    ];

    const options = buildSubmissionPackageOptions(packages, projects);

    expect(options.map((o) => o.label)).toEqual([
      "Alpha Project: Alpha Plan",
      "Alpha Project: Beta Plan",
      "Beta Project: Zebra Plan",
    ]);
  });

  it("falls back to the bare submission name when the project is unresolved", () => {
    const packages: AccountPackageGroup[] = [
      {
        project_id: 999,
        packages: [{ id: 1, name: "Orphan Plan", original_package_id: 11 }],
      },
    ];
    const projects = [makeProject(1, 101, "Some Project")];

    const options = buildSubmissionPackageOptions(packages, projects);

    expect(options).toEqual([{ value: "11", label: "Orphan Plan" }]);
  });

  it("matches project ids regardless of string/number type", () => {
    const packages: AccountPackageGroup[] = [
      {
        project_id: "101",
        packages: [{ id: 1, name: "Plan", original_package_id: 11 }],
      },
    ];
    // AccountProject.project_id is a number.
    const projects = [makeProject(1, 101, "Numeric Project")];

    const options = buildSubmissionPackageOptions(packages, projects);

    expect(options).toEqual([
      { value: "11", label: "Numeric Project: Plan" },
    ]);
  });

  it("returns an empty array when packages are missing or empty", () => {
    expect(buildSubmissionPackageOptions(undefined, [])).toEqual([]);
    expect(buildSubmissionPackageOptions([], undefined)).toEqual([]);
  });
});
