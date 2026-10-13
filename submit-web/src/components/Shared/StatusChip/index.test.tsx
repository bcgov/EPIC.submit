import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StatusChip, StatusChipTheme } from "./index";

/**
 * Locks in the decided chip palette so color reliably signals who acts next.
 * MUI applies theme colors via emotion-generated classes, so we assert against
 * the injected stylesheet text rather than inline styles.
 */
const injectedCss = () =>
  Array.from(document.querySelectorAll("style"))
    .map((el) => el.textContent ?? "")
    .join("\n")
    .toUpperCase();

const renderThemeCss = (theme: StatusChipTheme) => {
  render(<StatusChip label={`chip-${theme}`} theme={theme} />);
  return injectedCss();
};

describe("StatusChip palette tokens", () => {
  it("renders the purple theme with the decided border and fill", () => {
    const css = renderThemeCss("purple");
    expect(css).toContain("#D8B4FE");
    expect(css).toContain("#F3E8FF");
  });

  it("renders the decision theme as teal for the entity New badge", () => {
    const css = renderThemeCss("decision");
    expect(css).toContain("#2B8C89");
    expect(css).toContain("#E4F5F4");
  });

  it("keeps the orange theme for holder-action badges", () => {
    const css = renderThemeCss("orange");
    expect(css).toContain("#F18A15");
    expect(css).toContain("#FFDEB8");
  });

  it("renders the chip label", () => {
    const { getByText } = render(
      <StatusChip label="Pending Acknowledgement" theme="purple" />,
    );
    expect(getByText("Pending Acknowledgement")).toBeInTheDocument();
  });

  it("renders nothing when neither theme nor custom colors are provided", () => {
    const { container } = render(<StatusChip label="No Theme" />);
    expect(container).toBeEmptyDOMElement();
  });
});
