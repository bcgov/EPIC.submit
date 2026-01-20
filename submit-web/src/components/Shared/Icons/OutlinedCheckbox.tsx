import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIconOutlined from '@mui/icons-material/CheckBoxOutlined';
import IndeterminateCheckBoxIconOutlined from '@mui/icons-material/IndeterminateCheckBoxOutlined';
import { Checkbox, CheckboxProps } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type OutlinedCheckboxProps = CheckboxProps & {
  isItemSuccessful?: boolean;
};

export const OutlinedCheckbox = ({
  isItemSuccessful = false,
  ...props
}: OutlinedCheckboxProps) => {
  return (
    <Checkbox
      {...props}
        icon={<CheckBoxOutlineBlankIcon />}
        checkedIcon={<CheckBoxIconOutlined />}
        indeterminateIcon={<IndeterminateCheckBoxIconOutlined />}
        sx={{ 
            p: 0,
            color: BCDesignTokens.iconsColorSecondary,
            '&.Mui-checked': {
            color: BCDesignTokens.iconsColorSecondary,
            },
            '&.MuiCheckbox-indeterminate': {
            color: BCDesignTokens.iconsColorSecondary,
            },
            ...(isItemSuccessful && {
                color: BCDesignTokens.iconsColorSuccess,
                '&.Mui-checked': {
                color: BCDesignTokens.iconsColorSuccess,
                },
            }),
        }}
    />
  );
};