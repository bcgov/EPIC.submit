import { Box, Button, Divider, styled, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import AddIcon from "@mui/icons-material/Add";
import { ProjectStatus } from "../registration/addProjects/ProjectStatus";
import { PROJECT_STATUS } from "../registration/addProjects/ProjectCard/constants";
import ProjectTable from "./ProjectTable";
import { AccountProject } from "@/models/Project";
import { useNavigate } from "@tanstack/react-router";
import { ContentBox } from "../Shared/ContentBox";
import { When } from "react-if";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import PermissionsGate from "../Shared/PermissionGate";
import { ACCOUNT_USER_PERMISSIONS } from "@/models/Role";

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
  const { userType } = useAccount();

  const activeSubmissionPackages = accountProject.packages.filter(
    (subPackage) => !subPackage.completed_on,
  );
  const pastSubmissionPackages = accountProject.packages.filter((subPackage) =>
    Boolean(subPackage.completed_on),
  );

  const { name, ea_certificate } = accountProject.project;

  const handleNewSubmission = () => {
    navigate({
      to: `/proponent/projects/${accountProject.id}/new-submission`,
    });
  };

  return (
    <ContentBox
      mainLabel={name}
      topLabel={accountProject.project.proponent_name}
      bottomLabel={ea_certificate ? `EAC # ${ea_certificate}` : ""}
    >
      <Box
        sx={{
          borderRadius: "3px",
          border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
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
              Management Plans and Related Documents
            </Typography>
            <ProjectStatus status={PROJECT_STATUS.POST_DECISION} />
          </CardInnerBox>
          <When condition={userType === USER_TYPE.PROPONENT}>
            <CardInnerBox>
              <PermissionsGate
                scopes={[ACCOUNT_USER_PERMISSIONS.CREATE_PACKAGE]}
              >
                <Button onClick={handleNewSubmission}>
                  <AddIcon sx={{ p: 0, mr: 0.5 }} />
                  New Submission
                </Button>
              </PermissionsGate>
            </CardInnerBox>
          </When>
        </Box>
        <Box height={"100%"} px={BCDesignTokens.layoutPaddingXsmall}>
          <Divider
            sx={{
              ml: BCDesignTokens.layoutPaddingSmall,
              mb: BCDesignTokens.layoutPaddingXsmall,
            }}
          />
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              backgroundColor: BCDesignTokens.themeGold10,
              ml: BCDesignTokens.layoutPaddingSmall,
            }}
          >
            Active Submissions
          </Typography>
          <CardInnerBox
            sx={{ height: "100%", py: BCDesignTokens.layoutPaddingSmall }}
          >
            <ProjectTable submissionPackages={activeSubmissionPackages} />
          </CardInnerBox>
          <Divider
            sx={{
              mb: BCDesignTokens.layoutPaddingXsmall,
              mt: BCDesignTokens.layoutPaddingSmall,
              ml: BCDesignTokens.layoutPaddingSmall,
            }}
          />
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              backgroundColor: BCDesignTokens.themeGold10,
              ml: BCDesignTokens.layoutPaddingSmall,
            }}
          >
            Past Submissions
          </Typography>
          <CardInnerBox
            sx={{ height: "100%", py: BCDesignTokens.layoutPaddingMedium }}
          >
            <ProjectTable
              headless
              submissionPackages={pastSubmissionPackages}
            />
          </CardInnerBox>
        </Box>
      </Box>
    </ContentBox>
  );
};
