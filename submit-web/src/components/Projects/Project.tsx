import { Box, Button, Divider, Paper, styled, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import AddIcon from "@mui/icons-material/Add";
import { ProjectStatus } from "../registration/addProjects/ProjectStatus";
import { PROJECT_STATUS } from "../registration/addProjects/ProjectCard/constants";
import SubmissionPackageTable from "./ProjectTable";
import { AccountProject } from "@/models/Project";
import { PACKAGE_STATUS } from "@/models/Package";
import { useNavigate } from "@tanstack/react-router";
import { ContentBox } from "../Shared/ContentBox";

export const CardInnerBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
  padding: "0 12px",
});

type ProjectParam = {
  accountProject: AccountProject;
};

export const Project = ({ accountProject }: ProjectParam) => {
  const navigate = useNavigate();

  const activeSubmissionPackages = accountProject.packages.filter(
    (subPackage) => subPackage.status === PACKAGE_STATUS.IN_REVIEW.value
  );
  const pastSubmissionPackages = accountProject.packages.filter(
    (subPackage) => subPackage.status !== PACKAGE_STATUS.IN_REVIEW.value
  );

  const { name, ea_certificate } = accountProject.project;

  const handleNewSubmission = () => {
    navigate({ to: `/projects/${accountProject.id}/new-submission` });
  };

  const handleOnSubmissionClick = (submissionId: number) => {
    navigate({
      to: `/projects/${accountProject.id}/submissions/${submissionId}`,
    });
  };

  return (
    <ContentBox
      title={name}
      label={ea_certificate ? `EAC #${ea_certificate}` : ""}
    >
      <Box
        sx={{
          borderRadius: "3px",
          border: `1px solid #F2F2F2`,
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box
          display={"flex"}
          justifyContent={"space-between"}
          sx={{
            pt: BCDesignTokens.layoutPaddingMedium,
            pb: BCDesignTokens.layoutPaddingXlarge,
          }}
        >
          <CardInnerBox>
            <Typography variant="h4" fontWeight={400}>
              Management Plans
            </Typography>
            <ProjectStatus status={PROJECT_STATUS.POST_DECISION} />
          </CardInnerBox>
          <CardInnerBox>
            <Button onClick={handleNewSubmission}>
              <AddIcon sx={{ p: 0, mr: 0.5 }} />
              New Submission
            </Button>
          </CardInnerBox>
        </Box>
        <Box height={"100%"} px={BCDesignTokens.layoutPaddingXsmall}>
          <Divider sx={{ mb: 0.5 }} />
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              backgroundColor: BCDesignTokens.themeGold10,
            }}
          >
            Active Submissions
          </Typography>
          <CardInnerBox
            sx={{ height: "100%", py: BCDesignTokens.layoutPaddingSmall }}
          >
            <SubmissionPackageTable
              onSubmissionClick={handleOnSubmissionClick}
              submissionPackages={activeSubmissionPackages}
            />
          </CardInnerBox>
          <Divider
            sx={{
              mb: BCDesignTokens.layoutPaddingXsmall,
              mt: BCDesignTokens.layoutPaddingSmall,
            }}
          />
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              backgroundColor: BCDesignTokens.themeGold10,
            }}
          >
            Past Submissions
          </Typography>
          <CardInnerBox
            sx={{ height: "100%", py: BCDesignTokens.layoutPaddingMedium }}
          >
            <SubmissionPackageTable
              headless
              onSubmissionClick={handleOnSubmissionClick}
              submissionPackages={pastSubmissionPackages}
            />
          </CardInnerBox>
        </Box>
      </Box>
    </ContentBox>
  );
};
