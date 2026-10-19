import { LoadingButton } from "@/components/Shared/LoadingButton";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { UnfinishedUploadsCheck } from "@/components/Shared/UnfinishedUploadsCheck";
import { useUpdateStateSubmissionPackage } from "@/hooks/api/usePackages";
import { QUERY_KEY } from "@/hooks/api/constants";
import { PACKAGE_STATUS, SubmissionPackage } from "@/models/Package";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { Box } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

export default function MarkAsProvidedButton({
  submissionPackage,
}: {
  submissionPackage: SubmissionPackage;
}) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useUpdateStateSubmissionPackage({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.SUBMISSION_ITEM] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.PACKAGE_VERSIONS] });
      notify.success("Plan marked as provided");
    },
    onError: () => notify.error("Failed to mark plan as provided"),
  });

  if (
    !submissionPackage.submitted_on ||
    submissionPackage.completed_on ||
    submissionPackage.status.includes(PACKAGE_STATUS.WITHDRAWN.value)
  )
    return null;

  return (
    <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.mp_edit]}>
      <Box mt={2}>
        <UnfinishedUploadsCheck>
          <LoadingButton
            loading={isPending}
            disabled={isPending}
            onClick={() =>
              mutate({
                packageId: submissionPackage.id,
                data: { status: PACKAGE_STATUS.PROVIDED.value },
              })
            }
          >
            Marked as Provided
          </LoadingButton>
        </UnfinishedUploadsCheck>
      </Box>
    </PermissionsGate>
  );
}
