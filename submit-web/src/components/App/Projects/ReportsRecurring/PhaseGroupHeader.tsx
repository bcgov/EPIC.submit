import { Box, Chip, Typography } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { BCDesignTokens } from "epic.theme";
import { buildGroupCountAriaLabel } from "./reportsGrouping";

type PhaseGroupHeaderProps = {
  phase: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
};

/**
 * Collapsible phase-group header: a keyboard-operable button that exposes its
 * expanded/collapsed state and announces the phase name and obligation count.
 * Uses the same gold bar and blue count badge as "Review Completed by the EAO".
 */
export const PhaseGroupHeader = ({
  phase,
  count,
  expanded,
  onToggle,
}: PhaseGroupHeaderProps) => {
  return (
    <Box
      component="button"
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={buildGroupCountAriaLabel(phase, count)}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        cursor: "pointer",
        userSelect: "none",
        textAlign: "left",
        border: "none",
        backgroundColor: BCDesignTokens.themeGold10,
        borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
        padding: `${BCDesignTokens.layoutPaddingSmall} ${BCDesignTokens.layoutPaddingMedium}`
      }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1
        }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {phase}
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
      {expanded ? (
        <ExpandLessIcon fontSize="small" />
      ) : (
        <ExpandMoreIcon fontSize="small" />
      )}
    </Box>
  );
};

export default PhaseGroupHeader;
