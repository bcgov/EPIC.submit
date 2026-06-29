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

  const isLatestApprovedPackageVersion =
    currentPackageVersion?.is_latest && currentPackageVersion?.is_approved;

  const isNewerThanLastApprovedButNotApproved =
    currentPackageVersion?.is_latest && !currentPackageVersion?.is_approved;

  const isRejectedOrReplaced =
    (!approval_type &&
      packageVersions?.at(0)?.package_id !== submissionPackageId &&
      !currentPackageVersion?.is_approved) ||
    (currentPackageVersion?.is_approved && !isLatestApprovedPackageVersion);

  const displaySubmissionBanner =
    isLatestApprovedPackageVersion || isRejectedOrReplaced;

  const isReadyForAcknowledgement = useMemo(
    () =>
      submissionPackage?.status.includes(
        PACKAGE_STATUS.READY_FOR_ACKNOWLEDGEMENT.value,
      ),
    [submissionPackage],
  );

  const isPackageAcknowledged = useMemo(
    () => submissionPackage?.status.includes(PACKAGE_STATUS.ACKNOWLEDGED.value),
    [submissionPackage],
  );

  const isPackageVerified = useMemo(
    () => submissionPackage?.status.includes(PACKAGE_STATUS.VERIFIED.value),
    [submissionPackage],
  );

  const canAcknowledge =
    approval_type === SubmissionPackageApprovalType.A
      ? isPackageVerified
      : isReadyForAcknowledgement;

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

  // Only Team Leads can approve packages (Team Members can view, verify, acknowledge, request updates)
  const isTeamLead = submissionPackage?.account_project_work?.work_role === "TEAM_LEAD";
  console.log("isTeamLead", isTeamLead);
  console.log("work_role", submissionPackage);
  const showApproveButtons =
    isPackageAcknowledged && 
    approval_type == SubmissionPackageApprovalType.C &&
    isTeamLead;

  useEffect(() => {
    setIsLoading(updatingPackageState || refusingPackage);
  }, [updatingPackageState, refusingPackage]);

  return {
    accountProject,
    submissionPackage,
    isFetching,
    updatePackageState,
    refusePackage,
    isLoading,
    isLatestApprovedPackageVersion,
    isNewerThanLastApprovedButNotApproved,
    isRejectedOrReplaced,
    displaySubmissionBanner,
    canAcknowledge,
    showAcknowledgeButton,
    showApproveButtons,
    setOpenModal,
    setCloseModal,
  };
}
