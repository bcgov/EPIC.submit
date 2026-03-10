import { NewManagementPlan } from "@/components/App/NewManagementPlan";
import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import { SubmitLoaderBackdrop } from "@/components/Shared/Overlays/SubmitLoaderBackdrop";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useCreateSubmissionPackage } from "@/hooks/api/usePackages";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { SubmissionPackage } from "@/models/Package";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { Grid } from "@mui/material";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/new-submission",
)({
  component: NewSubmission,
  head: () => ({ meta: [{ title: "New Submission" }] }),
  beforeLoad: ({ context: { account } }) => {
    if (!account || account.isLoading) {
      return;
    }

    if (
      account.userManagementRole?.role_name !==
      USER_MANAGEMENT_ROLE.PROJECT_ADMIN
    ) {
      return redirect({
        to: "/unauthorized",
      });
    }
  },
});

export function NewSubmission() {
  const { projectId } = Route.useParams();

  const { data: accountProject, isPending: isProjectPending } =
    useGetAccountProject({
      accountProjectId: Number(projectId),
    });
  const navigate = useNavigate();

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

  const currentPhase =
    accountProject?.account_project_works?.at(-1)?.work?.current_phase ?? null;

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
      {currentPhase?.work_type_name == "ASSESSMENT" ? (
        <p></p>
      ) : (
        <NewManagementPlan
          accountProject={accountProject}
          onSubmit={(data) =>
            createSubmissionPackage({
              accountProjectId: Number(projectId),
              data,
            })
          }
        />
      )}
    </PageGrid>
  );
}
