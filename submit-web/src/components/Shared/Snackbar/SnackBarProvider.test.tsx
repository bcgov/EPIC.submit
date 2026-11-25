import { describe, it, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { BCDesignTokens } from "epic.theme";
import SnackBarProvider from "./SnackBarProvider";
import { notify } from "./snackbarStore";

describe("SnackBarProvider", () => {
  it("test_warning_snackbar_uses_primary_text_color_and_gold_icon", () => {
    render(<SnackBarProvider />);
    act(() => notify.warning("Update request already exists"));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveStyle({ color: BCDesignTokens.typographyColorPrimary });
    expect(alert.querySelector(".MuiAlert-icon")).toHaveStyle({
      color: BCDesignTokens.supportBorderColorWarning,
    });
  });
});
