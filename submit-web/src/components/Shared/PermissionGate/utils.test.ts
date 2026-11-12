import { describe, it, expect } from "vitest";
import { canAddEaoReportDocument } from "./utils";

describe("canAddEaoReportDocument", () => {
  it.each([
    ["MPT Staff", ["eao_view", "mp_edit"]],
    ["MPT Manager", ["eao_view", "mp_extended_edit"]],
    ["full access", ["full_access"]],
  ])("allows %s", (_label, roles) => {
    expect(canAddEaoReportDocument(roles)).toBe(true);
  });

  it.each([
    ["view-only EAO staff", ["eao_view"]],
    ["EAO editors without an MPT role", ["eao_view", "eao_edit", "eao_create"]],
    ["MPT viewers and creators", ["mp_view", "mp_create"]],
    ["no roles", []],
  ])("denies %s", (_label, roles) => {
    expect(canAddEaoReportDocument(roles)).toBe(false);
  });

  it("denies when roles are not loaded", () => {
    expect(canAddEaoReportDocument(undefined)).toBe(false);
  });
});
