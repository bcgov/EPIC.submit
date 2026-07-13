import { ProjectStatus } from "@/components/Shared/ProjectStatus";
import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type NewSubmissionCardProps = {
  children: React.ReactElement;
  mainLabel?: string;
  topLabel?: string;
  bottomLabel?: string;
  submissionName?: string;
  status?: string;
  barTitle?: string;
};

export function NewSubmissionCard({
  children,
  mainLabel = "",
  topLabel = "",
  bottomLabel = "",
  submissionName,
  status,
  barTitle = "New Submission",
}: NewSubmissionCardProps) {
  return (
    <ContentBox
      mainLabel={mainLabel}
      topLabel={topLabel}
      bottomLabel={bottomLabel}
    >
      <Box
        sx={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          borderRadius: "4px",
          border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          gap: BCDesignTokens.layoutPaddingSmall,
        }}
      >
        {submissionName && (
          <Typography variant="h4" fontWeight={400}>
            {submissionName}
          </Typography>
        )}
        {status && <ProjectStatus status={status} />}
        <Box
          sx={{
            padding: "8px 16px 16px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            borderRadius: "4px",
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
            gap: BCDesignTokens.layoutPaddingSmall,
          }}
        >
          <BarTitle title={barTitle} />
          {children}
        </Box>
      </Box>
    </ContentBox>
  );
}
