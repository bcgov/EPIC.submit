import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccessHistoryTable } from "./AccessHistoryTable";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { AccessHistoryEntry } from "@/hooks/api/useAccountUsers";

const mockUseGetAccessHistory = vi.fn();
vi.mock("@/hooks/api/useAccountUsers", () => ({
  useGetAccessHistory: (...args: unknown[]) => mockUseGetAccessHistory(...args),
}));

const collaboratorEntry: AccessHistoryEntry = {
  id: 1,
  account_project_id: 10,
  project_name: "Gold Mine Project",
  role_name: USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR,
  role_label: "Collaborator - Specific Submissions",
  active: true,
  access_start: "2024-01-15T00:00:00Z",
  access_end: null,
  original_package_ids: [100, 101],
  package_names: ["Annual Report 2024", "Quarterly Update Q1"],
};

const projectAdminEntry: AccessHistoryEntry = {
  id: 2,
  account_project_id: 20,
  project_name: "Silver Creek Project",
  role_name: USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN,
  role_label: "Project Administrator - Specific Project(s)",
  active: true,
  access_start: "2023-06-01T00:00:00Z",
  access_end: "2024-12-31T00:00:00Z",
  original_package_ids: null,
  package_names: [],
};

const accountAdminEntry: AccessHistoryEntry = {
  id: 3,
  account_project_id: 30,
  project_name: "Copper Ridge Project",
  role_name: USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
  role_label: "Account Administrator",
  active: true,
  access_start: "2022-01-01T00:00:00Z",
  access_end: null,
  original_package_ids: null,
  package_names: [],
};

describe("AccessHistoryTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading and empty states", () => {
    it("displays loading message when data is pending", () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: undefined,
        isPending: true,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      expect(screen.getByText("Loading access history...")).toBeInTheDocument();
    });

    it("displays empty message when history is empty", () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      expect(
        screen.getByText("No access history available."),
      ).toBeInTheDocument();
    });

    it("displays empty message when history is null", () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: null,
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      expect(
        screen.getByText("No access history available."),
      ).toBeInTheDocument();
    });
  });

  describe("table rendering", () => {
    it("renders table headers correctly", () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [accountAdminEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      expect(screen.getByText("Project")).toBeInTheDocument();
      expect(screen.getByText("Access Level")).toBeInTheDocument();
      expect(screen.getByText("From")).toBeInTheDocument();
      expect(screen.getByText("To")).toBeInTheDocument();
    });

    it("renders project name and role label for each entry", () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [accountAdminEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      expect(screen.getByText("Copper Ridge Project")).toBeInTheDocument();
      expect(screen.getByText("Account Administrator")).toBeInTheDocument();
    });

    it("formats dates correctly and shows -- for null dates", () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [collaboratorEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      expect(screen.getByText("2024-01-15")).toBeInTheDocument();
      expect(screen.getByText("--")).toBeInTheDocument();
    });
  });

  describe("expandable rows - Collaborator", () => {
    it("shows expand arrow for Collaborator - Specific Submissions with packages", () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [collaboratorEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      const expandButton = screen.getByRole("button", {
        name: "expand details",
      });
      expect(expandButton).toBeInTheDocument();
    });

    it("does not show sub-table when collapsed", () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [collaboratorEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      expect(
        screen.queryByText("Collaborator on the following submissions"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Annual Report 2024")).not.toBeInTheDocument();
    });

    it("shows sub-table with submissions when expanded", async () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [collaboratorEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      const expandButton = screen.getByRole("button", {
        name: "expand details",
      });
      await userEvent.click(expandButton);

      expect(
        screen.getByText("Collaborator on the following submissions"),
      ).toBeInTheDocument();
      expect(screen.getByText("Annual Report 2024")).toBeInTheDocument();
      expect(screen.getByText("Quarterly Update Q1")).toBeInTheDocument();
    });

    it("toggles arrow direction when expanded and collapsed", async () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [collaboratorEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      // Initially collapsed - shows expand button
      expect(
        screen.getByRole("button", { name: "expand details" }),
      ).toBeInTheDocument();

      // Click to expand
      await userEvent.click(
        screen.getByRole("button", { name: "expand details" }),
      );

      // Now shows collapse button
      expect(
        screen.getByRole("button", { name: "collapse details" }),
      ).toBeInTheDocument();

      // Click to collapse
      await userEvent.click(
        screen.getByRole("button", { name: "collapse details" }),
      );

      // Back to expand button
      expect(
        screen.getByRole("button", { name: "expand details" }),
      ).toBeInTheDocument();
    });
  });

  describe("expandable rows - Project Administrator", () => {
    it("shows expand arrow for Project Administrator - Specific Projects", () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [projectAdminEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      const expandButton = screen.getByRole("button", {
        name: "expand details",
      });
      expect(expandButton).toBeInTheDocument();
    });

    it("shows project details in sub-table when expanded", async () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [projectAdminEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      const expandButton = screen.getByRole("button", {
        name: "expand details",
      });
      await userEvent.click(expandButton);

      expect(
        screen.getByText("Project Administrator for the following project"),
      ).toBeInTheDocument();
    });
  });

  describe("non-expandable rows", () => {
    it("does not show expand arrow for Account Administrator", () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [accountAdminEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      expect(screen.queryByRole("button", { name: "expand details" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "collapse details" })).not.toBeInTheDocument();
    });
  });

  describe("multiple rows expanded simultaneously", () => {
    it("allows multiple rows to be expanded at the same time", async () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [collaboratorEntry, projectAdminEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      const expandButtons = screen.getAllByRole("button", {
        name: "expand details",
      });
      expect(expandButtons).toHaveLength(2);

      // Expand both rows
      await userEvent.click(expandButtons[0]);
      await userEvent.click(expandButtons[1]);

      // Both sub-tables should be visible
      expect(
        screen.getByText("Collaborator on the following submissions"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Project Administrator for the following project"),
      ).toBeInTheDocument();
    });

    it("collapsing one row does not affect other expanded rows", async () => {
      mockUseGetAccessHistory.mockReturnValue({
        data: [collaboratorEntry, projectAdminEntry],
        isPending: false,
      });

      render(<AccessHistoryTable accountUserId={1} />);

      const expandButtons = screen.getAllByRole("button", {
        name: "expand details",
      });

      // Expand both
      await userEvent.click(expandButtons[0]);
      await userEvent.click(expandButtons[1]);

      // Collapse the first one
      const collapseButtons = screen.getAllByRole("button", {
        name: "collapse details",
      });
      await userEvent.click(collapseButtons[0]);

      // First sub-table hidden, second still visible
      expect(
        screen.queryByText("Collaborator on the following submissions"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("Project Administrator for the following project"),
      ).toBeInTheDocument();
    });
  });
});
