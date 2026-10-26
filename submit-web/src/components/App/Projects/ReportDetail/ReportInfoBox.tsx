import { Box, Link, Stack, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { ProjectReport } from "@/models/Package";
import { ConditionBadge } from "@/components/Shared/ConditionBadge";
import { FrequencyBadge } from "@/components/App/Projects/ReportsRecurring/FrequencyBadge";
import { AppConfig } from "@/utils/config";

type ReportInfoBoxProps = {
  report: ProjectReport;
};

const LABEL_COLOR = BCDesignTokens.themeGray70;
// Fixed label-column width so every value lines up in the same column.
const LABEL_WIDTH = "140px";

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Stack direction="row" spacing={2} sx={{
    alignItems: "center"
  }}>
    <Typography
      color={LABEL_COLOR}
      sx={{ width: LABEL_WIDTH, flexShrink: 0 }}
    >
      {label}
    </Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
      {children}
    </Box>
  </Stack>
);

/**
 * Read-only requirements panel for a report/notification phase page. Labels sit
 * in a fixed-width left column so their values align; shows Condition (badge
 * with this phase's subsection), Type, "Required in:" (phase, frequency badge,
 * timing), an optional "Also required in:" line, and a contact-the-EAO line.
 */
export const ReportInfoBox = ({ report }: ReportInfoBoxProps) => {
  const alsoRequiredIn = report.also_required_in_phases ?? [];

  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: "4px",
        border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
        p: "16px",
      }}
    >
      <Stack spacing={1.5}>
        <InfoRow label="Condition:">
          <ConditionBadge
            conditionNumber={report.condition_number}
            conditionSubsection={report.condition_subsection}
          />
        </InfoRow>

        <InfoRow label="Type:">
          <Typography sx={{
            color: "inherit"
          }}>{report.report_type ?? "-"}</Typography>
        </InfoRow>

        <InfoRow label="Required in:">
          <Typography
            sx={{
              color: "inherit",
              fontWeight: 700
            }}>
            {report.phase ?? "-"}
          </Typography>
          <FrequencyBadge frequency={report.frequency} />
          <Typography
            sx={{
              color: "inherit",
              fontSize: "14px"
            }}>
            {report.timing ?? ""}
          </Typography>
        </InfoRow>

        {alsoRequiredIn.length > 0 && (
          <InfoRow label="Also required in:">
            <Typography sx={{
              color: "inherit"
            }}>{alsoRequiredIn.join(", ")}</Typography>
          </InfoRow>
        )}

        <Typography
          sx={{
            color: "inherit",
            fontSize: "14px",
            pt: 0.5
          }}>
          If this information is incorrect, please contact the EAO at{" "}
          <Link href={`mailto:${AppConfig.supportMpEmail}`}>
            {AppConfig.supportMpEmail}
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
};

export default ReportInfoBox;
