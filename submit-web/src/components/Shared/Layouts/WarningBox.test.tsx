import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BCDesignTokens } from "epic.theme";
import WarningBox from "./WarningBox";

describe("WarningBox", () => {
  it("test_warning_box_uses_primary_text_color", () => {
    render(<WarningBox data-testid="box">Not approved</WarningBox>);
    expect(screen.getByTestId("box")).toHaveStyle({
      color: BCDesignTokens.typographyColorPrimary,
    });
  });
});
