import { Form } from "@/components/App/NewManagementPlan/Form";
import { NewManagementPlanForm } from "@/components/App/NewManagementPlan/types";
import { PROJECT_STATUS } from "@/components/App/registration/addProjects/ProjectCard/constants";
import { ProjectStatus } from "@/components/App/registration/addProjects/ProjectStatus";
import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import { SubmissionPackageType } from "@/components/Shared/types";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { AccountProject } from "@/models/Project";
import { Box, Grid, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type NewManagementPlanProps = {
  accountProject?: AccountProject;
  onSubmit: (data: Record<string, unknown>) => void;
};

export function NewManagementPlan({
  accountProject,
  onSubmit,
}: NewManagementPlanProps) {
  const handleSubmit = ({
    name,
    type,
    ...restMetadata
  }: Partial<NewManagementPlanForm>) => {
    onSubmit({
      name: name?.value ?? SubmissionPackageType.MANAGEMENT_PLAN,
      metadata: restMetadata,
      type,
    });
  };

  return (
    <Grid item xs={12}>
      <ContentBox
        mainLabel={accountProject?.project.name}
        topLabel={accountProject?.project?.proponent?.name || ""}
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
            Management Plans & Related Documents
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
            <Form onSubmit={handleSubmit} />
          </Box>
        </Box>
      </ContentBox>
    </Grid>
  );
}
