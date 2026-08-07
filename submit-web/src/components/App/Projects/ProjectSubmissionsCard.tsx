import ProjectTable from "@/components/App/Projects/ProjectTable";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { SubmissionPackage } from "@/models/Package";
import { ACCOUNT_USER_PERMISSIONS } from "@/models/Role";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import AddIcon from "@mui/icons-material/Add";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  styled,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useState } from "react";
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
  workId?: number;
  onNewSubmission: (workId?: number, isManagementPlan?: boolean) => void;
};

export const ProjectSubmissionsCard = ({
  title,
  status,
  packages,
  isWorkRelated = false,
  workId,
  onNewSubmission,
}: ProjectSubmissionsCardProps) => {
  const { userType } = useAccount();
  const [reviewCompletedOpen, setReviewCompletedOpen] = useState(false);

  const isManagementPlan = !isWorkRelated;

  const activeSubmissionPackages = packages?.filter(
    (subPackage) => !subPackage.completed_on,
  );
  const pastSubmissionPackages = packages?.filter((subPackage) =>
    Boolean(subPackage.completed_on),
  );

  return (
    <Box
      sx={{
        borderRadius: "4px",
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
        mb: 1,
        p: 2,
        pt: 0,
      }}
    >
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        sx={{
          pt: BCDesignTokens.layoutPaddingMedium,
          pb: BCDesignTokens.layoutPaddingLarge,
        }}
      >
        <SubmissionTitle customTitle={title} customStatus={status} />
        <When condition={userType === USER_TYPE.PROPONENT}>
          <CardInnerBox>
            <PermissionsGate scopes={[ACCOUNT_USER_PERMISSIONS.CREATE_PACKAGE]}>
              <Button onClick={() => onNewSubmission(workId, !isWorkRelated)}>
                <AddIcon sx={{ p: 0, mr: 0.5 }} />
                New Submission
              </Button>
            </PermissionsGate>
          </CardInnerBox>
        </When>
      </Box>
      <Box height={"100%"}>
        <When condition={!isWorkRelated}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              backgroundColor: BCDesignTokens.themeGold10,
              borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              padding: `${BCDesignTokens.layoutPaddingSmall} ${BCDesignTokens.layoutPaddingMedium}`,
            }}
          >
            Active Submissions
          </Typography>
        </When>
        <CardInnerBox
          sx={{ height: "100%", p: 0 }}
        >
          <ProjectTable
            isManagementPlan={isManagementPlan}
            submissionPackages={activeSubmissionPackages}
          />
        </CardInnerBox>
        <When condition={!isWorkRelated && pastSubmissionPackages.length > 0}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              cursor: "pointer",
              userSelect: "none",
              backgroundColor: BCDesignTokens.themeGold10,
              borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              padding: `${BCDesignTokens.layoutPaddingSmall} ${BCDesignTokens.layoutPaddingMedium}`,
            }}
            onClick={() => setReviewCompletedOpen((prev) => !prev)}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600 }}
              >
                Review Completed by the EAO
              </Typography>
              <Chip
                label={pastSubmissionPackages.length}
                size="small"
                sx={{
                  backgroundColor: BCDesignTokens.themeBlue20,
                  border: `1px solid ${BCDesignTokens.themePrimaryBlue}`,
                  borderRadius: "10px",
                  fontWeight: 600,
                  height: "22px",
                }}
              />
            </Box>
            <IconButton size="small" sx={{ ml: 0.5, p: 0.25, alignSelf: "flex-end" }}>
              {reviewCompletedOpen ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
          <Collapse in={reviewCompletedOpen}>
            <CardInnerBox
              sx={{
                height: "100%",
                p: 0,
              }}
            >
              <ProjectTable
                headless
                isManagementPlan={isManagementPlan}
                submissionPackages={pastSubmissionPackages}
              />
            </CardInnerBox>
          </Collapse>
        </When>
        <When condition={isWorkRelated && pastSubmissionPackages.length > 0}>
          <CardInnerBox
            sx={{ height: "100%", p: 0 }}
          >
            <ProjectTable
              headless
              isManagementPlan={false}
              submissionPackages={pastSubmissionPackages}
            />
          </CardInnerBox>
        </When>
      </Box>
    </Box>
  );
};
