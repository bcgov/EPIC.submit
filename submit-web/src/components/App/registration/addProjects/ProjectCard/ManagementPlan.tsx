import { Box, Paper, Typography } from "@mui/material";
import { styled } from "@mui/system";
import { BCDesignTokens } from "epic.theme";
import { ProjectStatus } from "../ProjectStatus";
import { PROJECT_STATUS } from "./constants";
import { Project } from "@/models/Project";

const HEADER_HEIGHT = 54;
const BODY_HEIGHT = 247;

const CardInnerBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
  padding: "0 12px",
});

export const ManagementPlan = ({ project }: { project: Project }) => {
  return (
    <Paper
      sx={{
        borderRadius: "6px",
        boxShadow: BCDesignTokens.surfaceShadowMedium,
      }}
    >
      <Box
        bgcolor={"#F0F8FF"}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          borderRadius: "3px 3px 0 0",
        }}
        height={HEADER_HEIGHT}
      >
        <Typography variant="h5" fontWeight={600} px={2}>
          {project?.name}
        </Typography>
      </Box>
      <Box height={BODY_HEIGHT}>
        <Box
          sx={{
            padding: "36px 12px 12px 12px",
          }}
        >
          <Box
            sx={{
              borderRadius: "3px",
              border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
            }}
            height={187}
          >
            <Box height={"50%"}>
              <CardInnerBox>
                <Typography variant="h4" fontWeight={400} mb={1}>
                  Management Plans & Related Documents
                </Typography>
                <ProjectStatus status={PROJECT_STATUS.POST_DECISION} />
              </CardInnerBox>
            </Box>
            <Box height={"50%"}>
              <CardInnerBox
                sx={{
                  borderTop: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  paddingTop: "16px",
                }}
              >
                <Typography variant="body1">
                  You will be able to submit Managements Plans, Independent
                  Environmental Monitor Terms of Engagement, and certain reports
                  for this Project.
                </Typography>
              </CardInnerBox>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
