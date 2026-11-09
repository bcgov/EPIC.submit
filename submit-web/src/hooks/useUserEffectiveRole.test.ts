import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUserEffectiveRole } from "./useUserEffectiveRole";
import { Role } from "@/models/AccountUser";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";

const role = (
  role_name: USER_MANAGEMENT_ROLE | "",
  account_project_id: number | null,
  original_package_ids: number[] = [],
) =>
  ({ role_name, account_project_id, original_package_ids }) as unknown as Role;

const run = (roles: Role[] | undefined, total?: number) =>
  renderHook(() => useUserEffectiveRole(roles, total)).result.current;

describe("useUserEffectiveRole", () => {
  it("returns an empty role for undefined roles", () => {
    expect(run(undefined)).toEqual({
      role_name: "",
      original_package_ids: [],
      project_ids: [],
    });
  });

  it("returns an empty role for an empty array", () => {
    expect(run([]).role_name).toBe("");
  });

  it("gives account admin the highest priority", () => {
    const result = run([
      role(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, 1),
      role(USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN, null, [4]),
    ]);
    expect(result.role_name).toBe(USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN);
    expect(result.project_ids).toEqual([1]);
    expect(result.original_package_ids).toEqual([4]);
  });

  it("returns project admin when assigned to all projects", () => {
    const result = run(
      [
        role(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, 1),
        role(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, 2),
      ],
      2,
    );
    expect(result.role_name).toBe(USER_MANAGEMENT_ROLE.PROJECT_ADMIN);
    expect(result.project_ids).toEqual([1, 2]);
  });

  it("returns specific project admin when assigned to some projects", () => {
    const result = run([role(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, 1)], 3);
    expect(result.role_name).toBe(USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN);
  });

  it("returns project admin when total is unknown and all roles are project admin", () => {
    const result = run([role(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, 1)]);
    expect(result.role_name).toBe(USER_MANAGEMENT_ROLE.PROJECT_ADMIN);
  });

  it("returns specific project admin when total is unknown and other roles are mixed in", () => {
    const result = run([
      role(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, 1),
      role(USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN, 2),
    ]);
    expect(result.role_name).toBe(USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN);
  });

  it("treats a total of zero as unknown", () => {
    const result = run([role(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, 1)], 0);
    expect(result.role_name).toBe(USER_MANAGEMENT_ROLE.PROJECT_ADMIN);
  });

  it("deduplicates project ids", () => {
    const result = run(
      [
        role(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, 1),
        role(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, 1),
      ],
      1,
    );
    expect(result.project_ids).toEqual([1]);
  });

  it("returns submission admin", () => {
    const result = run([role(USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN, 1)]);
    expect(result.role_name).toBe(USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN);
  });

  it("returns specific submission contributor", () => {
    const result = run([
      role(USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR, 1, [7, 8]),
    ]);
    expect(result.role_name).toBe(
      USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR,
    );
    expect(result.original_package_ids).toEqual([7, 8]);
  });

  it("falls back to the first role name for unrecognised roles", () => {
    const result = run([
      role(USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN, 1),
    ]);
    expect(result.role_name).toBe(USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN);
  });

  it("falls back to an empty string when the first role has no name", () => {
    expect(run([role("", 1)]).role_name).toBe("");
  });

  it("excludes null project ids", () => {
    const result = run([
      role(USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN, null),
      role(USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN, 3),
    ]);
    expect(result.project_ids).toEqual([3]);
  });
});
