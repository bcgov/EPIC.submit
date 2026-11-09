import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePackageRoles } from "./usePackageRoles";
import { PackageType, SubmissionPackage } from "@/models/Package";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";

const pkg = (typeName?: string, work?: object | null) =>
  ({
    type: typeName ? { name: typeName } : undefined,
    account_project_work: work,
  }) as unknown as SubmissionPackage;

describe("usePackageRoles", () => {
  it("returns GIS roles for geospatial documents", () => {
    const { result } = renderHook(() =>
      usePackageRoles(pkg("Management Plan"), undefined, S3_FOLDER.GEOSPATIAL.value),
    );
    expect(result.current).toEqual({
      view: "gis_extended_edit",
      edit: "gis_extended_edit",
      create: "gis_extended_edit",
      approve: "gis_extended_edit",
    });
  });

  it("returns work package roles when the package has a work", () => {
    const { result } = renderHook(() =>
      usePackageRoles(pkg("Management Plan", { id: 1 })),
    );
    expect(result.current).toEqual({
      view: "w_view",
      edit: "w_edit",
      create: "w_create",
      approve: "w_extended_edit",
    });
  });

  it("returns management plan roles for Management Plan packages", () => {
    const { result } = renderHook(() => usePackageRoles(pkg("Management Plan")));
    expect(result.current).toEqual({
      view: "mp_view",
      edit: "mp_edit",
      create: "mp_create",
      approve: "mp_extended_edit",
    });
  });

  it("returns management plan roles for IEM packages", () => {
    const { result } = renderHook(() => usePackageRoles(pkg("IEM")));
    expect(result.current.view).toBe("mp_view");
  });

  it("prefers an explicit packageType over the package type", () => {
    const { result } = renderHook(() =>
      usePackageRoles(pkg("Report"), { name: "IEM" } as PackageType),
    );
    expect(result.current.edit).toBe("mp_edit");
  });

  it("falls back to EAO roles for other package types", () => {
    const { result } = renderHook(() => usePackageRoles(pkg("Report")));
    expect(result.current).toEqual({
      view: "eao_view",
      edit: "eao_edit",
      create: "eao_create",
      approve: "eao_edit",
    });
  });

  it("falls back to EAO roles when no package is provided", () => {
    const { result } = renderHook(() => usePackageRoles());
    expect(result.current.view).toBe("eao_view");
  });
});
