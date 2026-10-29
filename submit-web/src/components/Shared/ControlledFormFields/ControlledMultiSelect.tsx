import { FC } from "react";
import {
  TextField,
  TextFieldProps,
  Autocomplete,
  Chip,
  Box,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";
import get from "lodash/get";
import { mergeSlotProps } from "@mui/material/utils";
import { BCDesignTokens } from "epic.theme";

export type OptionType = { value: string; label: string };

type IFormInputProps = {
  name: string;
  options: OptionType[];
  sx?: any;
  TextFieldProps?: TextFieldProps;
  multiple?: boolean;
  selectAll?: boolean;
};

const ControlledMultiSelect: FC<IFormInputProps> = ({
  name,
  options,
  TextFieldProps,
  multiple = false,
  selectAll = false,
  ...otherProps
}) => {
  const {
    control,
    formState: { defaultValues, errors },
  } = useFormContext();

  const extendedOptions: OptionType[] = selectAll
    ? [{ value: "All", label: "All" }, ...options]
    : options;

  const defaultValue: OptionType[] = Array.isArray(defaultValues?.[name])
    ? (defaultValues[name] as OptionType[])
    : [];

  const errorMessage = get(errors, name)?.message as string | undefined;

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue}
      render={({ field: { onChange, onBlur, ref, value } }) => {
        const selectedValues = extendedOptions.filter((option) =>
          (Array.isArray(value) ? value : []).includes(option.value),
        );

        return (
          <Box sx={{ width: "100%" }} data-form-field={name}>
            {/* Display selected options as chips */}
            {selectedValues.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  my: 1,
                }}
              >
                {selectedValues.map((selected) => (
                  <Chip
                    key={selected.value}
                    label={selected.label}
                    onDelete={() => {
                      const newSelection = selectedValues.filter(
                        (item) => item.value !== selected.value,
                      );
                      onChange(newSelection.map((item) => item.value));
                    }}
                    deleteIcon={<CloseIcon />}
                    sx={{
                      fontSize: "inherit",
                      fontFamily: "inherit",
                      verticalAlign: "middle",
                      marginBottom: "5px",
                      marginY: "5px",
                      backgroundColor:
                        BCDesignTokens.surfaceColorBackgroundLightBlue,
                      "& .MuiChip-deleteIcon": {
                        color: BCDesignTokens.surfaceColorBackgroundDarkBlue,
                        borderRadius: "0",
                        backgroundColor: "transparent",
                        marginLeft: "5px",
                        fontSize: "20px",
                      },
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Hidden Autocomplete input field */}
            <Autocomplete
              {...otherProps}
              multiple={multiple}
              onBlur={onBlur}
              options={extendedOptions.filter(
                (option) =>
                  !selectedValues.some(
                    (selected) => selected.value === option.value,
                  ),
              )} // Hide selected values from dropdown
              value={selectedValues}
              autoComplete
              isOptionEqualToValue={(option, val) => option.value === val.value}
              getOptionLabel={(option: OptionType) => option?.label ?? ""}
              onChange={(_, newValue) => {
                if (!Array.isArray(newValue)) {
                  onChange([]);
                  return;
                }

                if (selectAll && newValue.some((v) => v.value === "All")) {
                  onChange(options.map((opt) => opt.value));
                } else {
                  onChange(newValue.map((v) => v.value));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...TextFieldProps}
                  {...params}
                  inputRef={ref}
                  error={Boolean(get(errors, name)?.message)}
                  helperText={errorMessage || ""}
                  slotProps={{
                    ...params.slotProps,
                    input: mergeSlotProps(TextFieldProps?.slotProps?.input, { ...params.slotProps.input, startAdornment: null }),
                    htmlInput: mergeSlotProps(TextFieldProps?.slotProps?.htmlInput, params.slotProps.htmlInput),
                    inputLabel: mergeSlotProps(TextFieldProps?.slotProps?.inputLabel, params.slotProps.inputLabel)
                  }}
                />
              )}
            />
          </Box>
        );
      }}
    />
  );
};

export default ControlledMultiSelect;
