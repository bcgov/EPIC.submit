import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import {
  ACCESS_REVOKED_ERROR_CODE,
  HTTP_STATUS,
  NEED_ACCESS_PATH,
} from "@/utils/constants";

// Isolate the module under test from the env/OIDC config chain.
vi.mock("@/utils/config", () => ({
  AppConfig: { apiUrl: "", documentUrl: "", conditionsLibraryUrl: "" },
  OidcConfig: { authority: "auth", client_id: "client" },
}));

vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: { error: vi.fn(), success: vi.fn() },
}));

// Spy on the account store's reset action.
const mockReset = vi.fn();
vi.mock("@/store/accountStore", () => ({
  useAccount: {
    getState: () => ({ reset: mockReset }),
  },
}));

import { isAccessRevokedError, handleAccessRevoked } from "./axiosUtils";

const makeError = (status: number, data: unknown): AxiosError =>
  new AxiosError(
    "error",
    "ERR",
    undefined,
    {},
    {
      status,
      data,
      statusText: "",
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    },
  );

describe("isAccessRevokedError", () => {
  it("returns true for a 403 carrying the ACCESS_REVOKED error_code", () => {
    const error = makeError(HTTP_STATUS.FORBIDDEN, {
      error_code: ACCESS_REVOKED_ERROR_CODE,
    });
    expect(isAccessRevokedError(error)).toBe(true);
  });

  it("returns false for a plain 403 without the error_code", () => {
    const error = makeError(HTTP_STATUS.FORBIDDEN, {
      message: "Insufficient permissions",
    });
    expect(isAccessRevokedError(error)).toBe(false);
  });

  it("returns false for non-403 statuses even with the error_code", () => {
    const error = makeError(HTTP_STATUS.NOT_FOUND, {
      error_code: ACCESS_REVOKED_ERROR_CODE,
    });
    expect(isAccessRevokedError(error)).toBe(false);
  });
});

describe("handleAccessRevoked", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    mockReset.mockClear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { pathname: "/proponent/projects", assign: vi.fn() },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("resets the account store and redirects to need-access", () => {
    handleAccessRevoked();

    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(window.location.assign).toHaveBeenCalledWith(NEED_ACCESS_PATH);
  });

  it("does not redirect again when already on the need-access page", () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { pathname: NEED_ACCESS_PATH, assign: vi.fn() },
    });

    handleAccessRevoked();

    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
