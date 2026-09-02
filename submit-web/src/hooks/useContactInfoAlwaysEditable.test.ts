import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useContactInfoAlwaysEditable } from "./useContactInfoAlwaysEditable";
import { SUBMISSION_ITEM_TYPE, SubmissionItem } from "@/models/SubmissionItem";
import { PackageVersion, SubmissionPackage } from "@/models/Package";

const mockUseGetPackageVersionsByOriginalPackageId = vi.fn();

vi.mock("@/hooks/api/usePackages", () => ({
  useGetPackageVersionsByOriginalPackageId: (args: unknown) =>
    mockUseGetPackageVersionsByOriginalPackageId(args),
}));

const versions: PackageVersion[] = [
  {
    id: 1,
    package_id: 10,
    version: 1,
    original_package_id: 5,
    is_approved: true,
    is_enforceable: false,
    is_latest: false,
  },
  {
    id: 2,
    package_id: 11,
    version: 2,
    original_package_id: 5,
    is_approved: false,
    is_enforceable: false,
    is_latest: true,
  },
];

const contactItem = {
  id: 1,
  type_id: 1,
  type: {
    id: 1,
    name: SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION,
    submission_method: "FORM_SUBMISSION",
  },
  status: "COMPLETED",
  submissions: [],
} as unknown as SubmissionItem;

const managementPlanItem = {
  ...contactItem,
  type: {
    id: 3,
    name: SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN,
    submission_method: "FORM_SUBMISSION",
  },
} as unknown as SubmissionItem;

const makePackage = (version: number): SubmissionPackage =>
  ({
    id: version === 2 ? 11 : 10,
    name: "Package",
    status: ["APPROVED"],
    type_id: 1,
    type: {
      id: 1,
      name: "Management Plan" as never,
      versioning_enabled: true,
      mandatory: false,
    },
    items: [],
    account_project_id: 1,
    update_requests: [],
    all_update_requests: [],
    version: {
      id: version === 2 ? 2 : 1,
      package_id: version === 2 ? 11 : 10,
      version,
      original_package_id: 5,
      is_approved: false,
      is_enforceable: false,
      is_latest: version === 2,
    },
  }) as unknown as SubmissionPackage;

describe("useContactInfoAlwaysEditable", () => {
  beforeEach(() => {
    mockUseGetPackageVersionsByOriginalPackageId.mockReturnValue({
      data: versions,
    });
  });

  it("returns true for contact information on the latest version", () => {
    const { result } = renderHook(() =>
      useContactInfoAlwaysEditable({
        item: contactItem,
        submissionPackage: makePackage(2),
      }),
    );
    expect(result.current).toBe(true);
  });

  it("returns false for contact information on an older version", () => {
    const { result } = renderHook(() =>
      useContactInfoAlwaysEditable({
        item: contactItem,
        submissionPackage: makePackage(1),
      }),
    );
    expect(result.current).toBe(false);
  });

  it("returns false for a non contact-information item", () => {
    const { result } = renderHook(() =>
      useContactInfoAlwaysEditable({
        item: managementPlanItem,
        submissionPackage: makePackage(2),
      }),
    );
    expect(result.current).toBe(false);
  });

  it("returns true for contact information when the package has no version info", () => {
    const pkg = makePackage(2);
    const pkgWithoutVersion = {
      ...pkg,
      version: undefined,
    } as unknown as SubmissionPackage;

    const { result } = renderHook(() =>
      useContactInfoAlwaysEditable({
        item: contactItem,
        submissionPackage: pkgWithoutVersion,
      }),
    );
    expect(result.current).toBe(true);
  });

  it("returns false when item is undefined", () => {
    const { result } = renderHook(() =>
      useContactInfoAlwaysEditable({
        item: undefined,
        submissionPackage: makePackage(2),
      }),
    );
    expect(result.current).toBe(false);
  });
});
