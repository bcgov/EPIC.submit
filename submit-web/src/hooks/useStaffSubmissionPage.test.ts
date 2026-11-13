import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("@/hooks/api/usePackages", () => ({
  useGetPackageVersionsByOriginalPackageId: vi.fn(),
  useGetStaffSubmissionPackage: vi.fn(),
  useUpdateStateSubmissionPackage: vi.fn(),
  useRefuseSubmissionPackage: vi.fn(),
  getStaffSubmissionPackageById: vi.fn(),
}));

vi.mock("@/hooks/api/useProjects", () => ({
  getAccountProjectForStaffQueryOptions: vi.fn(),
}));

vi.mock("@/components/Shared/Modals/modalStore", () => ({
  useModal: vi.fn(),
}));

vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

import { useNavigate } from "@tanstack/react-router";
import {
  getStaffSubmissionPackageById,
  useGetPackageVersionsByOriginalPackageId,
  useGetStaffSubmissionPackage,
  useRefuseSubmissionPackage,
  useUpdateStateSubmissionPackage,
} from "@/hooks/api/usePackages";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useAccount } from "@/store/accountStore";
import { useStaffSubmissionPage } from "./useStaffSubmissionPage";
import { QUERY_KEY } from "./api/constants";

const mockNavigate = vi.fn();
const mockSetOpen = vi.fn();
const mockSetClose = vi.fn();
const mockNotify = vi.mocked(notify);
const mockGetPackage = vi.mocked(useGetStaffSubmissionPackage);
const mockGetVersions = vi.mocked(useGetPackageVersionsByOriginalPackageId);
const mockUpdateState = vi.mocked(useUpdateStateSubmissionPackage);
const mockRefuse = vi.mocked(useRefuseSubmissionPackage);
const mockGetById = vi.mocked(getStaffSubmissionPackageById);

type Callbacks = {
  onSuccess: (data?: unknown) => void;
  onError: (error: unknown) => void;
};

const ACCOUNT_PROJECT_KEY = ["account-project-staff", 5];

let queryClient: QueryClient;

interface PackageOverrides {
  status?: string[];
  approvalType?: string;
  originalPackageId?: number;
}

const setPackage = ({
  status = [],
  approvalType = "A",
  originalPackageId = 100,
}: PackageOverrides = {}) => {
  mockGetPackage.mockReturnValue({
    data: {
      id: 3,
      status,
      type: { approval_type: approvalType },
      version: { original_package_id: originalPackageId },
    },
    isFetching: false,
  } as unknown as ReturnType<typeof useGetStaffSubmissionPackage>);
};

const setup = () =>
  renderHook(() =>
    useStaffSubmissionPage({
      submissionPackageId: 3,
      accountProjectId: 5,
      queryClient,
    }),
  );

