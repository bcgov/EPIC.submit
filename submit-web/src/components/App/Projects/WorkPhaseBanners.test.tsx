import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkPhaseBanners } from "./WorkPhaseBanners";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
  }: {
    to: string;
    children: React.ReactNode;
  }) => <a href={to}>{children}</a>,
}));

describe("WorkPhaseBanners", () => {
  it("renders nothing when the work has no awaiting phase and nothing is archived", () => {
    const { container } = render(<WorkPhaseBanners />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the yellow banner with the phase the project has not reached yet", () => {
    render(<WorkPhaseBanners awaitingPhaseName="Early Engagement" />);

    expect(screen.getByTestId("awaiting-phase-banner")).toHaveTextContent(
      "Your project is not in Early Engagement yet.",
    );
    expect(
      screen.queryByTestId("archived-documents-banner"),
    ).not.toBeInTheDocument();
  });

  it("shows the proponent blue banner with a link to the proponent Documents tab", () => {
    render(<WorkPhaseBanners hasArchivedPackages />);

    const banner = screen.getByTestId("archived-documents-banner");
    expect(banner).toHaveTextContent(
      "Documents you submitted for previous phases are now in the Documents tab.",
    );
    expect(screen.getByRole("link", { name: "Documents tab" })).toHaveAttribute(
      "href",
      "/proponent/documents",
    );
    expect(
      screen.queryByTestId("awaiting-phase-banner"),
    ).not.toBeInTheDocument();
  });

  it("shows the staff wording with a link to the staff Documents tab", () => {
    render(<WorkPhaseBanners hasArchivedPackages isStaff />);

    expect(screen.getByTestId("archived-documents-banner")).toHaveTextContent(
      "Documents submitted for previous phases are now in the Documents tab.",
    );
    expect(screen.getByRole("link", { name: "Documents tab" })).toHaveAttribute(
      "href",
      "/staff/documents",
    );
  });

  it("shows both banners together", () => {
    render(
      <WorkPhaseBanners
        awaitingPhaseName="Readiness Decision"
        hasArchivedPackages
      />,
    );

    expect(screen.getByTestId("awaiting-phase-banner")).toHaveTextContent(
      "Your project is not in Readiness Decision yet.",
    );
    expect(screen.getByTestId("archived-documents-banner")).toBeInTheDocument();
  });
});
