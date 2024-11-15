import { FormControlLabel, Radio } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const YES = true;
export const NO = false;

type IYesNoRadioOptionsProps = {
  error: boolean;
  disabled?: boolean;
};
export const YesNoRadioOptions = ({
  error = true,
  disabled = false,
}: IYesNoRadioOptionsProps) => {
  const sx = [
    disabled && {
      "&.Mui-checked": {
        color: BCDesignTokens.iconsColorDisabled,
      },
      "&.MuiFormControlLabel-label": {
        color: BCDesignTokens.typographyColorPrimary,
      },
    },
    error && {
      color: BCDesignTokens.surfaceColorPrimaryDangerButtonDefault,
    },
  ];

  return (
    <>
      <FormControlLabel
        value={YES}
        control={<Radio sx={sx} disabled={disabled} />}
        label="Yes"
      />
      <FormControlLabel
        value={NO}
        control={<Radio sx={sx} disabled={disabled} />}
        label="No"
      />
    </>
  );
};
