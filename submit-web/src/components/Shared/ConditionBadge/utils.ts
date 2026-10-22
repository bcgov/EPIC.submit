/**
 * Formats a condition number and optional subsection into a display label,
 * e.g. 7 + "2" -> "7.2". Returns null when there is no condition number.
 */
export const formatConditionLabel = (
  conditionNumber?: number | string | null,
  conditionSubsection?: string | null,
): string | null => {
  if (
    conditionNumber === null ||
    conditionNumber === undefined ||
    conditionNumber === ""
  ) {
    return null;
  }
  const base = String(conditionNumber);
  if (conditionSubsection) {
    return `${base}.${conditionSubsection}`;
  }
  return base;
};
