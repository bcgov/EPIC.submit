import { Box } from "@mui/material";
import { getFrequencyColors } from "./frequencyColors";

type FrequencyBadgeProps = {
  frequency?: string | null;
};

/**
 * 11px pill-shaped frequency badge, styled distinctly from status badges.
 * Renders the raw frequency value unchanged. The badge is 22px tall overall
 * (16px line-height content + 3px top/bottom padding) with regular-weight text.
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
        padding: "3px 8px",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "10px",
        border: `1px solid ${colors.border}`,
        background: colors.background,
        color: colors.color,
        fontSize: "11px",
        lineHeight: "16px",
        fontWeight: 400,
        boxSizing: "border-box",
        whiteSpace: "nowrap",
        width: "fit-content",
      }}
    >
      {frequency}
    </Box>
  );
};

export default FrequencyBadge;