import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { BCDesignTokens } from "epic.theme";
import { SubmissionPackage } from "@/models/Package";
import { renderWithTheme, resolvedColor } from "@/test/themeUtils";
import ProponentTableRow from "./ProponentTableRow";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

const subPackage = {
  id: 1,
  name: "Construction Environmental Management Plan",
  status: ["SUBMITTED"],
  type: { id: 1, name: "Management Plan" },
  account_project_id: 42,
  meta: { main_condition: { condition_number: 9 } },
  submitted_on: "2026-11-03",
  submitted_by: "Jane Doe",
} as unknown as SubmissionPackage;

describe("ProponentTableRow", () => {
  it("renders the package name in link blue under the app theme", () => {
    renderWithTheme(
      <table>
        <tbody>
          <ProponentTableRow subPackage={subPackage} />
        </tbody>
      </table>,
    );
    // Without the fix, theme body1 forces near-black (typographyColorSecondary).
    expect(
      resolvedColor(screen.getByText("Construction Environmental Management Plan")),
    ).toBe(BCDesignTokens.themeBlue90);
  });
});
