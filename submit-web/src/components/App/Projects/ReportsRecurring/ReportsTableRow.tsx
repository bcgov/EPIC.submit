import { Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useNavigate } from "@tanstack/react-router";
import { SubmissionPackage } from "@/models/Package";
import { ConditionBadge } from "@/components/Shared/ConditionBadge";
import { SubmitLink } from "@/components/Shared/Text/SubmitLink";
import {
  StyledProjectTableCell,
  StyledProjectTableRow,
} from "@/components/App/Projects/ProjectTable/StyledComponents";
import { FrequencyBadge } from "./FrequencyBadge";
import { REPORTS_COLUMNS } from "./reportsColumns";

type ReportsTableRowProps = {
  reportPackage: SubmissionPackage;
};

const PLACEHOLDER = "-";

/**
 * A single obligation row: condition badge, linked submission name, frequency
 * badge, full (non-truncated) timing, and read-only Last Submitted / Status
 * placeholders announced to screen readers as "None".
 */
export const ReportsTableRow = ({ reportPackage }: ReportsTableRowProps) => {
  const navigate = useNavigate();
  const report = reportPackage.project_report;
  const displayName = report?.display_name ?? reportPackage.name;

  const onNameClick = () => {
    navigate({
      to: `/proponent/projects/${reportPackage.account_project_id}/submission-packages/${reportPackage.id}`,
    });
  };

  return (
    <StyledProjectTableRow>
      <StyledProjectTableCell align="left" sx={{ width: REPORTS_COLUMNS[0].width }}>
        <ConditionBadge
          conditionNumber={report?.condition_number}
          conditionSubsection={report?.condition_subsection}
        />
      </StyledProjectTableCell>
      <StyledProjectTableCell sx={{ width: REPORTS_COLUMNS[1].width }}>
        <SubmitLink
          sx={{
            display: "flex",
            alignItems: "center",
            color: BCDesignTokens.themeBlue90,
            textDecoration: "none",
            width: "fit-content",
          }}
          onClick={onNameClick}
        >
          <Typography
            fontSize="1rem"
            fontWeight="bold"
            color={BCDesignTokens.themeBlue90}
          >
            {displayName}
          </Typography>
        </SubmitLink>
      </StyledProjectTableCell>
      <StyledProjectTableCell align="left" sx={{ width: REPORTS_COLUMNS[2].width }}>
        <FrequencyBadge frequency={report?.frequency} />
      </StyledProjectTableCell>
      <StyledProjectTableCell align="left" sx={{ width: REPORTS_COLUMNS[3].width }}>
        <Typography fontSize="14px" sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
          {report?.timing ?? PLACEHOLDER}
        </Typography>
      </StyledProjectTableCell>
      <StyledProjectTableCell align="left" sx={{ width: REPORTS_COLUMNS[4].width }}>
        <span aria-label="None">{PLACEHOLDER}</span>
      </StyledProjectTableCell>
      <StyledProjectTableCell align="right" sx={{ width: REPORTS_COLUMNS[5].width }}>
        <span aria-label="None">{PLACEHOLDER}</span>
      </StyledProjectTableCell>
    </StyledProjectTableRow>
  );
};

export default ReportsTableRow;
