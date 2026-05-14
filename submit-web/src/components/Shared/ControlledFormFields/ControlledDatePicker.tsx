import React from "react";
import { FormControl, FormHelperText } from "@mui/material";
import { DatePicker, DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Controller, useFormContext } from "react-hook-form";
import dayjs, { Dayjs } from "dayjs";
import { get } from "lodash";
import { DATE_FORMAT } from "@/utils/dateUtils";

type IFormInputProps = {
  name: string;
  hideError?: boolean;
} & DatePickerProps<Dayjs>;

const ControlledDatePicker: React.FC<IFormInputProps> = ({
  name,
  hideError = false,
  ...otherProps
}) => {
  const {
    control,
    formState: { defaultValues, errors },
  } = useFormContext();

  const error = get(errors, name);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <FormControl error={Boolean(error)}>
        <Controller
          control={control}
          name={name}
          defaultValue={defaultValues?.[name] ?? null}
          render={({ field }) => {
            const { value, onChange, ...restField } = field;

            const dateValue = value ? dayjs(value) : null;

            return (
              <DatePicker
                {...otherProps}
                {...restField}
                value={dateValue}
                format={DATE_FORMAT}
                onChange={(newValue) => {
                  onChange(newValue ?? null);
                }}
              />
            );
          }}
        />
        {error && !hideError && (
          <FormHelperText>{error.message?.toString()}</FormHelperText>
        )}
      </FormControl>
    </LocalizationProvider>
  );
};

export default ControlledDatePicker;
