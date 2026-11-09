import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUseMediaQuery = vi.fn();
const mockBreakpointDown = vi.fn();

vi.mock("@mui/material", () => ({
  useMediaQuery: (query: unknown) => mockUseMediaQuery(query),
  useTheme: () => ({ breakpoints: { down: mockBreakpointDown } }),
}));

import {
  useIsMobile,
  useMounted,
  useHasRole,
  useHasAnyRole,
  useHasAllRoles,
} from "./common";
import { useAccount } from "@/store/accountStore";

const setRoles = (roles: string[] | undefined) =>
  useAccount.setState({ roles });

describe("useIsMobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBreakpointDown.mockReturnValue("(max-width:600px)");
  });

  it("returns true when the media query matches", () => {
    mockUseMediaQuery.mockReturnValue(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false when the media query does not match", () => {
    mockUseMediaQuery.mockReturnValue(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("queries the sm breakpoint", () => {
    mockUseMediaQuery.mockReturnValue(false);
    renderHook(() => useIsMobile());
    expect(mockBreakpointDown).toHaveBeenCalledWith("sm");
    expect(mockUseMediaQuery).toHaveBeenCalledWith("(max-width:600px)");
  });
});

describe("useMounted", () => {
  it("calls the callback once on mount", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(() => useMounted(callback));
    rerender();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe("useHasRole", () => {
  it("returns false when roles are undefined", () => {
    setRoles(undefined);
    const { result } = renderHook(() => useHasRole("mp_view"));
    expect(result.current).toBe(false);
  });

  it("returns true when the user has the required role", () => {
    setRoles(["mp_view"]);
    const { result } = renderHook(() => useHasRole("mp_view"));
    expect(result.current).toBe(true);
  });

  it("returns true when the user has full_access", () => {
    setRoles(["full_access"]);
    const { result } = renderHook(() => useHasRole("mp_view"));
    expect(result.current).toBe(true);
  });

  it("returns false when the user lacks the role", () => {
    setRoles(["w_view"]);
    const { result } = renderHook(() => useHasRole("mp_view"));
    expect(result.current).toBe(false);
  });
});

describe("useHasAnyRole", () => {
  it("returns false when roles are undefined", () => {
    setRoles(undefined);
    const { result } = renderHook(() => useHasAnyRole(["mp_edit"]));
    expect(result.current).toBe(false);
  });

  it("returns true with full_access", () => {
    setRoles(["full_access"]);
    const { result } = renderHook(() => useHasAnyRole(["mp_edit"]));
    expect(result.current).toBe(true);
  });

  it("returns true when one of the roles matches", () => {
    setRoles(["w_edit"]);
    const { result } = renderHook(() => useHasAnyRole(["mp_edit", "w_edit"]));
    expect(result.current).toBe(true);
  });

  it("returns false when none of the roles match", () => {
    setRoles(["eao_view"]);
    const { result } = renderHook(() => useHasAnyRole(["mp_edit", "w_edit"]));
    expect(result.current).toBe(false);
  });
});

describe("useHasAllRoles", () => {
  it("returns false when roles are undefined", () => {
    setRoles(undefined);
    const { result } = renderHook(() => useHasAllRoles(["mp_view"]));
    expect(result.current).toBe(false);
  });

  it("returns true with full_access", () => {
    setRoles(["full_access"]);
    const { result } = renderHook(() =>
      useHasAllRoles(["mp_view", "mp_edit"]),
    );
    expect(result.current).toBe(true);
  });

  it("returns true when all roles are present", () => {
    setRoles(["mp_view", "mp_edit"]);
    const { result } = renderHook(() =>
      useHasAllRoles(["mp_view", "mp_edit"]),
    );
    expect(result.current).toBe(true);
  });

  it("returns false when only some roles are present", () => {
    setRoles(["mp_view"]);
    const { result } = renderHook(() =>
      useHasAllRoles(["mp_view", "mp_edit"]),
    );
    expect(result.current).toBe(false);
  });
});
