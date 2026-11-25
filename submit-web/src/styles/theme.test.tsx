import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { Alert } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { renderWithTheme } from "@/test/themeUtils";

describe("theme MuiAlert override", () => {
  it.each(["standard", "outlined"] as const)(
    "test_%s_warning_alert_uses_primary_text_color",
    (variant) => {
      renderWithTheme(
        <Alert severity="warning" variant={variant}>
          Warning
        </Alert>,
      );
      expect(screen.getByRole("alert")).toHaveStyle({
        color: BCDesignTokens.typographyColorPrimary,
      });
    },
  );

  it("test_info_alert_keeps_its_own_text_color", () => {
    renderWithTheme(<Alert severity="info">Info</Alert>);
    expect(screen.getByRole("alert")).not.toHaveStyle({
      color: BCDesignTokens.typographyColorPrimary,
    });
  });
});
