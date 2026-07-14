import { FC } from "react";
import {
  TextField,
  TextFieldProps,
  MenuItem,
  IconButton,
  InputAdornment,
  Box,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { get } from "lodash";
import { BCDesignTokens } from "epic.theme";
import CloseIcon from "@mui/icons-material/Close";

export type SelectOptionType = {
  value: string | number;
  label: string;
  sublabel?: string;
};

type IFormInputProps = {
  name: string;
  options: SelectOptionType[];
  clearable?: boolean;
  placeholder?: string;
} & Omit<TextFieldProps, "name" | "select" | "placeholder">;

const ControlledSelect: FC<IFormInputProps> = ({
  name,
  options,
  clearable = true,
  placeholder,
  children,
  ...otherProps
}) => {
  const {
    control,
    formState: { defaultValues, errors },
  } = useFormContext();
  console.log(options);
  const error = get(errors, name);
  const helperText = error?.message ?? " ";

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={get(defaultValues, name, "")}
      render={({ field }) => (
        <TextField
          {...field}
          select
          error={!!error}
          FormHelperTextProps={{
            sx: { color: BCDesignTokens.typographyColorDanger },
          }}
          helperText={String(helperText)}
          SelectProps={{
            displayEmpty: true,
            sx: {
              "& .MuiSelect-icon": {
                fontSize: "1.5rem",
              },
            },
            endAdornment:
              clearable && field.value ? (
                <InputAdornment position="end" sx={{ mr: 2 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      field.onChange("");
                    }}
                    sx={{ p: 0.5 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            renderValue: (selected: unknown) => {
              if (!selected && selected !== 0) {
                return placeholder ? (
                  <span style={{ color: "#9e9e9e" }}>{placeholder}</span>
                ) : null;
              }
              const selectedOption = options.find(
                (opt) => String(opt.value) === String(selected),
              );
              return selectedOption?.label ?? String(selected);
            },
          }}
          {...otherProps}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <span>{option.label}</span>
                {option.sublabel && (
                  <span style={{ fontSize: "14px", color: "#757575" }}>
                    {option.sublabel}
                  </span>
                )}
              </Box>
            </MenuItem>
          ))}
          {children}
        </TextField>
      )}
    />
  );
};

export default ControlledSelect;
