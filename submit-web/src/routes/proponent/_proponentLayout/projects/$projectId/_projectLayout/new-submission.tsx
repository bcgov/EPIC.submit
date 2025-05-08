import { Form } from "@/components/NewManagementPlan/Form";
import { NewManagementPlanForm } from "@/components/NewManagementPlan/types";
import { PROJECT_STATUS } from "@/components/registration/addProjects/ProjectCard/constants";
import { ProjectStatus } from "@/components/registration/addProjects/ProjectStatus";
import { ContentBox } from "@/components/Shared/ContentBox";
import { ContentBoxSkeleton } from "@/components/Shared/ContentBox/ContentBoxSkeleton";
import { useLoaderBackdrop } from "@/components/Shared/Overlays/loaderBackdropStore";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { SubmissionPackageType } from "@/components/Shared/types";
import { useCreateSubmissionPackage } from "@/hooks/api/usePackages";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { SubmissionPackage } from "@/models/Package";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { Box, Grid, Typography } from "@mui/material";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { useEffect } from "react";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/new-submission",
)({
  component: NewManagementPlan,
  meta: () => [{ title: "New Submission Package" }],
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

export function NewManagementPlan() {
  // get the projectId from the route
  const { projectId } = Route.useParams();
  const { setIsOpen } = useLoaderBackdrop();
  const { data: accountProject, isPending: isProjectPending } =
    useGetAccountProject({
      accountProjectId: Number(projectId),
    });
  const navigate = useNavigate();

  const onCreateFailure = () => {
    notify.error("Failed to create submission package");
  };

  const onCreateSuccess = (createdSubmissionPackage: SubmissionPackage) => {
    notify.success("Submission package created successfully");
    navigate({
      to: `/proponent/projects/${projectId}/submission-packages/${createdSubmissionPackage.id}`,
    });
  };
  const {
    mutate: createSubmissionPackage,
    isPending: isCreatingSubmissionPackagePending,
  } = useCreateSubmissionPackage({
    onError: onCreateFailure,
    onSuccess: onCreateSuccess,
  });

  useEffect(() => {
    setIsOpen(isCreatingSubmissionPackagePending);
    return () => setIsOpen(false);
  }, [isCreatingSubmissionPackagePending, setIsOpen]);

  const onCreateSubmissionPackage = (
    metadata: Partial<NewManagementPlanForm>,
  ) => {
    const { name, type, ...restMetadata } = metadata;
    const newSubmissionPackageRequest = {
      name: name?.value ?? SubmissionPackageType.MANAGEMENT_PLAN,
      metadata: restMetadata,
      type: type,
    };
    createSubmissionPackage({
      accountProjectId: Number(projectId),
      data: newSubmissionPackageRequest,
    });
    return newSubmissionPackageRequest;
  };

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
      <Grid item xs={12}>
        <ContentBox
          mainLabel={accountProject?.project.name}
          topLabel={accountProject?.project?.proponent_name}
          bottomLabel={
            accountProject?.project.ea_certificate
              ? `EAC # ${accountProject?.project.ea_certificate}`
              : ""
          }
        >
          <Box
            sx={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              borderRadius: "4px",
              border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              gap: BCDesignTokens.layoutPaddingSmall,
            }}
          >
            <Typography variant="h4" fontWeight={400}>
              Management Plans and Related Documents
            </Typography>
            <ProjectStatus status={PROJECT_STATUS.POST_DECISION} />
            <Box
              sx={{
                padding: "8px 16px 16px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                borderRadius: "4px",
                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                gap: BCDesignTokens.layoutPaddingSmall,
              }}
            >
              <BarTitle title="New Submission" />
              <Form onSubmit={onCreateSubmissionPackage} />
            </Box>
          </Box>
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
