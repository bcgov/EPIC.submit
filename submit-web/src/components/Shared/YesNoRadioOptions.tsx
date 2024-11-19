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
      color: `${BCDesignTokens.typographyColorDisabled} !important`,
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
