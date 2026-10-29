import React, { useRef } from "react";
import { FormControl } from "@mui/material";
import { DatePicker, DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Controller, useFormContext } from "react-hook-form";
import dayjs, { type Dayjs } from "dayjs";
import type { FieldRef } from "@mui/x-date-pickers/models";
import { get } from "lodash";
import { mergeSlotProps, setRef } from "@mui/material/utils";
import { DATE_FORMAT } from "@/utils/dateUtils";

type IFormInputProps = {
  name: string;
  hideError?: boolean;
} & DatePickerProps;

const ControlledDatePicker: React.FC<IFormInputProps> = ({
  name,
  hideError = false,
  slotProps,
  onChange: onValueChange,
  ...otherProps
}) => {
  const pickerFieldRef = useRef<FieldRef<Dayjs | null> | null>(null);
  const {
    control,
    formState: { defaultValues, errors },
  } = useFormContext();

  const error = get(errors, name);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <FormControl error={Boolean(error)} data-form-field={name}>
        <Controller
          control={control}
          name={name}
          defaultValue={defaultValues?.[name] ?? null}
          render={({ field }) => {
            const { value, onChange, onBlur, ref, ...restField } = field;

            const dateValue = value ? dayjs(value) : null;

            return (
              <DatePicker
                {...otherProps}
                {...restField}
                inputRef={(input: HTMLInputElement | null) => {
                  ref(input ? {
                    focus: () => pickerFieldRef.current?.focusField(0),
                    select: () => { pickerFieldRef.current?.focusField(0); pickerFieldRef.current?.setSelectedSections("all"); },
                    setCustomValidity: input.setCustomValidity.bind(input),
                    reportValidity: input.reportValidity.bind(input),
                  } : null);
                }}
                slotProps={{
                  ...slotProps,
                  field: (ownerState) => {
                    const props = typeof slotProps?.field === "function" ? slotProps.field(ownerState) : slotProps?.field;
                    return {
                      ...props,
                      fieldRef: (instance: FieldRef<Dayjs | null> | null) => {
                        pickerFieldRef.current = instance;
                        setRef(props?.fieldRef, instance);
                      },
                    };
                  },
                  textField: mergeSlotProps(slotProps?.textField, {
                    onBlur,
                    ...(error ? { error: true } : {}),
                    helperText: !hideError ? error?.message?.toString() : undefined,
                  }),
                }}
                value={dateValue}
                format={DATE_FORMAT}
                onChange={(newValue, context) => {
                  onChange(newValue ?? null);
                  onValueChange?.(newValue, context);
                }}
              />
            );
          }}
        />
      </FormControl>
    </LocalizationProvider>
  );
};

export default ControlledDatePicker;
