import { BCDesignTokens } from "epic.theme";

type FrequencyColors = {
  border: string;
  background: string;
  color: string;
};

export const FREQUENCY_AS_NEEDED = "As Needed";
export const FREQUENCY_ONE_TIME = "One Time";

// Recurring frequency values that all share the gold styling.
export const RECURRING_FREQUENCIES = [
  "Annually",
  "Semi-Annually",
  "Quarterly",
  "Monthly",
  "Weekly",
];

const RED: FrequencyColors = {
  border: "#CE3E39",
  background: "#F4E1E2",
  color: BCDesignTokens.typographyColorPrimary,
};

const PURPLE: FrequencyColors = {
  border: "#6A54A3",
  background: "#DAD4E8",
  color: BCDesignTokens.typographyColorPrimary,
};

const GOLD: FrequencyColors = {
  border: "#F8BB47",
  background: "#FEF1D8",
  color: BCDesignTokens.typographyColorPrimary,
};

// "Other" styling is to be defined; fall back to a neutral treatment for now.
const NEUTRAL: FrequencyColors = {
  border: BCDesignTokens.surfaceColorBorderMedium,
  background: BCDesignTokens.surfaceColorBackgroundLightGray,
  color: BCDesignTokens.typographyColorPrimary,
};

/**
 * Resolves the colour treatment for a frequency value:
 * As Needed (red), One Time (purple), recurring values (gold), otherwise neutral.
 */
export const getFrequencyColors = (
  frequency?: string | null,
): FrequencyColors => {
  if (!frequency) {
    return NEUTRAL;
  }
  if (frequency === FREQUENCY_AS_NEEDED) {
    return RED;
  }
  if (frequency === FREQUENCY_ONE_TIME) {
    return PURPLE;
  }
  if (RECURRING_FREQUENCIES.includes(frequency)) {
    return GOLD;
  }
  return NEUTRAL;
};
