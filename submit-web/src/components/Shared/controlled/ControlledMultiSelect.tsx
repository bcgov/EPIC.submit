import { FC } from "react";
import { TextField, TextFieldProps, Autocomplete } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

export type OptionType = { value: string; label: string };

type IFormInputProps = {
  name: string;
  options: OptionType[];
  sx?: any;
  TextFieldProps?: TextFieldProps;
  multiple?: boolean;
  selectAll?: boolean;
} & TextFieldProps;

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
    setValue,
  } = useFormContext();

  // Ensure "All" follows the same structure
  const extendedOptions: OptionType[] = selectAll
    ? [{ value: "All", label: "All" }, ...options]
    : options;

  const defaultValue =
    defaultValues && defaultValues[name] ? defaultValues[name] : [];

  const errorMessage = errors[name]?.message;

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue} // Ensure default is always an array
      render={({ field: { onChange, value } }) => {
        // Convert stored `value` (array of IDs) into an array of objects
        const selectedValues = extendedOptions.filter((option) =>
          (Array.isArray(value) ? value : []).includes(option.value)
        );

        return (
          <Autocomplete
            {...otherProps}
            multiple={multiple}
            options={extendedOptions}
            value={selectedValues} // MUI expects an array of objects
            autoComplete
            isOptionEqualToValue={(option, val) => option.value === val.value}
            getOptionLabel={(option) => option?.label ?? ""}
            onChange={(event, newValue) => {
              if (!Array.isArray(newValue)) {
                onChange([]);
                return;
              }

              // Handle "All" selection
              if (selectAll && newValue.some((v) => v.value === "All")) {
                setValue(
                  name,
                  options.map((opt) => opt.value)
                ); // Store only IDs
              } else {
                setValue(
                  name,
                  newValue.map((v) => v.value) // Store only the `value` (ID)
                );
              }
            }}
            renderInput={(params) => (
              <TextField
                {...TextFieldProps}
                {...params}
                error={Boolean(errors[name]?.message)}
                helperText={errorMessage || ""}
              />
            )}
          />
        );
      }}
    />
  );
};

export default ControlledMultiSelect;
