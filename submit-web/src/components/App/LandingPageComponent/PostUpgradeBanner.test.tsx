import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { PostUpgradeBanner } from "./PostUpgradeBanner";

const { USER_GUIDE_URL, SUPPORT_EMAIL } = vi.hoisted(() => ({
  USER_GUIDE_URL: "/docs/Holder-User-Guide-EPIC.submit-v1.1.pdf",
  SUPPORT_EMAIL: "EAO.EPICsystem@gov.bc.ca",
}));

vi.mock("@/utils/config", () => ({
  AppConfig: {
    userGuide: USER_GUIDE_URL,
    userGuideVersion: "2.0",
    epicSystemEmail: SUPPORT_EMAIL,
  },
}));

describe("PostUpgradeBanner", () => {
  it("renders the upgraded heading", () => {
    render(<PostUpgradeBanner />);
    expect(
      screen.getByText("EPIC.submit has been upgraded"),
    ).toBeInTheDocument();
  });

  it("renders the intro line", () => {
    render(<PostUpgradeBanner />);
    expect(
      screen.getByText(
        /You may notice some changes to how EPIC\.submit looks and works\. Some of the improvements you'll see:/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the three improvement bullets", () => {
    render(<PostUpgradeBanner />);
    expect(
      screen.getByText(
        "A refreshed Document Library that's easier to navigate.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /A clearer Update Request that makes it easier to see what's being asked and respond\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /A new Regulated Party Account Administrator role, plus the ability to revoke a user's access and view a history of changes to each user's account, all in User Management\./i,
      ),
    ).toBeInTheDocument();
  });

  it("renders 'User Guide' as an inline link to the guide URL", () => {
    render(<PostUpgradeBanner />);
    const guideLink = screen.getByRole("link", { name: "User Guide" });
    expect(guideLink).toHaveAttribute("href", USER_GUIDE_URL);
  });

  it("renders the support address as a mailto link", () => {
    render(<PostUpgradeBanner />);
    const mailtoLink = screen.getByRole("link", { name: SUPPORT_EMAIL });
    expect(mailtoLink).toHaveAttribute("href", `mailto:${SUPPORT_EMAIL}`);
  });

  it("renders the closing line with the support contact", () => {
    render(<PostUpgradeBanner />);
    const status = screen.getByRole("status");
    expect(
      within(status).getByText(
        /If you notice something doesn't work as expected, contact/i,
      ),
    ).toBeInTheDocument();
  });

  it("is not dismissible (no close control)", () => {
    render(<PostUpgradeBanner />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
