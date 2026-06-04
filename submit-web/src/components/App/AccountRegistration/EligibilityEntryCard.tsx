import { Box, Typography, Divider } from "@mui/material";
import { ProjectStatus } from "@/components/App/registration/addProjects/ProjectStatus";
import {
  getProjectStatus,
  PROJECT_STATUS,
} from "@/components/App/registration/addProjects/ProjectCard/constants";
import { BCDesignTokens } from "epic.theme";
import { EligibilityEntry } from "@/store/proponentStore";

type EligibilityEntryCardProps = {
  entry: EligibilityEntry;
};

export const EligibilityEntryCard = ({ entry }: EligibilityEntryCardProps) => {
  const status = entry.current_phase ? getProjectStatus(entry.current_phase) : PROJECT_STATUS.POST_DECISION;

  return (
    <Box
      sx={{
        border: `4px solid ${BCDesignTokens.themePrimaryGold}`,
        borderRadius: BCDesignTokens.layoutBorderRadiusLarge,
        padding: 0,
        display: "inline-block",
        boxShadow:
          "0 0.6px 1.8px 0 rgba(0, 0, 0, 0.10), 0 3.2px 7.2px 0 rgba(0, 0, 0, 0.13)",
        minWidth: 360,
        maxWidth: 420,
      }}
    >
      <Box
        sx={{
          padding: "12px 24px",
          borderTopLeftRadius: BCDesignTokens.layoutBorderRadiusMedium,
          borderTopRightRadius: BCDesignTokens.layoutBorderRadiusMedium,
          background: BCDesignTokens.themeBlue10,
        }}
      >
        <Typography variant="h6">{entry.project_name}</Typography>
      </Box>
      <Box
        sx={{
          p: 1.5,
          pt: 4.5,
          borderBottomLeftRadius: BCDesignTokens.layoutBorderRadiusMedium,
          borderBottomRightRadius: BCDesignTokens.layoutBorderRadiusMedium,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 0px 6px 1px rgba(0, 0, 0, 0.10)",
          }}
        >
          <Typography variant="h4" fontWeight={400} px={1.5} pt={1}>
            {entry.current_work}
          </Typography>
          <Box px={1} pb={1}>
            <ProjectStatus status={status} />
          </Box>
          <Divider sx={{ borderColor: BCDesignTokens.themeGray40 }} />
          <Typography variant="body1" px={1.5} py={1.5}>
            Submit your Initial Project Description &amp; Engagement Plan, and
            any other additional documents for the {entry.current_phase} Phase.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
