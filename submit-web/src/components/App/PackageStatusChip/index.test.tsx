import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PackageStatusChip from "./index";

describe("PackageStatusChip", () => {
  it("renders the Uploaded by EAO label", () => {
    render(<PackageStatusChip status="UPLOADED_BY_EAO" />);
    expect(screen.getByText("Uploaded by EAO")).toBeTruthy();
  });

  it("renders a custom label when provided", () => {
    render(<PackageStatusChip status="UPLOADED_BY_EAO" label="Custom" />);
    expect(screen.getByText("Custom")).toBeTruthy();
  });
});
