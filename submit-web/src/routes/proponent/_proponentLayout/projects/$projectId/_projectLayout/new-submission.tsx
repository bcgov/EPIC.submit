import { NewWorkPackageSubmission } from "@/components/App/NewSubmission/NewWorkPackageSubmission";
import { NewManagementPlan } from "@/components/App/NewSubmission/NewManagementPlan";
import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import { SubmitLoaderBackdrop } from "@/components/Shared/Overlays/SubmitLoaderBackdrop";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useCreateSubmissionPackage } from "@/hooks/api/usePackages";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { SubmissionPackage } from "@/models/Package";
import { ACCOUNT_USER_PERMISSIONS } from "@/models/Role";
import { useNewSubmissionStore } from "@/store/newSubmissionStore";
import { Grid } from "@mui/material";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

const newSubmissionSearchSchema = z.object({
  workId: z.number().optional(),
  isManagementPlan: z.boolean().optional(),
});

export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/new-submission",
)({
  component: NewSubmission,
  head: () => ({ meta: [{ title: "New Submission" }] }),
  validateSearch: newSubmissionSearchSchema,
  beforeLoad: ({
    context: { account },
    params: { projectId: accountProjectId },
  }) => {
    if (!account || account.isLoading) {
      return;
    }

    if (
      !account.userManagementRoles?.some(
        (role) =>
          String(role.account_project_id) === accountProjectId &&
          role.permissions?.includes(ACCOUNT_USER_PERMISSIONS.CREATE_PACKAGE),
      )
    ) {
      return redirect({
        to: "/unauthorized",
      });
    }
  },
});

export function NewSubmission() {
  const { projectId } = Route.useParams();
  const { workId, isManagementPlan } = Route.useSearch();
  const navigate = useNavigate();

  const { data: accountProject, isPending: isProjectPending } =
    useGetAccountProject({
      accountProjectId: Number(projectId),
    });

  const { setAccountProject, reset } = useNewSubmissionStore();

  const {
    mutate: createSubmissionPackage,
    isPending: isCreatingSubmissionPackagePending,
  } = useCreateSubmissionPackage({
    onError: () => notify.error("Failed to create submission package"),
    onSuccess: (createdSubmissionPackage: SubmissionPackage) => {
      notify.success("Submission package created successfully");
      navigate({
        to: `/proponent/projects/${projectId}/submission-packages/${createdSubmissionPackage.id}`,
      });
    },
  });

  const handleSubmit = (data: any) => {
    createSubmissionPackage({
      accountProjectId: Number(projectId),
      data,
    });
  };

  // Sync query data to store
  useEffect(() => {
    setAccountProject(accountProject ?? null, workId);
  }, [accountProject, setAccountProject, workId]);

  // Reset store on unmount
  useEffect(() => () => reset(), [reset]);

  if (isProjectPending)
    return (
      <PageGrid>
        <Grid item xs={12}>
          <ContentBoxSkeleton />
        </Grid>
      </PageGrid>
    );

  return (
    <PageGrid>
      <SubmitLoaderBackdrop isOpen={isCreatingSubmissionPackagePending} />
      {workId ? (
        <NewWorkPackageSubmission onSubmit={handleSubmit} />
      ) : isManagementPlan ? (
        <NewManagementPlan onSubmit={handleSubmit} />
      ) : null}
    </PageGrid>
  );
}
