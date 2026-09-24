import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockConfig = vi.hoisted(() => ({
  userGuide: "/docs/Holder-User-Guide-EPIC.submit-v1.1.pdf",
  userGuideVersion: "",
}));

vi.mock("@/utils/config", () => ({
  AppConfig: mockConfig,
}));

import { UserGuideButton } from "./index";

describe("UserGuideButton", () => {
  beforeEach(() => {
    mockConfig.userGuide = "/docs/Holder-User-Guide-EPIC.submit-v1.1.pdf";
    mockConfig.userGuideVersion = "";
  });

  it("prefers the configured version over the URL-parsed one", () => {
    mockConfig.userGuideVersion = "2.0";
    render(<UserGuideButton />);
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Download the EPIC.submit User Guide v2.0");
    // URL is unchanged even though the visible version is bumped.
    expect(link).toHaveAttribute(
      "href",
      "/docs/Holder-User-Guide-EPIC.submit-v1.1.pdf",
    );
  });

  it("falls back to the version parsed from the URL when none is configured", () => {
    render(<UserGuideButton />);
    expect(screen.getByRole("link")).toHaveTextContent(
      "Download the EPIC.submit User Guide v1.1",
    );
  });
});
