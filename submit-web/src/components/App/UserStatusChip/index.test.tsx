import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import UserStatusChip from "./index";

describe("UserStatusChip", () => {
  it("renders the label provided by the API", () => {
    render(<UserStatusChip status="INACTIVE" label="Inactive User" />);

    expect(screen.getByText("Inactive User")).toBeInTheDocument();
  });

  it("falls back to the built-in label when none is provided", () => {
    render(<UserStatusChip status="PENDING" />);

    expect(screen.getByText("Invited")).toBeInTheDocument();
  });

  it("falls back to the built-in label when the label is null", () => {
    render(<UserStatusChip status="ACTIVE" label={null} />);

    expect(screen.getByText("Active User")).toBeInTheDocument();
  });
});
