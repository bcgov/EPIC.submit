import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  useGetPackageVersionsByOriginalPackageId,
  useGetStaffSubmissionPackage,
  useUpdateStateSubmissionPackage,
} from "@/hooks/api/usePackages";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import {
  PACKAGE_STATUS,
  SubmissionPackageApprovalType,
  SubmissionPackageType,
} from "@/models/Package";
import { SUBMISSION_STATUS, SUBMISSION_TYPE } from "@/models/Submission";
import { SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";

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

  // ─── Derived State ────────────────────────────────────────────────────────

  const approval_type = submissionPackage?.type.approval_type;

  const isLatestApprovedPackageVersion = packageVersions?.find(
    (pv) => pv.is_approved && pv.package_id === submissionPackageId,
  );

  const latestApprovedVersion = Math.max(
    ...(packageVersions
      ?.filter((pv) => pv.is_approved)
      .map((pv) => pv.version) || [0]),
  );

  const isNewerThanLastApprovedButNotApproved = Boolean(
    (latestApprovedVersion > 0 &&
      !submissionPackage?.version?.is_approved &&
      submissionPackage?.version?.version) ??
    0 > latestApprovedVersion,
  );

  const allDocumentsVerified = useMemo(() => {
    if (!submissionPackage) {
      return false;
    }

    const documentSubmissions = submissionPackage.items
      .filter(
        (item) =>
          item.type.name === SUBMISSION_ITEM_TYPE.UPLOAD_DOCUMENT ||
          item.type.name === SUBMISSION_ITEM_TYPE.GEOSPATIAL_INFORMATION,
      )
      .flatMap((item) => item.submissions)
      .filter((sub) => sub.type === SUBMISSION_TYPE.DOCUMENT);

    return (
      documentSubmissions.length > 0 &&
      documentSubmissions.every(
        (sub) => sub.status === SUBMISSION_STATUS.VERIFIED,
      )
    );
  }, [submissionPackage]);

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

  const isPackageApproved = useMemo(
    () => submissionPackage?.status.includes(PACKAGE_STATUS.APPROVED.value),
    [submissionPackage],
  );

  const canAcknowledge =
    submissionPackage?.type.name == SubmissionPackageType.ADDITIONAL_INFORMATION
      ? allDocumentsVerified
      : isReadyForAcknowledgement;

  const showAcknowledgeButton =
    !isPackageAcknowledged && !isPackageApproved && approval_type;
  const showApproveButtons =
    isPackageAcknowledged && approval_type == SubmissionPackageApprovalType.C;

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

  return {
    accountProject,
    submissionPackage,
    isFetching,
    updatePackageState,
    updatingPackageState,
    isLatestApprovedPackageVersion,
    isNewerThanLastApprovedButNotApproved,
    canAcknowledge,
    showAcknowledgeButton,
    showApproveButtons,
    setOpenModal,
    setCloseModal,
  };
}
