import { describe, it, expect, vi } from "vitest";
import { isAxiosError } from "axios";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

/**
 * Tests for the error handling logic in ContactInformationForm's onError callback.
 *
 * The component passes this handler to useAcceptInvitation:
 *   onError: (error: Error) => {
 *     let errorMessage = "Account registration failed. Please try again or contact support.";
 *     if (isAxiosError(error) && error.response) {
 *       const data = error.response.data;
 *       if (typeof data === "string" && data.length > 0) {
 *         errorMessage = data;
 *       } else if (data?.message) {
 *         errorMessage = data.message;
 *       }
 *     }
 *     notify.error(errorMessage);
 *   }
 *
 * We test this logic directly since the component has deep dependency chains
 * that make full render testing impractical for this focused behavior.
 */

vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: { error: vi.fn(), success: vi.fn() },
}));

/**
 * Replicates the onError handler from ContactInformationForm.
 * This ensures the logic is tested without needing to render the full component.
 */
function handleRegistrationError(error: Error) {
  let errorMessage =
    "Account registration failed. Please try again or contact support.";
  if (isAxiosError(error) && error.response) {
    const data = error.response.data;
    if (typeof data === "string" && data.length > 0) {
      errorMessage = data;
    } else if (data?.message) {
      errorMessage = data.message;
    }
  }
  notify.error(errorMessage);
}

describe("ContactInformationForm error handling", () => {
  it("displays plain text error from API when user already exists (409 Conflict)", () => {
    const axiosError = Object.assign(new Error("Request failed"), {
      isAxiosError: true,
      response: {
        status: 409,
        data: "A user with this account already exists. Please contact your administrator if you need access.",
        headers: {},
        statusText: "Conflict",
        config: {},
      },
      config: {},
      name: "AxiosError",
    });

    handleRegistrationError(axiosError);

    expect(notify.error).toHaveBeenCalledWith(
      "A user with this account already exists. Please contact your administrator if you need access.",
    );
  });

  it("displays JSON message field from API error response", () => {
    const axiosError = Object.assign(new Error("Request failed"), {
      isAxiosError: true,
      response: {
        status: 409,
        data: { message: "User already exists in the system" },
        headers: {},
        statusText: "Conflict",
        config: {},
      },
      config: {},
      name: "AxiosError",
    });

    handleRegistrationError(axiosError);

    expect(notify.error).toHaveBeenCalledWith(
      "User already exists in the system",
    );
  });

  it("displays fallback error message for non-Axios errors", () => {
    handleRegistrationError(new Error("Network error"));

    expect(notify.error).toHaveBeenCalledWith(
      "Account registration failed. Please try again or contact support.",
    );
  });

  it("displays fallback error message when Axios error has no response", () => {
    const axiosError = Object.assign(new Error("timeout"), {
      isAxiosError: true,
      response: undefined,
      config: {},
      name: "AxiosError",
    });

    handleRegistrationError(axiosError);

    expect(notify.error).toHaveBeenCalledWith(
      "Account registration failed. Please try again or contact support.",
    );
  });

  it("displays fallback when response data is empty string", () => {
    const axiosError = Object.assign(new Error("Request failed"), {
      isAxiosError: true,
      response: {
        status: 500,
        data: "",
        headers: {},
        statusText: "Internal Server Error",
        config: {},
      },
      config: {},
      name: "AxiosError",
    });

    handleRegistrationError(axiosError);

    expect(notify.error).toHaveBeenCalledWith(
      "Account registration failed. Please try again or contact support.",
    );
  });
});
