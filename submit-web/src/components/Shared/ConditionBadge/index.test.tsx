import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConditionBadge } from "./index";
import { formatConditionLabel } from "./utils";

describe("formatConditionLabel", () => {
  it("joins number and subsection with a dot", () => {
    expect(formatConditionLabel(7, "2")).toBe("7.2");
  });

  it("returns the number alone when there is no subsection", () => {
    expect(formatConditionLabel(7)).toBe("7");
  });

  it("returns null when there is no condition number", () => {
    expect(formatConditionLabel(null)).toBeNull();
    expect(formatConditionLabel(undefined)).toBeNull();
    expect(formatConditionLabel("")).toBeNull();
  });
});

describe("ConditionBadge", () => {
  it("renders the number with subsection and never a '#'", () => {
    render(<ConditionBadge conditionNumber={7} conditionSubsection="2" />);
    const badge = screen.getByText("7.2");
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).not.toContain("#");
  });

  it("renders the number alone without a subsection", () => {
    render(<ConditionBadge conditionNumber={14} />);
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("renders nothing when there is no condition number", () => {
    const { container } = render(<ConditionBadge conditionNumber={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
