import { FormControlLabel, Radio } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type Option = {
  label: string;
  value: string | number | boolean;
};

type CustomRadioOptionsProps = {
  options: Option[];
  error?: boolean;
  disabled?: boolean;
  onChange?: (value: string | number | boolean) => void;
};

export const CustomRadioOptions = ({
  options,
  error = false,
  disabled = false,
  onChange,
}: CustomRadioOptionsProps) => {
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
      {options.map(({ label, value }) => (
        <FormControlLabel
          key={value.toString()}
          value={value}
          control={
            <Radio
              sx={sx}
              disabled={disabled}
              onChange={() => onChange && onChange(value)}
            />
          }
          label={label}
        />
      ))}
    </>
  );
};
