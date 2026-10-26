import { Box, Chip, Collapse, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useState } from "react";
import { SubmissionPackage } from "@/models/Package";
import { SubmissionTitle } from "@/components/App/Submission/SubmissionTitle";
import { PROJECT_STATUS } from "@/components/Shared/ProjectStatus/constants";
import { ALL_PHASES, REPORTS_EMPTY_STATE_MESSAGE } from "./constants";
import { groupReportsByPhase, buildGroupCountAriaLabel } from "./reportsGrouping";
import { ReportsTable } from "./ReportsTable";
import { PhaseGroupHeader } from "./PhaseGroupHeader";
import { CardInnerBox } from "@/components/App/Projects/ProjectSubmissionsCard";

type ReportsRecurringCardProps = {
  reportPackages: SubmissionPackage[];
};

const AllPhasesHeader = ({ count }: { count: number }) => (
  <Box
    aria-label={buildGroupCountAriaLabel(ALL_PHASES, count)}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      backgroundColor: BCDesignTokens.themeGold10,
      borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
      padding: `${BCDesignTokens.layoutPaddingSmall} ${BCDesignTokens.layoutPaddingMedium}`
    }}>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {ALL_PHASES}
    </Typography>
    <Chip
      label={count}
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
);

const CollapsiblePhaseGroup = ({
  phase,
  reportPackages,
}: {
  phase: string;
  reportPackages: SubmissionPackage[];
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <PhaseGroupHeader
        phase={phase}
        count={reportPackages.length}
        expanded={expanded}
        onToggle={() => setExpanded((prev) => !prev)}
      />
      <Collapse in={expanded}>
        <CardInnerBox sx={{ height: "100%", p: 0 }}>
          <ReportsTable headless reportPackages={reportPackages} />
        </CardInnerBox>
      </Collapse>
    </>
  );
};

/**
 * Read-only "Reports & Recurring Submissions" section. Lists synced report
 * obligations grouped by phase: "All Phases" is always expanded and not
 * collapsible; other phases are collapsed by default behind accessible toggles.
 */
export const ReportsRecurringCard = ({
  reportPackages,
}: ReportsRecurringCardProps) => {
  const groups = groupReportsByPhase(reportPackages);
  const hasObligations = groups.length > 0;

  return (
    <Box
      data-testid="reports-recurring-card"
      sx={{
        borderRadius: "4px",
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
        mb: 1,
        p: 2,
        pt: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          pt: BCDesignTokens.layoutPaddingMedium,
          pb: BCDesignTokens.layoutPaddingLarge
        }}>
        <SubmissionTitle
          customTitle="Reports & Recurring Submissions"
          customStatus={PROJECT_STATUS.POST_DECISION}
        />
      </Box>

      {!hasObligations && (
        <Typography variant="body2" sx={{ py: 2 }}>
          {REPORTS_EMPTY_STATE_MESSAGE}
        </Typography>
      )}

      {hasObligations && (
        <Box sx={{
          height: "100%"
        }}>
          {groups.map((group) =>
            group.isAlwaysExpanded ? (
              <Box key={group.phase}>
                <AllPhasesHeader count={group.packages.length} />
                <CardInnerBox sx={{ height: "100%", p: 0 }}>
                  <ReportsTable reportPackages={group.packages} />
                </CardInnerBox>
              </Box>
            ) : (
              <CollapsiblePhaseGroup
                key={group.phase}
                phase={group.phase}
                reportPackages={group.packages}
              />
            ),
          )}
        </Box>
      )}
    </Box>
  );
};

export default ReportsRecurringCard;
