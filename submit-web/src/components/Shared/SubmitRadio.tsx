import { FormControlLabel, Radio } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type SubmitRadioProps = {
  value: string | number | boolean;
  label: string;
  error?: boolean;
  disabled?: boolean;
};
export const SubmitRadio = ({
  value,
  label,
  error = false,
  disabled = false,
}: SubmitRadioProps) => {
  const sx = [
    disabled && {
      color: `${BCDesignTokens.typographyColorDisabled} !important`,
    },
    error && {
      color: BCDesignTokens.surfaceColorPrimaryDangerButtonDefault,
    },
  ];

  return (
    <FormControlLabel
      value={value}
      control={<Radio sx={sx} disabled={disabled} />}
      label={label}
    />
  );
};
