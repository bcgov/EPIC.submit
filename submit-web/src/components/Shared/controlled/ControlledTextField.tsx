import React, { FC } from "react";
import { TextField, TextFieldProps } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { BCDesignTokens } from "epic.theme";
import get from "lodash/get";

type IFormInputProps = {
  name: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputEffects?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => string;
  maxLength?: number;
} & TextFieldProps;

const ControlledTextField: FC<IFormInputProps> = ({
  name,
  inputEffects,
  maxLength,
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
      render={({ field }) => (
        <TextField
          {...field}
          inputProps={{
            maxLength: maxLength,
          }}
          onChange={(e) => {
            if (onInputChange) {
              onInputChange(e);
            }
            if (inputEffects) {
              e.target.value = inputEffects(e);
            }
            field.onChange(e.target.value);
          }}
          error={!!error}
          FormHelperTextProps={{
            sx: { color: BCDesignTokens.typographyColorDanger },
          }}
          helperText={String(helperText)}
          {...otherProps}
        />
      )}
    />
  );
};

export default ControlledTextField;
