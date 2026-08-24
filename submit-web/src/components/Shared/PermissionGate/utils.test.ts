import { describe, it, expect } from "vitest";

import {
  checkIfManager,
  checkIfStaff,
  checkIfMPT,
  checkIfGISUser,
  hasPermission,
} from "./utils";

describe("PermissionGate utils", () => {
  describe("checkIfMPT", () => {
    it("returns true when user has mp_view role", () => {
      expect(checkIfMPT(["mp_view"])).toBe(true);
    });

    it("returns true when user has full_access role", () => {
      expect(checkIfMPT(["full_access"])).toBe(true);
    });

    it("returns false when user has no MPT roles", () => {
      expect(checkIfMPT(["eao_view", "eao_edit"])).toBe(false);
    });

    it("returns false when roles is undefined", () => {
      expect(checkIfMPT(undefined)).toBe(false);
    });

    it("returns false when roles is empty", () => {
      expect(checkIfMPT([])).toBe(false);
    });
  });

  describe("checkIfManager", () => {
    it("returns true when user has mp_extended_edit role", () => {
      expect(checkIfManager(["mp_extended_edit"])).toBe(true);
    });

    it("returns true when user has full_access role", () => {
      expect(checkIfManager(["full_access"])).toBe(true);
    });

    it("returns false when user lacks manager roles", () => {
      expect(checkIfManager(["eao_view"])).toBe(false);
    });

    it("returns false when roles is undefined", () => {
      expect(checkIfManager(undefined)).toBe(false);
    });
  });

  describe("checkIfStaff", () => {
    it("returns true when user has eao_view but not manager role", () => {
      expect(checkIfStaff(["eao_view"])).toBe(true);
    });

    it("returns false when user is a manager", () => {
      expect(checkIfStaff(["eao_view", "mp_extended_edit"])).toBe(false);
    });

    it("returns false when roles is undefined", () => {
      expect(checkIfStaff(undefined)).toBe(false);
    });
  });

  describe("checkIfGISUser", () => {
    it("returns true when user has gis_extended_edit role", () => {
      expect(checkIfGISUser(["gis_extended_edit"])).toBe(true);
    });

    it("returns false when user lacks GIS role", () => {
      expect(checkIfGISUser(["eao_view"])).toBe(false);
    });

    it("returns false when roles is undefined", () => {
      expect(checkIfGISUser(undefined)).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("returns true when permissions include a matching scope", () => {
      expect(
        hasPermission({
          permissions: ["eao_view", "mp_view"],
          scopes: ["mp_view"],
        }),
      ).toBe(true);
    });

    it("returns true when user has full_access regardless of scopes", () => {
      expect(
        hasPermission({
          permissions: ["full_access"],
          scopes: ["mp_extended_edit"],
        }),
      ).toBe(true);
    });

    it("returns false when no permissions match scopes", () => {
      expect(
        hasPermission({
          permissions: ["eao_view"],
          scopes: ["mp_extended_edit"],
        }),
      ).toBe(false);
    });
  });
});
