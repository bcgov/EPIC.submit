import { PROJECT_STATUS } from "@/components/registration/addProjects/ProjectCard/constants";
import { ProjectStatus } from "@/components/registration/addProjects/ProjectStatus";
import { ContentBox } from "@/components/Shared/ContentBox";
import { PageGrid } from "@/components/Shared/PageGrid";
import { YellowBar } from "@/components/Shared/YellowBar";
import { Box, Grid, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/projects/submission-packages/new-management-plan/",
)({
  component: NewManagementPlan,
});

export function NewManagementPlan() {
  return (
    <PageGrid>
      <Grid item xs={12}>
        <ContentBox title={"Copper Mine"}>
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
              Management Plans
            </Typography>
            <ProjectStatus status={PROJECT_STATUS.POST_DECISION} />
            <Box
              sx={{
                padding: "24px 16px 16px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                borderRadius: "4px",
                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                gap: BCDesignTokens.layoutPaddingSmall,
              }}
            >
              <YellowBar />
              <Typography variant="h5">New Submission</Typography>
              <Grid container width={"100%"}>
                <Grid
                  item
                  xl={8}
                  lg={10}
                  md={12}
                  sx={{
                    backgroundColor: "lavender",
                    padding: "24px 0px 12px 0px",
                  }}
                >
                  <Typography variant="body1">
                    A new management plan submission has been created for the
                    Copper Mine project.
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
