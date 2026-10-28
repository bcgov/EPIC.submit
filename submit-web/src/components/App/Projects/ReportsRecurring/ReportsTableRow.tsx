import { Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useNavigate } from "@tanstack/react-router";
import { SubmissionPackage } from "@/models/Package";
import { ConditionBadge } from "@/components/Shared/ConditionBadge";
import { SubmitLink } from "@/components/Shared/Text/SubmitLink";
import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import {
  StyledProjectTableCell,
  StyledProjectTableRow,
} from "@/components/App/Projects/ProjectTable/StyledComponents";
import dateUtils from "@/utils/dateUtils";
import { FrequencyBadge } from "./FrequencyBadge";
import { ReportsAudience, getReportStatus } from "./reportStatus";

type ReportsTableRowProps = {
  reportPackage: SubmissionPackage;
  audience?: ReportsAudience;
};

const PLACEHOLDER = "-";

const NonePlaceholder = () => <span aria-label="None">{PLACEHOLDER}</span>;

/**
 * A single obligation row: condition badge, linked submission name, frequency
 * badge, full (non-truncated) timing, the most recent Date Submitted, and the
 * report status. Column widths come from the shared <colgroup>, so no per-cell
 * widths are set here. "-" cells are announced to screen readers as "None".
 */
export const ReportsTableRow = ({
  reportPackage,
  audience = "proponent",
}: ReportsTableRowProps) => {
  const navigate = useNavigate();
  const report = reportPackage.project_report;
  const displayName = report?.display_name ?? reportPackage.name;

  const lastSubmitted = reportPackage.last_submitted_on
    ? dateUtils.formatDate(reportPackage.last_submitted_on)
    : null;
  const status = getReportStatus(reportPackage.status);

  const onNameClick = () => {
    const path =
      audience === "staff"
        ? `/staff/projects/${reportPackage.account_project_id}/reports/${reportPackage.id}`
        : `/proponent/projects/${reportPackage.account_project_id}/reports/${reportPackage.id}`;
    navigate({ to: path });
  };

  return (
    <StyledProjectTableRow>
      <StyledProjectTableCell align="left">
        <ConditionBadge
          conditionNumber={report?.condition_number}
          conditionSubsection={report?.condition_subsection}
        />
      </StyledProjectTableCell>
      <StyledProjectTableCell>
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
            color={BCDesignTokens.themeBlue90}
            sx={{
              fontSize: "1rem",
              fontWeight: "bold"
            }}>
            {displayName}
          </Typography>
        </SubmitLink>
      </StyledProjectTableCell>
      <StyledProjectTableCell align="left">
        <FrequencyBadge frequency={report?.frequency} />
      </StyledProjectTableCell>
      <StyledProjectTableCell align="left">
        <Typography
          sx={{
            fontSize: "14px",
            lineHeight: "1.2rem",
            whiteSpace: "normal",
            wordBreak: "break-word"
          }}>
          {report?.timing ?? PLACEHOLDER}
        </Typography>
      </StyledProjectTableCell>
      <StyledProjectTableCell align="left">
        {lastSubmitted ? (
          <Typography sx={{
            fontSize: "14px"
          }}>{lastSubmitted}</Typography>
        ) : (
          <NonePlaceholder />
        )}
      </StyledProjectTableCell>
      <StyledProjectTableCell align="right">
        {status ? (
          <SubmissionStatusChip status={status} showIcon />
        ) : (
          <NonePlaceholder />
        )}
      </StyledProjectTableCell>
    </StyledProjectTableRow>
  );
};

export default ReportsTableRow;