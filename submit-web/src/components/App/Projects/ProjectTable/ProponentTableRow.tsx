import { ArrowForwardIos } from "@mui/icons-material";
import dateUtils from "@/utils/dateUtils";
import { Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmissionPackage } from "@/models/Package";
import { PackageStatusChipStack } from "@/components/App/PackageStatusChip/PackageStatusChipStack";
import {
  StyledProjectTableCell,
  StyledProjectTableRow,
} from "@/components/App/Projects/ProjectTable/StyledComponents";
import EmptyRow from "@/components/App/Projects/ProjectTable/EmptyRow";
import { useNavigate } from "@tanstack/react-router";
import { SubmitLink } from "@/components/Shared/Text/SubmitLink";
import { useManagementPlanName } from "@/hooks/useManagementPlanName";

interface ProjectRowProps {
  subPackage: SubmissionPackage;
}

export default function ProponentTableRow({ subPackage }: ProjectRowProps) {
  const navigate = useNavigate();
  const onSubmissionClick = () => {
    navigate({
      to: `/proponent/projects/${subPackage.account_project_id}/submission-packages/${subPackage.id}`,
    });
  };

  const managementPlanName = useManagementPlanName(subPackage);

  return (
    <>
      <StyledProjectTableRow>
        <StyledProjectTableCell sx={{ py: 0 }} width={"55%"}>
          <SubmitLink
            sx={{
              display: "flex",
              alignItems: "center",
              color: BCDesignTokens.themeBlue90,
              textDecoration: "none",
              width: "fit-content",
            }}
            onClick={onSubmissionClick}
          >
            <Typography
              variant="h6"
              color={BCDesignTokens.themeBlue90}
              fontWeight={"500"}
              sx={{ mr: 0.5 }}
            >
              {managementPlanName}
            </Typography>
            <ArrowForwardIos fontSize="small" />
          </SubmitLink>
        </StyledProjectTableCell>
        <StyledProjectTableCell align="left" width={"15%"}>
          {dateUtils.formatDate(subPackage.submitted_on)}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="left" width={"15%"}>
          {subPackage.submitted_by ?? ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          width={"15%"}
          align="right"
          sx={{
            pr: BCDesignTokens.layoutPaddingSmall,
          }}
        >
          <PackageStatusChipStack submissionPackage={subPackage} />
        </StyledProjectTableCell>
      </StyledProjectTableRow>
      <EmptyRow colSpan={4} />
    </>
  );
}
