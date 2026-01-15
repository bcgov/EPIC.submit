import React, { FC } from "react";
import { TextField, TextFieldProps } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { BCDesignTokens } from "epic.theme";
import get from "lodash/get";
import { IMaskInput } from "react-imask";

// Type for the masked input props
interface CustomMaskedInputProps {
  mask: string;
  definitions?: Record<string, RegExp>;
  inputRef: React.Ref<unknown>;
  onChange: (value: string) => void;
}

const CustomMaskedInput = React.forwardRef<
  HTMLInputElement,
  CustomMaskedInputProps
>(function CustomMaskedInput(props, ref) {
  const { mask, definitions, onChange, ...other } = props;

  return (
    <IMaskInput
      {...other}
      mask={mask}
      definitions={definitions}
      inputRef={ref}
      onAccept={onChange} // Directly handle masked input change
    />
  );
});

type IFormInputProps = {
  name: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputEffects?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => string;
  maxLength?: number;
  mask?: string;
} & TextFieldProps;

const ControlledTextField: FC<IFormInputProps> = ({
  name,
  inputEffects,
  maxLength,
  mask,
  onChange: onInputChange,
  ...otherProps
}) => {
  const {
    control,
    formState: { errors, defaultValues },
  } = useFormContext();

  const error = get(errors, name);
  const helperText = error?.message ?? " ";
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={get(defaultValues, `${name}`) ?? ""}
      render={({ field }) => {
        // Create onChange handler for masked input
        const handleMaskedChange = (value: string) => {
          // Handle masked input change
          field.onChange(value);
          // Create a synthetic event for onInputChange if provided
          if (onInputChange) {
            const syntheticEvent = {
              target: { value },
            } as React.ChangeEvent<HTMLInputElement>;
            onInputChange(syntheticEvent);
          }
        };

        const inputProps = mask
          ? {
              inputComponent:
                CustomMaskedInput as unknown as React.ComponentType<
                  CustomMaskedInputProps
                >,
              inputProps: {
                mask,
                onChange: handleMaskedChange,
              } as CustomMaskedInputProps,
            }
          : {};

        return (
          <TextField
            {...field}
            inputProps={{
              maxLength: maxLength,
              ...otherProps.inputProps,
            }}
            onChange={(e) => {
              // Only handle onChange for non-masked inputs
              if (!mask) {
                if (onInputChange) {
                  onInputChange(e);
                }
                if (inputEffects && e.target) {
                  e.target.value = inputEffects(e);
                }
                if (e.target) {
                  field.onChange(e.target.value);
                }
              }
            }}
            error={!!error}
            FormHelperTextProps={{
              sx: { color: BCDesignTokens.typographyColorDanger },
            }}
            helperText={String(helperText)}
            InputProps={inputProps as any}
            {...otherProps}
          />
        );
      }}
    />
  );
};

export default ControlledTextField;
