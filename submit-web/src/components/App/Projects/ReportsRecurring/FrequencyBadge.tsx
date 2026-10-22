import { Box } from "@mui/material";
import { getFrequencyColors } from "./frequencyColors";

type FrequencyBadgeProps = {
  frequency?: string | null;
};

/**
 * 11px pill-shaped frequency badge, styled distinctly from status badges.
 * Renders the raw frequency value unchanged.
 */
export const FrequencyBadge = ({ frequency }: FrequencyBadgeProps) => {
  if (!frequency) {
    return null;
  }

  const colors = getFrequencyColors(frequency);

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        padding: "2px 8px",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "10px",
        border: `1px solid ${colors.border}`,
        background: colors.background,
        color: colors.color,
        fontSize: "11px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        width: "fit-content",
      }}
    >
      {frequency}
    </Box>
  );
};

export default FrequencyBadge;