describe("useStaffSubmissionPage", () => {
  let updateCallbacks: Callbacks;
  let refuseCallbacks: Callbacks;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(ACCOUNT_PROJECT_KEY, { id: 5 });
    vi.mocked(getAccountProjectForStaffQueryOptions).mockReturnValue({
      queryKey: ACCOUNT_PROJECT_KEY,
    } as unknown as ReturnType<typeof getAccountProjectForStaffQueryOptions>);
    vi.mocked(useNavigate).mockReturnValue(
      mockNavigate as unknown as ReturnType<typeof useNavigate>,
    );
    vi.mocked(useModal).mockReturnValue({
      setOpen: mockSetOpen,
      setClose: mockSetClose,
    } as unknown as ReturnType<typeof useModal>);
    mockGetVersions.mockReturnValue({
      data: [
        { package_id: 2, version: 1 },
        { package_id: 3, version: 2 },
      ],
    } as unknown as ReturnType<typeof useGetPackageVersionsByOriginalPackageId>);
    mockUpdateState.mockImplementation(((options: Callbacks) => {
      updateCallbacks = options;
      return { mutate: vi.fn(), isPending: false };
    }) as unknown as typeof useUpdateStateSubmissionPackage);
    mockRefuse.mockImplementation(((options: Callbacks) => {
      refuseCallbacks = options;
      return { mutate: vi.fn(), isPending: false };
    }) as unknown as typeof useRefuseSubmissionPackage);
    setPackage();
    useAccount.setState({ roles: ["w_extended_edit"] });
  });

  describe("data", () => {
    it("returns the account project from the query cache", () => {
      const { result } = setup();
      expect(result.current.accountProject).toEqual({ id: 5 });
    });

    it("enables the package query when the account project is cached", () => {
      setup();
      expect(mockGetPackage).toHaveBeenCalledWith({
        packageId: 3,
        enabled: true,
      });
    });

    it("disables the package query when the account project is not cached", () => {
      queryClient.clear();
      setup();
      expect(mockGetPackage).toHaveBeenCalledWith({
        packageId: 3,
        enabled: false,
      });
    });

    it("requests versions by original package id", () => {
      setup();
      expect(mockGetVersions).toHaveBeenCalledWith({
        originalPackageId: 100,
        enabled: true,
      });
    });

    it("disables versions query without an original package id", () => {
      mockGetPackage.mockReturnValue({
        data: undefined,
        isFetching: true,
      } as unknown as ReturnType<typeof useGetStaffSubmissionPackage>);
      const { result } = setup();
      expect(mockGetVersions).toHaveBeenCalledWith({
        originalPackageId: undefined,
        enabled: false,
      });
      expect(result.current.isFetching).toBe(true);
    });

    it("finds the current package version", () => {
      const { result } = setup();
      expect(result.current.currentPackageVersion).toEqual({
        package_id: 3,
        version: 2,
      });
    });

    it("exposes modal controls", () => {
      const { result } = setup();
      expect(result.current.setOpenModal).toBe(mockSetOpen);
      expect(result.current.setCloseModal).toBe(mockSetClose);
    });
  });

  describe("acknowledge and approve flags", () => {
    it("allows acknowledging a verified package for users with w_extended_edit", () => {
      setPackage({ status: ["VERIFIED"] });
      const { result } = setup();
      expect(result.current.canAcknowledge).toBe(true);
    });

    it.each(["B", "C"])(
      "allows acknowledging a Ready for Acknowledgement type %s package",
      (approvalType) => {
        setPackage({ status: ["READY_FOR_ACKNOWLEDGEMENT"], approvalType });
        const { result } = setup();
        expect(result.current.canAcknowledge).toBe(true);
      },
    );

    it("still allows acknowledging when an overlay shows next to Ready for Acknowledgement", () => {
      setPackage({
        status: ["READY_FOR_ACKNOWLEDGEMENT", "UPDATE_REQUESTED"],
        approvalType: "C",
      });
      const { result } = setup();
      expect(result.current.canAcknowledge).toBe(true);
    });

    it("blocks acknowledging a type C package that is only in Internal Verification", () => {
      setPackage({ status: ["INTERNAL_VERIFICATION"], approvalType: "C" });
      const { result } = setup();
      expect(result.current.canAcknowledge).toBe(false);
    });

    it("blocks Ready for Acknowledgement packages without w_extended_edit", () => {
      useAccount.setState({ roles: ["eao_view"] });
      setPackage({ status: ["READY_FOR_ACKNOWLEDGEMENT"], approvalType: "C" });
      const { result } = setup();
      expect(result.current.canAcknowledge).toBe(false);
    });

    it("blocks acknowledging when the package is not verified", () => {
      setPackage({ status: ["SUBMITTED"] });
      const { result } = setup();
      expect(result.current.canAcknowledge).toBe(false);
    });

    it("blocks acknowledging without w_extended_edit", () => {
      useAccount.setState({ roles: ["eao_view"] });
      setPackage({ status: ["VERIFIED"] });
      const { result } = setup();
      expect(result.current.canAcknowledge).toBe(false);
    });

    it("blocks users with only the GIS role", () => {
      useAccount.setState({ roles: ["gis_extended_edit"] });
      setPackage({ status: ["VERIFIED"] });
      const { result } = setup();
      expect(result.current.canAcknowledge).toBe(false);
    });

    it("allows users with w_extended_edit and the GIS role", () => {
      useAccount.setState({ roles: ["w_extended_edit", "gis_extended_edit"] });
      setPackage({ status: ["VERIFIED"] });
      const { result } = setup();
      expect(result.current.canAcknowledge).toBe(true);
    });

    it("shows approve buttons for w_extended_edit with the GIS role", () => {
      useAccount.setState({ roles: ["w_extended_edit", "gis_extended_edit"] });
      setPackage({ status: ["ACKNOWLEDGED"], approvalType: "C" });
      const { result } = setup();
      expect(result.current.showApproveButtons).toBe(true);
    });

    it("hides approve buttons for users with only the GIS role", () => {
      useAccount.setState({ roles: ["gis_extended_edit"] });
      setPackage({ status: ["ACKNOWLEDGED"], approvalType: "C" });
      const { result } = setup();
      expect(result.current.showApproveButtons).toBe(false);
    });

    it("allows users with full_access even with the GIS role", () => {
      useAccount.setState({
        roles: ["full_access", "gis_extended_edit"],
      });
      setPackage({ status: ["VERIFIED"] });
      const { result } = setup();
      expect(result.current.canAcknowledge).toBe(true);
    });

    it("handles missing roles", () => {
      useAccount.setState({ roles: undefined });
      setPackage({ status: ["VERIFIED"] });
      const { result } = setup();
      expect(result.current.canAcknowledge).toBe(false);
    });

    it.each(["A", "B", "C"])(
      "shows the acknowledge button for approval type %s",
      (approvalType) => {
        setPackage({ approvalType });
        const { result } = setup();
        expect(result.current.showAcknowledgeButton).toBe(true);
      },
    );

    it("hides the acknowledge button when already acknowledged", () => {
      setPackage({ status: ["ACKNOWLEDGED"] });
      const { result } = setup();
      expect(result.current.showAcknowledgeButton).toBe(false);
    });

    it.each(["APPROVED", "NOT_APPROVED"])(
      "hides the acknowledge button when status is %s",
      (status) => {
        setPackage({ status: [status] });
        const { result } = setup();
        expect(result.current.showAcknowledgeButton).toBe(false);
      },
    );

    it("hides the acknowledge button without an approval type", () => {
      setPackage({ approvalType: "" });
      const { result } = setup();
      expect(result.current.showAcknowledgeButton).toBe(false);
    });

    it("hides the acknowledge button when there is no package", () => {
      mockGetPackage.mockReturnValue({
        data: undefined,
        isFetching: false,
      } as unknown as ReturnType<typeof useGetStaffSubmissionPackage>);
      const { result } = setup();
      expect(result.current.showAcknowledgeButton).toBe(false);
    });

    it("shows approve buttons for acknowledged type C packages", () => {
      setPackage({ status: ["ACKNOWLEDGED"], approvalType: "C" });
      const { result } = setup();
      expect(result.current.showApproveButtons).toBe(true);
    });

    it("hides approve buttons for acknowledged type B packages", () => {
      setPackage({ status: ["ACKNOWLEDGED"], approvalType: "B" });
      const { result } = setup();
      expect(result.current.showApproveButtons).toBe(false);
    });

    it("hides approve buttons for users who cannot approve", () => {
      useAccount.setState({ roles: ["eao_view"] });
      setPackage({ status: ["ACKNOWLEDGED"], approvalType: "C" });
      const { result } = setup();
      expect(result.current.showApproveButtons).toBe(false);
    });
  });

  describe("update state mutation", () => {
    it("closes the modal and notifies on success", () => {
      setup();
      updateCallbacks.onSuccess();
      expect(mockSetClose).toHaveBeenCalled();
      expect(mockNotify.success).toHaveBeenCalledWith(
        "Submission acknowledged successfully",
      );
    });

    it("notifies the server message on error", () => {
      setup();
      updateCallbacks.onError({ response: { data: { message: "Denied" } } });
      expect(mockNotify.error).toHaveBeenCalledWith("Denied");
    });

    it("notifies a default message on error without details", () => {
      setup();
      updateCallbacks.onError(undefined);
      expect(mockNotify.error).toHaveBeenCalledWith(
        "Failed to acknowledge submission",
      );
    });
  });

  describe("refuse mutation", () => {
    it("closes the modal, invalidates queries and navigates to the new package", async () => {
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      const ensureSpy = vi
        .spyOn(queryClient, "ensureQueryData")
        .mockResolvedValue({});
      setup();

      act(() => {
        refuseCallbacks.onSuccess({ id: 9, version: { original_package_id: 100 } });
      });

      expect(mockSetClose).toHaveBeenCalled();
      expect(mockNotify.success).toHaveBeenCalledWith(
        "Submission refused successfully",
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 3],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEY.PACKAGE_VERSIONS, 100],
      });
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith({
          to: "/staff/projects/5/submission-packages/9",
          replace: true,
        }),
      );
      expect(ensureSpy).toHaveBeenCalledTimes(1);
    });

    it("fetches the new package through the query function", async () => {
      mockGetById.mockResolvedValue({ id: 9 } as unknown as Awaited<
        ReturnType<typeof getStaffSubmissionPackageById>
      >);
      vi.spyOn(queryClient, "ensureQueryData").mockImplementation(
        (async (opts: { queryFn: () => Promise<unknown> }) =>
          opts.queryFn()) as unknown as typeof queryClient.ensureQueryData,
      );
      setup();

      act(() => {
        refuseCallbacks.onSuccess({ id: 9, version: { original_package_id: 100 } });
      });

      await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
      expect(mockGetById).toHaveBeenCalledWith({ packageId: 9 });
    });

    it("notifies the server message on error", () => {
      setup();
      refuseCallbacks.onError({ response: { data: { message: "Cannot" } } });
      expect(mockNotify.error).toHaveBeenCalledWith("Cannot");
    });

    it("notifies a default message on error without details", () => {
      setup();
      refuseCallbacks.onError({});
      expect(mockNotify.error).toHaveBeenCalledWith(
        "Failed to refuse submission",
      );
    });
  });

  describe("isLoading", () => {
    it("is false when no mutation is pending", () => {
      const { result } = setup();
      expect(result.current.isLoading).toBe(false);
    });

    it("is true while the package state is updating", async () => {
      mockUpdateState.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      } as unknown as ReturnType<typeof useUpdateStateSubmissionPackage>);
      const { result } = setup();
      await waitFor(() => expect(result.current.isLoading).toBe(true));
    });

    it("is true while the package is being refused", async () => {
      mockRefuse.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      } as unknown as ReturnType<typeof useRefuseSubmissionPackage>);
      const { result } = setup();
      await waitFor(() => expect(result.current.isLoading).toBe(true));
    });
  });
});
