import { Chip } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { formatConditionLabel } from "./utils";

type ConditionBadgeProps = {
  conditionNumber?: number | string | null;
  conditionSubsection?: string | null;
};

/**
 * Shared condition number badge: navy border, light blue fill, 4px corners.
 * Shows the condition number with its subsection (e.g. 7.2) and never a "#".
 */
export const ConditionBadge = ({
  conditionNumber,
  conditionSubsection,
}: ConditionBadgeProps) => {
  const label = formatConditionLabel(conditionNumber, conditionSubsection);

  if (!label) {
    return null;
  }

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        backgroundColor: BCDesignTokens.themeBlue10,
        border: `1px solid ${BCDesignTokens.themeBlue100}`,
        borderRadius: "4px",
        color: BCDesignTokens.themeBlue100,
        height: "20px",
        fontSize: "0.7rem",
        fontWeight: "bold",
      }}
    />
  );
};

export default ConditionBadge;
