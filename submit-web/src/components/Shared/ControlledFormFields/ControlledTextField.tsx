import React, { type FC } from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import type { InputBaseComponentProps } from "@mui/material/InputBase";
import { mergeSlotProps } from "@mui/material/utils";
import { Controller, useFormContext } from "react-hook-form";
import { BCDesignTokens } from "epic.theme";
import get from "lodash/get";
import { IMaskInput } from "react-imask";

interface CustomMaskedInputProps extends InputBaseComponentProps {
  mask?: string;
  definitions?: Record<string, RegExp>;
  onValueChange?: (value: string) => void;
}

const CustomMaskedInput = React.forwardRef<HTMLInputElement, CustomMaskedInputProps>(
  function CustomMaskedInput({ mask = "", definitions, onValueChange, ...props }, ref) {
    return <IMaskInput {...props} mask={mask} definitions={definitions} inputRef={ref} onAccept={onValueChange} />;
  },
);

type IFormInputProps = {
  name: string;
  inputEffects?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => string;
  maxLength?: number;
  mask?: string;
} & TextFieldProps;

const ControlledTextField: FC<IFormInputProps> = ({
  name, inputEffects, maxLength, mask, slotProps,
  onChange: onInputChange, onBlur: onInputBlur, ...otherProps
}) => {
  const { control, formState: { errors, defaultValues } } = useFormContext();
  const error = get(errors, name);

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={get(defaultValues, name) ?? ""}
      render={({ field: { ref, ...field } }) => {
        const handleMaskedChange = (value: string) => {
          field.onChange(value);
          onInputChange?.({ target: { value, name } } as React.ChangeEvent<HTMLInputElement>);
        };
        const handleBlur = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          field.onBlur();
          onInputBlur?.(event);
        };
        const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          if (mask) return;
          onInputChange?.(event);
          if (inputEffects) event.target.value = inputEffects(event);
          field.onChange(event.target.value);
        };
        return (
          <TextField
            {...otherProps}
            {...field}
            inputRef={ref}
            data-form-field={name}
            error={Boolean(error)}
            helperText={error?.message?.toString() ?? otherProps.helperText ?? " "}
            onBlur={handleBlur}
            onChange={handleChange}
            slotProps={{
              ...slotProps,
              input: (ownerState) => {
                const external = typeof slotProps?.input === "function" ? slotProps.input(ownerState) : slotProps?.input;
                const input = mergeSlotProps(external, { onChange: handleChange, onBlur: handleBlur });
                return mask ? {
                  ...input,
                  inputComponent: CustomMaskedInput,
                  inputProps: { ...input?.inputProps, mask, onValueChange: handleMaskedChange },
                } : input ?? {};
              },
              htmlInput: mergeSlotProps(slotProps?.htmlInput, { maxLength }),
              formHelperText: mergeSlotProps(slotProps?.formHelperText, {
                sx: error ? { color: BCDesignTokens.typographyColorDanger } : {},
              }),
            }}
          />
        );
      }}
    />
  );
};

export default ControlledTextField;
