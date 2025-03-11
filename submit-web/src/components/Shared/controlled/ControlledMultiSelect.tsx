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
    setValue,
  } = useFormContext();

  // Ensure "All" follows the same structure
  const extendedOptions: OptionType[] = selectAll
    ? [{ value: "All", label: "All" }, ...options]
    : options;

  const defaultValue: OptionType[] = Array.isArray(defaultValues?.[name])
    ? (defaultValues[name] as OptionType[])
    : [];

  const errorMessage = errors[name]?.message as string | undefined;

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
            defaultValue={defaultValue}
            options={extendedOptions}
            value={selectedValues} // MUI expects an array of objects
            autoComplete
            isOptionEqualToValue={(option, val) => option.value === val.value}
            getOptionLabel={(option: OptionType) => option?.label ?? ""}
            onChange={(_, newValue) => {
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
