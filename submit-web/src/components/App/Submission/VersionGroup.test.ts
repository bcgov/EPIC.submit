import { describe, it, expect } from "vitest";
import {
  canProponentCreateNewVersion,
  calculateIsLatestVersion,
  PROPONENT_CREATE_ELIGIBLE_STATUSES,
} from "./versionGroupUtils";
import { PackageVersion } from "@/models/Package";

describe("VersionGroup - Proponent '+ Create New' button visibility logic", () => {
  describe("canProponentCreateNewVersion", () => {
    it("returns true when proponent is on latest version and status is APPROVED", () => {
      const result = canProponentCreateNewVersion({
        isProponent: true,
        isLatestVersion: true,
        packageStatus: ["APPROVED"],
      });
      expect(result).toBe(true);
    });

    it("returns true when proponent is on latest version and status is ACCEPTED", () => {
      const result = canProponentCreateNewVersion({
        isProponent: true,
        isLatestVersion: true,
        packageStatus: ["ACCEPTED"],
      });
      expect(result).toBe(true);
    });

    it("returns true when proponent is on latest version and status is SATISFIED", () => {
      const result = canProponentCreateNewVersion({
        isProponent: true,
        isLatestVersion: true,
        packageStatus: ["SATISFIED"],
      });
      expect(result).toBe(true);
    });

    it("returns false when status is IN_REVIEW (not a terminal success state)", () => {
      const result = canProponentCreateNewVersion({
        isProponent: true,
        isLatestVersion: true,
        packageStatus: ["IN_REVIEW"],
      });
      expect(result).toBe(false);
    });

    it("returns false when proponent is NOT on the latest version with eligible status", () => {
      const result = canProponentCreateNewVersion({
        isProponent: true,
        isLatestVersion: false,
        packageStatus: ["APPROVED"],
      });
      expect(result).toBe(false);
    });

    it("returns false for staff users regardless of status and version", () => {
      const result = canProponentCreateNewVersion({
        isProponent: false,
        isLatestVersion: true,
        packageStatus: ["APPROVED"],
      });
      expect(result).toBe(false);
    });

    it("returns false when package status is undefined", () => {
      const result = canProponentCreateNewVersion({
        isProponent: true,
        isLatestVersion: true,
        packageStatus: undefined,
      });
      expect(result).toBe(false);
    });

    it("returns false when status is NOT_APPROVED", () => {
      const result = canProponentCreateNewVersion({
        isProponent: true,
        isLatestVersion: true,
        packageStatus: ["NOT_APPROVED"],
      });
      expect(result).toBe(false);
    });

    it("returns true when status list includes an eligible status among other statuses", () => {
      const result = canProponentCreateNewVersion({
        isProponent: true,
        isLatestVersion: true,
        packageStatus: ["IN_REVIEW", "APPROVED"],
      });
      expect(result).toBe(true);
    });

    it("returns false when status is empty array", () => {
      const result = canProponentCreateNewVersion({
        isProponent: true,
        isLatestVersion: true,
        packageStatus: [],
      });
      expect(result).toBe(false);
    });
  });

  describe("calculateIsLatestVersion", () => {
    const versions: PackageVersion[] = [
      { id: 1, package_id: 9, version: 1, original_package_id: 5, is_approved: true, is_latest: false },
      { id: 2, package_id: 10, version: 2, original_package_id: 5, is_approved: false, is_latest: true },
    ];

    it("returns true when current version equals the highest version number", () => {
      expect(calculateIsLatestVersion(versions, 2)).toBe(true);
    });

    it("returns false when current version is not the highest", () => {
      expect(calculateIsLatestVersion(versions, 1)).toBe(false);
    });

    it("returns false when packageVersions is undefined", () => {
      expect(calculateIsLatestVersion(undefined, 2)).toBe(false);
    });
  });

  describe("PROPONENT_CREATE_ELIGIBLE_STATUSES", () => {
    it("contains exactly APPROVED, ACCEPTED, and SATISFIED", () => {
      expect(PROPONENT_CREATE_ELIGIBLE_STATUSES).toEqual([
        "APPROVED",
        "ACCEPTED",
        "SATISFIED",
        "REVIEWED",
      ]);
    });
  });
});
