import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  useGetPackageVersionsByOriginalPackageId,
  useGetStaffSubmissionPackage,
  useUpdateStateSubmissionPackage,
  useRefuseSubmissionPackage,
  getStaffSubmissionPackageById,
} from "@/hooks/api/usePackages";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import {
  PACKAGE_STATUS,
  SubmissionPackage,
  SubmissionPackageApprovalType,
} from "@/models/Package";
import { QUERY_KEY } from "./api/constants";
import { useNavigate } from "@tanstack/react-router";
import { useAccount } from "@/store/accountStore";
import { hasPermission } from "@/components/Shared/PermissionGate/utils";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";

interface UseStaffSubmissionPageOptions {
  submissionPackageId: number;
  accountProjectId: number;
  queryClient: ReturnType<typeof useQueryClient>;
}

export function useStaffSubmissionPage({
  submissionPackageId,
  accountProjectId,
  queryClient,
}: UseStaffSubmissionPageOptions) {
  const { setOpen: setOpenModal, setClose: setCloseModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const account = useAccount();

  const accountProject = queryClient.getQueryData(
    getAccountProjectForStaffQueryOptions(accountProjectId).queryKey,
  );

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const { data: submissionPackage, isFetching } = useGetStaffSubmissionPackage({
    packageId: submissionPackageId,
    enabled: Boolean(accountProject?.id),
  });

  const { data: packageVersions } = useGetPackageVersionsByOriginalPackageId({
    originalPackageId: submissionPackage?.version?.original_package_id,
    enabled: Boolean(submissionPackage?.version?.original_package_id),
  });

  const loadNewPackage = async (packageId: number) => {
    try {
      setIsLoading(true);
      await queryClient.ensureQueryData<SubmissionPackage>({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, packageId],
        queryFn: () => getStaffSubmissionPackageById({ packageId }),
      });
      navigate({
        to: `/staff/projects/${accountProject?.id}/submission-packages/${packageId}`,
        replace: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Mutations ────────────────────────────────────────────────────────────

  const { mutate: updatePackageState, isPending: updatingPackageState } =
    useUpdateStateSubmissionPackage({
      onSuccess: () => {
        setCloseModal();
        notify.success("Submission acknowledged successfully");
      },
      onError: (error: any) => {
        notify.error(
          error?.response?.data?.message ?? "Failed to acknowledge submission",
        );
      },
    });

  const { mutate: refusePackage, isPending: refusingPackage } =
    useRefuseSubmissionPackage({
      onSuccess: (newPackage) => {
        setCloseModal();
        notify.success("Submission refused successfully");

        // Invalidate the old package so it's refetched when revisited
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, submissionPackageId],
        });
        queryClient.invalidateQueries({
          queryKey: [
            QUERY_KEY.PACKAGE_VERSIONS,
            newPackage.version?.original_package_id,
          ],
        });

        loadNewPackage(newPackage.id);
      },
      onError: (error: any) => {
        notify.error(
          error?.response?.data?.message ?? "Failed to refuse submission",
        );
      },
    });

  // ─── Derived State ────────────────────────────────────────────────────────

  const approval_type = submissionPackage?.type.approval_type;

  const currentPackageVersion = packageVersions?.find(
    (pv) => pv.package_id === submissionPackageId,
  );

  const isPackageAcknowledged = useMemo(
    () => submissionPackage?.status.includes(PACKAGE_STATUS.ACKNOWLEDGED.value),
    [submissionPackage],
  );

  // Types B and C become READY_FOR_ACKNOWLEDGEMENT once every document is verified;
  // type A (Additional Information) keeps VERIFIED as its terminal status.
  const isPackageReadyToAcknowledge = useMemo(
    () =>
      submissionPackage?.status.includes(
        PACKAGE_STATUS.READY_FOR_ACKNOWLEDGEMENT.value,
      ) || submissionPackage?.status.includes(PACKAGE_STATUS.VERIFIED.value),
    [submissionPackage],
  );

  // Only users with w_extended_edit or full_access can approve/acknowledge
  // packages (hasPermission always includes full_access). This mirrors
  // authorization.require_team_lead_access in the API.
  const hasAcknowledgeOrApproveRole = hasPermission({
    permissions: account.roles || [],
    scopes: [EPIC_SUBMIT_ROLE.w_extended_edit],
  });

  const canAcknowledge =
    isPackageReadyToAcknowledge && hasAcknowledgeOrApproveRole;

  const isPackagePastApproval = useMemo(
    () =>
      submissionPackage?.status.includes(PACKAGE_STATUS.APPROVED.value) ||
      submissionPackage?.status.includes(PACKAGE_STATUS.NOT_APPROVED.value),
    [submissionPackage],
  );

  const showAcknowledgeButton =
    !isPackageAcknowledged &&
    !isPackagePastApproval &&
    Boolean(approval_type) &&
    [
      SubmissionPackageApprovalType.A,
      SubmissionPackageApprovalType.B,
      SubmissionPackageApprovalType.C,
    ].includes(approval_type as SubmissionPackageApprovalType);

  const canApprove = hasAcknowledgeOrApproveRole;
  const showApproveButtons =
    isPackageAcknowledged &&
    approval_type == SubmissionPackageApprovalType.C &&
    canApprove;

  useEffect(() => {
    setIsLoading(updatingPackageState || refusingPackage);
  }, [updatingPackageState, refusingPackage]);

  return {
    packageVersions,
    currentPackageVersion,
    accountProject,
    submissionPackage,
    isFetching,
    updatePackageState,
    refusePackage,
    isLoading,
    canAcknowledge,
    showAcknowledgeButton,
    showApproveButtons,
    setOpenModal,
    setCloseModal,
  };
}
