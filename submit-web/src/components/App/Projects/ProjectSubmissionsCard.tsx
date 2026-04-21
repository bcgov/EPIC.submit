import ProjectTable from "@/components/App/Projects/ProjectTable";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { SubmissionPackage } from "@/models/Package";
import { ACCOUNT_USER_PERMISSIONS } from "@/models/Role";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Divider, styled, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { When } from "react-if";
import { SubmissionTitle } from "@/components/App/Submission/SubmissionTitle";

export const CardInnerBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
  padding: "0 12px",
});

type ProjectSubmissionsCardProps = {
  title: string;
  status: string;
  packages: SubmissionPackage[];
  isWorkRelated?: boolean;
  onNewSubmission: () => void;
};

export const ProjectSubmissionsCard = ({
  title,
  status,
  packages,
  isWorkRelated = false,
  onNewSubmission,
}: ProjectSubmissionsCardProps) => {
  const { userType } = useAccount();

  const activeSubmissionPackages = packages?.filter(
    (subPackage) => !subPackage.completed_on,
  );
  const pastSubmissionPackages = packages?.filter((subPackage) =>
    Boolean(subPackage.completed_on),
  );

  return (
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
          pl: "0.75rem",
          pb: BCDesignTokens.layoutPaddingXlarge,
        }}
      >
        <SubmissionTitle customTitle={title} customStatus={status} />
        <When condition={userType === USER_TYPE.PROPONENT}>
          <CardInnerBox>
            <PermissionsGate scopes={[ACCOUNT_USER_PERMISSIONS.CREATE_PACKAGE]}>
              <Button onClick={onNewSubmission}>
                <AddIcon sx={{ p: 0, mr: 0.5 }} />
                New Submission
              </Button>
            </PermissionsGate>
          </CardInnerBox>
        </When>
      </Box>
      <Box height={"100%"} px={BCDesignTokens.layoutPaddingXsmall}>
        <When condition={!isWorkRelated}>
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
        </When>
        <CardInnerBox
          sx={{ height: "100%", py: BCDesignTokens.layoutPaddingSmall }}
        >
          <ProjectTable submissionPackages={activeSubmissionPackages} />
        </CardInnerBox>
        <When condition={!isWorkRelated}>
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
            Review Completed by the EAO
          </Typography>
        </When>
        <CardInnerBox
          sx={{ height: "100%", py: BCDesignTokens.layoutPaddingMedium }}
        >
          <ProjectTable headless submissionPackages={pastSubmissionPackages} />
        </CardInnerBox>
      </Box>
    </Box>
  );
};
